const { JOB_LABELS } = require('../config/labels');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const PersistentCache = require('./persistent-cache.service');

/**
 * Email classifier service for job-related emails.
 * Classifies emails into categories: application, interview, offer, rejected, ghost, other.
 */

const CATEGORY_MAP = {
  application: 'Application',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  ghost: 'Ghost'
};

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229';
const OPENAI_TEMPERATURE = Number.isFinite(Number(process.env.OPENAI_TEMPERATURE))
  ? Number(process.env.OPENAI_TEMPERATURE)
  : 0.3;

class EmailClassifier {
  constructor(options = {}) {
    this.useOpenAI = false;
    this.useAnthropic = false;

    const {
      openaiApiKey = process.env.OPENAI_API_KEY,
      anthropicApiKey = process.env.ANTHROPIC_API_KEY,
      enableAI = true
    } = options;

    if (enableAI && openaiApiKey && openaiApiKey !== 'sk-your-key-here') {
      try {
        const { OpenAI } = require('openai');
        this.openai = new OpenAI({ apiKey: openaiApiKey });
        this.useOpenAI = true;
        console.log('✓ OpenAI classification enabled');
      } catch (error) {
        console.error('⚠ Failed to initialize OpenAI SDK:', error.message);
      }
    }



    if (enableAI && !this.useOpenAI && anthropicApiKey && anthropicApiKey !== 'sk-ant-your-key-here') {
      try {
        const Anthropic = require('@anthropic-ai/sdk');
        this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
        this.useAnthropic = true;
        console.log('✓ Anthropic classification enabled');
      } catch (error) {
        console.error('⚠ Failed to initialize Anthropic SDK:', error.message);
      }
    }

    // Only log if we EXPECTED AI to be enabled/it was requested but failed
    // If the instance was created with enableAI: false (e.g. detailed scan), don't log warning.
    if (this.enableAI && !this.useOpenAI && !this.useAnthropic) {
      console.log('⚠ AI disabled (no valid API key provided)');
    }
  }

  static getCache() {
    if (!this._cache) {
      this._cache = new PersistentCache({
        filePath: path.join(__dirname, '../data/cache-classify.json'),
        defaultTtlMs: 7 * 24 * 60 * 60 * 1000
      });
    }
    return this._cache;
  }

  static hashEmail(email) {
    const subject = (email?.subject || '').toString();
    const body = (email?.body || '').toString();
    return crypto.createHash('sha1').update(`${subject}\n${body}`).digest('hex');
  }

  buildPrompt(email) {
    const safe = (value) => (value || '').toString().trim();
    const subject = safe(email.subject);
    const body = safe(email.body);
    const combinedText = `Subject: ${subject}\n\n${body}`;
    // Truncate to avoid token limits (gpt-4o-mini has 128k context but good practice to limit input)
    const truncatedText = combinedText.length > 15000 ? combinedText.slice(0, 15000) : combinedText;

    return truncatedText;
  }

  parseCategory(rawText) {
    if (!rawText) return null;

    let text = rawText;
    if (Array.isArray(text)) text = text.join(' ');
    text = text.toString().trim();

    // Remove markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        // Fallback: Try to find the first '{' and last '}'
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
          const potentialJson = text.substring(firstOpen, lastClose + 1);
          try {
            json = JSON.parse(potentialJson);
          } catch (innerE) {
            throw e; // Throw original error if extraction fails too
          }
        } else {
          throw e;
        }
      }

      // Map confidence score to level
      let confidenceLevel = 'medium';
      const confidenceScore = json.confidence || 50;
      if (confidenceScore >= 80) confidenceLevel = 'high';
      else if (confidenceScore < 50) confidenceLevel = 'low';

      return {
        category: json.category?.toLowerCase() || 'other',
        company: json.company || 'Unknown',
        role: json.role || 'Unknown',
        salary: json.salary || 'Unknown',
        summary: json.summary || '',
        confidenceScore: confidenceScore,
        confidenceLevel: confidenceLevel
      };
    } catch (e) {
      // Fallback: simple string match (legacy behavior)
      console.warn('⚠ AI returned non-JSON, falling back to string match:', text);
      const lower = text.toLowerCase();
      const validCategories = ['application', 'interview', 'offer', 'rejected', 'ghost', 'other'];

      for (const cat of validCategories) {
        if (lower.includes(cat)) {
          return {
            category: cat,
            company: 'Unknown',
            role: 'Unknown',
            salary: 'Unknown',
            summary: '',
            confidenceScore: 30,
            confidenceLevel: 'low'
          };
        }
      }
      return {
        category: 'other',
        company: 'Unknown',
        role: 'Unknown',
        salary: 'Unknown',
        summary: '',
        confidenceScore: 20,
        confidenceLevel: 'low'
      };
    }
  }

  createResult(parsedData, confidence = 'medium', method = 'ai', extras = {}) {
    if (!parsedData) return null;

    let categoryName = parsedData;
    let extractedDetails = {};

    if (typeof parsedData === 'object') {
      categoryName = parsedData.category;
      extractedDetails = {
        company: parsedData.company,
        role: parsedData.role,
        salary: parsedData.salary,
        emailSnippet: parsedData.summary,
        confidenceScore: parsedData.confidenceScore,
        confidenceLevel: parsedData.confidenceLevel || confidence
      };
    }

    if (categoryName === 'other' || categoryName === 'promo') {
      return { isSkip: true };
    }

    const labelConfig = JOB_LABELS.find(label => label.name.toLowerCase() === categoryName);
    if (!labelConfig) return null;

    return {
      label: labelConfig.name,
      confidence: extractedDetails.confidenceLevel || confidence,
      method,
      reason: extras.reason || `Classified by ${method}`,
      ...extras,
      ...extractedDetails,
      config: labelConfig
    };
  }

  async classifyWithOpenAI(prompt) {
    if (!this.openai) return null;

    console.log('[AI] Classifying with OpenAI (gpt-4o-mini)...');

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // 🔥 Hardcoded to mini as requested
        messages: [
          {
            role: "system",
            content: `You are a recruiter assistant. Analyze the email:
          - category: "application_update" (applied/confirmed), "interview", "offer", "rejection", "job_alert" (newsletters), "other" (spam).
          - company: (string)
          - position: (string)
          - confidence: (number, 0-100)
          
          If category is "job_alert" or "other", confidence MUST be 0.
          Return JSON.`
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      // Check if filtered
      if (completion.choices[0].finish_reason === 'content_filter') {
        console.error('[AI] OpenAI refused content due to safety filters.');
        return null;
      }

      const content = completion.choices[0].message.content;
      console.log(`[AI Raw Response]: ${content}`);

      let result;
      try {
        result = JSON.parse(content);
      } catch (e) {
        console.warn('[AI] Failed to parse JSON response');
        return null;
      }

      console.log(`✅ [AI] Success: ${result.company} - ${result.category}`);

      // Map new categories to system labels
      // System labels: Application, Interview, Offer, Rejected, Ghost
      let systemLabel = 'Other';
      const cat = (result.category || '').toLowerCase();

      if (cat === 'application_update') systemLabel = 'Application';
      else if (cat === 'interview') systemLabel = 'Interview';
      else if (cat === 'offer') systemLabel = 'Offer';
      else if (cat === 'rejection') systemLabel = 'Rejected';
      else {
        // job_alert, other, or unknown -> Skip
        return { isSkip: true, reason: `Category: ${cat}` };
      }

      return {
        label: systemLabel,
        company: result.company || 'Unknown',
        role: result.position || 'Unknown', // mapped from position
        salary: 'Unknown', // Prompt didn't ask for salary specifically in user's snippet, setting unknown
        summary: '',
        confidence: result.confidence >= 80 ? 'high' : 'medium',
        method: 'openai-gpt-4o-mini'
      };

    } catch (error) {
      console.error("[AI] OpenAI Failed:", error.message);
      if (error.response) {
        console.error('[AI] Error Details:', error.response.data);
      }
      return null;
    }
  }

  async classifyWithAnthropic(prompt) {
    if (!this.anthropic) return null;

    try {
      const response = await this.anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 300,
        temperature: 0,
        system: "You are an email classifier that outputs JSON with category, confidence score, company, role, salary, and summary.",
        messages: [{ role: "user", content: prompt }]
      });

      const content = Array.isArray(response?.content)
        ? response.content.map(part => part.text || '').join(' ')
        : '';

      const category = this.parseCategory(content);
      if (!category) {
        console.warn('[classifier][anthropic] Invalid category:', content);
        return null;
      }

      return this.createResult(category, 'medium', 'anthropic-ai', {
        rawResponse: response
      });
    } catch (error) {
      console.error('Anthropic classification failed:', error.message);
      return null;
    }
  }




  /**
   * Check if this is a LinkedIn Job Alert email
   */
  isLinkedInJobAlert(email) {
    const subject = (email.subject || '').toLowerCase();
    const from = (email.from || '').toLowerCase();

    const isFromJobAlerts = from.includes('linkedin job alerts') ||
      from.includes('jobalerts-noreply@linkedin.com') ||
      from.includes('jobs-noreply@linkedin.com');

    if (!isFromJobAlerts) return false;

    const JOB_KEYWORDS = [
      'designer', 'developer', 'engineer', 'manager', 'intern',
      'job alert', 'new jobs', 'job recommendations',
      'salary', '$', '/year', '/hour'
    ];

    return JOB_KEYWORDS.some(keyword => subject.includes(keyword));
  }

  /**
   * Check if this is a newsletter email
   */
  isNewsletter(email) {
    const subject = (email.subject || '').toLowerCase();
    const from = (email.from || '').toLowerCase();
    const body = (email.body || '').toLowerCase();

    // Newsletter keywords in subject
    const NEWSLETTER_KEYWORDS = [
      'newsletter', 'daily update', 'weekly digest',
      'morning briefing', 'news roundup', 'the morning',
      'today\'s news', 'breaking news', 'latest news',
      'daily digest', 'weekly roundup'
    ];

    // News/media organizations
    const NEWS_SENDERS = [
      '@nytimes.com', '@wsj.com', '@ft.com', '@bloomberg.com',
      '@economist.com', '@reuters.com', '@apnews.com',
      '@substack.com', '@medium.com', '@news.', '@newsletter.',
      'nytdirect@', 'newsletters@'
    ];

    // Check newsletter keywords or news senders
    const isNewsletter = NEWSLETTER_KEYWORDS.some(k => subject.includes(k)) ||
      NEWS_SENDERS.some(s => from.includes(s));

    return isNewsletter;
  }

  /**
   * Check if this is a LinkedIn reminder email (not an application confirmation)
   */
  isLinkedInReminder(email) {
    const subject = (email.subject || '').toLowerCase();
    const from = (email.from || '').toLowerCase();
    const body = (email.body || '').toLowerCase();

    const isFromLinkedIn = from.includes('linkedin') ||
      from.includes('jobs-noreply@linkedin.com');

    if (!isFromLinkedIn) return false;

    // Reminder patterns (NOT confirmations)
    const REMINDER_PATTERNS = [
      /don't forget to (complete|finish)/i,
      /complete your application/i,
      /finish your application/i,
      /almost there/i,
      /we saved your application/i,
      /continue (your )?application/i,
      /resume (your )?application/i
    ];

    const text = `${subject} ${body}`;
    return REMINDER_PATTERNS.some(pattern => pattern.test(text));
  }

  /**
   * Check if this is an outbound job application email
   */
  isOutboundJobApplication(email) {
    const subject = (email.subject || '').toLowerCase();
    const text = `${subject} ${email.snippet || ''}`.toLowerCase();
    const from = (email.from || '').toLowerCase();

    const isFromUser = from.includes('@gmail.com') ||
      email.threadLabels?.includes('SENT');

    console.log(`[DEBUG] isOutbound ? from = "${from}" isFromUser = ${isFromUser} subject = "${subject}"`);

    if (!isFromUser) return false;

    const APPLICATION_KEYWORDS = [
      'application', 'applying', 'portfolio', 'resume', 'cv',
      'cover letter', 'position', 'job opening', 'opportunity', 'role'
    ];

    const match = APPLICATION_KEYWORDS.find(keyword => text.includes(keyword));
    console.log(`[DEBUG] isOutbound keyword match: ${match}`);
    return !!match;
  }

  /**
   * Explicit ignore: finance/receipt/billing emails
   */
  isFinanceReceipt(email) {
    const from = (email.from || '').toLowerCase();
    const subject = (email.subject || '').toLowerCase();
    const text = `${subject} ${(email.snippet || '').toLowerCase()}`;

    const FINANCE_KEYWORDS = [
      'receipt', 'invoice', 'payment', 'statement', 'order', 'subscription',
      'billing', 'charge', 'charged', 'invoice #', 'order confirmation'
    ];

    const FINANCE_SENDERS = [
      'billing@', 'no-reply@billing', 'receipts@', 'invoices@', 'accounts@',
      '@billing.', '@payments.', '@mail.stripe.com', '@paypal.com'
    ];

    return FINANCE_SENDERS.some(s => from.includes(s)) ||
      FINANCE_KEYWORDS.some(k => text.includes(k));
  }

  /**
   * Check if email is job-related
   */
  isJobRelated(email) {
    const baseKeywords = [
      'application', 'interview', 'position', 'role', 'job',
      'recruiter', 'hiring', 'candidate', 'offer', 'career',
      'opportunity', 'resume', 'cv', 'employment',
      // common phrases we saw being skipped
      'job alert', 'jobs for you', 'now hiring', 'application received',
      'thank you for applying', 'application was viewed', 'your application was viewed'
    ];

    const text = `${email.subject || ''} ${email.snippet || ''} ${email.from || ''} ${email.body || ''} `.toLowerCase();

    // DEBUG logging
    console.log('[DEBUG] isJobRelated check:');
    console.log('  Subject:', email.subject);
    console.log('  From:', email.from);
    console.log('  Body length:', (email.body || '').length);
    console.log('  Text preview:', text.substring(0, 300));

    const result = baseKeywords.some(k => text.includes(k));
    console.log('  Result:', result);

    return result;
  }

  /**
   * Main classification method - AGGRESSIVE MODE
   * All emails go through AI analysis for maximum accuracy
   */
  async classify(email) {
    if (!email || (!email.subject && !email.body)) {
      console.warn('Warning: Empty email provided');
      return null;
    }

    // Cache by subject+body to avoid repeated AI calls on re-runs
    const cacheKey = EmailClassifier.hashEmail(email);
    const cache = EmailClassifier.getCache();
    const cached = await cache.get(cacheKey);
    if (cached !== null) return cached;

    // ========== HARD FILTERS (Essential only) ==========
    // Only skip emails that are DEFINITELY not job-related

    // Skip finance/receipt emails (clear non-job emails)
    if (this.isFinanceReceipt(email)) {
      console.log('⏭️  Skipping finance/receipt email');
      await cache.set(cacheKey, null, 60 * 60 * 1000);
      return null;
    }

    // Skip personal emails (whitelist)
    const PERSONAL_SENDERS = ['mwang73151@aol.com'];
    if (PERSONAL_SENDERS.some(s => (email.from || '').toLowerCase().includes(s))) {
      console.log('⏭️  Skipping personal email');
      await cache.set(cacheKey, null, 60 * 60 * 1000);
      return null;
    }

    // Skip newsletter emails (clear non-job emails)
    if (this.isNewsletter(email)) {
      console.log('⏭️  Skipping newsletter email');
      await cache.set(cacheKey, null, 60 * 60 * 1000);
      return null;
    }

    // ========== AI PRIMARY CLASSIFICATION with FALLBACK ==========
    // ========== AI PRIMARY CLASSIFICATION with FALLBACK ==========
    const hasAI = this.useOpenAI || this.useAnthropic;

    if (!hasAI) {
      console.warn('⚠ No AI available, falling back to rule-based classification');
      return this.fallbackRuleBasedClassify(email, cache, cacheKey);
    }

    const prompt = this.buildPrompt(email);
    let primaryResult = null;
    let primaryModel = null;
    const aiModelsUsed = [];

    // Step 1: Try OpenAI (Primary)
    if (this.useOpenAI) {
      console.log('[AI] Classifying with OpenAI...');
      primaryResult = await this.classifyWithOpenAI(prompt);
      if (primaryResult) {
        if (primaryResult.isSkip) {
          console.log('⏭️  Skipping email (Category: Other/Promo) - WILL PERSIST AS SKIPPED');
          primaryResult.label = 'Other';
          primaryResult.company = 'Unknown';
          primaryResult.role = 'Unknown';
          // Do not return null, return the skip result so caller can save it
        }
        primaryModel = 'openai';
        aiModelsUsed.push('openai');
      } else {
        console.log('⚠️ OpenAI failed, attempting fallback...');
      }
    }

    // Step 2: Try Anthropic (Fallback)
    if (!primaryResult && this.useAnthropic) {
      console.log('[AI] Calling Anthropic (Fallback)...');
      primaryResult = await this.classifyWithAnthropic(prompt);
      if (primaryResult) {
        if (primaryResult.isSkip) {
          console.log('⏭️  Skipping email (Category: Other/Promo) - WILL PERSIST AS SKIPPED');
          primaryResult.label = 'Other';
          primaryResult.company = 'Unknown';
          primaryResult.role = 'Unknown';
        }
        primaryModel = 'anthropic';
        aiModelsUsed.push('anthropic');
      }
    }

    // If all AI models failed, use fallback
    if (!primaryResult) {
      console.warn('⚠ All AI models failed, using fallback classification');
      return this.fallbackRuleBasedClassify(email, cache, cacheKey);
    }

    // Ghost Job / Invalid Data Check
    // If we have a result but strictly missing Company or Role, reject it.
    // This allows the caller to treat it as "skipped" rather than saving "Unknown" data.
    if (!primaryResult.company || primaryResult.company === 'Unknown' ||
      !primaryResult.role || primaryResult.role === 'Unknown') {
      if (primaryResult.label !== 'Rejected') { // Allow "Rejected" emails to be vague
        console.warn(`👻 [Ghost Job] Skipped due to missing data (Company: ${primaryResult.company}, Role: ${primaryResult.role})`);
        return null;
      }
    }

    // Add metadata
    primaryResult.aiModelsUsed = aiModelsUsed;
    primaryResult.needsReview = false; // Simplified

    // Cache and return
    await cache.set(cacheKey, primaryResult);
    return primaryResult;
  }

  /**
   * Fallback rule-based classification when AI is unavailable
   */
  async fallbackRuleBasedClassify(email, cache, cacheKey) {
    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();
    const text = `${subject} ${body} `;

    // Check if outbound application
    if (this.isOutboundJobApplication(email)) {
      const result = this.createResult('application', 'high', 'outbound-application');
      await cache.set(cacheKey, result);
      return result;
    }

    // Phrase-based rules (priority order)
    const phraseRules = [
      { pattern: /(job offer|offer letter|offer details|accept (the )?offer|start date|compensation|onboarding)/, category: 'offer' },
      // Strict interview matching: must be an invitation or scheduling, NOT just the word "interview"
      { pattern: /(schedule d?an interview|availability for interview|invite(d)? you to interview|interview invitation|interview request|virtual interview)/, category: 'interview' },
      { pattern: /(reject|not (be |to )?moving forward|no longer moving forward|decline your application|will not be moving forward|unfortunately.*not)/, category: 'rejected' },
      { pattern: /(application (was )?received|thank you for applying|we received your application)/, category: 'application' },
      { pattern: /(your application (to|for|as)|application to|application for)/, category: 'application' },
    ];

    for (const rule of phraseRules) {
      if (rule.pattern.test(text)) {
        const result = this.createResult(rule.category, 'medium', 'rule-phrase');
        await cache.set(cacheKey, result);
        return result;
      }
    }

    // No match - return null
    await cache.set(cacheKey, null, 60 * 60 * 1000);
    return null;
  }
}

module.exports = EmailClassifier;