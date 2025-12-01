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
  : 0;

class EmailClassifier {
  constructor(options = {}) {
    this.useOpenAI = false;
    this.useAnthropic = false;
    this.useGemini = false;

    const {
      openaiApiKey = process.env.OPENAI_API_KEY,
      anthropicApiKey = process.env.ANTHROPIC_API_KEY,
      geminiApiKey = process.env.GEMINI_API_KEY,
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

    if (enableAI && geminiApiKey && geminiApiKey !== 'your-gemini-key') {
      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        this.genAI = new GoogleGenerativeAI(geminiApiKey);
        this.geminiModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        this.useGemini = true;
        console.log('✓ Gemini classification enabled');
      } catch (error) {
        console.error('⚠ Failed to initialize Gemini SDK:', error.message);
      }
    }

    if (!this.useOpenAI && !this.useAnthropic && !this.useGemini) {
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
    const body = safe(email.body);
    const trimmedBody = body.length > 2000 ? `${body.slice(0, 2000)}...` : body;

    return `You are an assistant that classifies job-search related emails into one of five categories. Follow the rules strictly.

Categories:
- application: Job applications, resume submissions, status updates, alerts
- interview: Interview invitations and scheduling
- offer: Job offers, compensation details, onboarding
- rejected: Rejection notices
- ghost: No response for 30+ days
- other: Non-job related content

Instructions:
1. Base decisions on full email content. Use subject and summary if content is missing.
2. First check if job-related; return "other" if not.
3. **IMPORTANT**: If email is just a reminder to complete/finish application (not confirmation), classify as "other".
4. If email confirms application was RECEIVED/SUBMITTED, classify as "application".
5. If about interview scheduling/confirmation, classify as "interview".
6. If mentions offer/package/compensation/onboarding, classify as "offer".
7. If application rejected or not selected, classify as "rejected".
8. If self-sent and no response for long time, classify as "ghost".
9. If introducing new recruiter/headhunter, classify as "application".
10. For general news/marketing/newsletters/updates, classify as "other".
11. If contains unsubscribe/preferences/newsletter/daily update, prioritize as "other".
12. Must output only one category: application/interview/offer/rejected/ghost/other.

Examples:
- Example 1 → "application":
  Subject: "Your application was received"
  Body: "Thank you for applying. Our team will review your resume."
  
- Example 2 → "other":
  Subject: "Don't forget to complete your application to Informa"
  Body: "Almost there! We saved your application for you. Click to continue."
  Reason: This is a reminder to complete, not a confirmation of submission.
  
- Example 3 → "other":
  Subject: "The Morning: E-bike injuries"
  Body: "Today's news roundup from The New York Times..."
  Reason: Newsletter, not job-related.
  
- Example 4 → "application":
  Subject: "Your application as Junior Graphic Designer"
  Body: "We have received your job application and will begin our review process..."
  Reason: Confirmation that application was received.
  
- Example 5 → "interview":
  Subject: "Interview availability"
  Body: "We would like to schedule a technical interview next week."
  
- Example 6 → "offer":
  Subject: "Offer details"
  Body: "We are pleased to offer you the position with a starting salary..."
  
- Example 7 → "rejected":
  Subject: "Application update"
  Body: "We appreciate your interest but will not move forward."
  
- Example 8 → "application":
  Subject: "Intro: You x Recruiter"
  Body: "Let me introduce you to our recruiter who is hiring for several roles."

Email to classify:
Subject: "${safe(email.subject)}"
Body: "${trimmedBody}"

Respond with only one label (lowercase).`;
  }

  parseCategory(rawText) {
    if (!rawText) return null;

    let text = rawText;

    if (Array.isArray(text)) {
      text = text.join(' ');
    }

    text = text.toString().trim().toLowerCase();

    const validCategories = ['application', 'interview', 'offer', 'rejected', 'ghost', 'other'];
    if (validCategories.includes(text)) {
      return text;
    }

    return null;
  }

  createResult(category, confidence = 'medium', method = 'ai', extras = {}) {
    if (!category) return null;

    const labelConfig = JOB_LABELS.find(label => label.name.toLowerCase() === category);
    if (!labelConfig) return null;

    return {
      label: labelConfig.name,
      confidence,
      method,
      reason: extras.reason || `Classified by ${method}`,
      ...extras,
      config: labelConfig
    };
  }

  async classifyWithOpenAI(prompt) {
    if (!this.openai) return null;

    try {
      const completion = await this.openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: OPENAI_TEMPERATURE
      });

      const category = this.parseCategory(completion.choices[0]?.message?.content);
      if (!category) {
        console.warn('[classifier][openai] Invalid category:', completion.choices[0]?.message?.content);
        return null;
      }

      return this.createResult(category, 'medium', 'openai-ai', {
        rawResponse: completion
      });
    } catch (error) {
      console.error('OpenAI classification failed:', error.message);
      return null;
    }
  }

  async classifyWithAnthropic(prompt) {
    if (!this.anthropic) return null;

    try {
      const response = await this.anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 10,
        temperature: 0,
        system: "You are an email classifier that only outputs one word category labels.",
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

  async classifyWithGemini(prompt) {
    if (!this.useGemini) return null;

    try {
      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const category = this.parseCategory(text);
      if (!category) {
        console.warn('[classifier][gemini] Invalid category:', text);
        return null;
      }

      return this.createResult(category, 'medium', 'gemini-ai', {
        rawResponse: text
      });
    } catch (error) {
      console.error('Gemini classification failed:', error.message);
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

    console.log(`[DEBUG] isOutbound? from="${from}" isFromUser=${isFromUser} subject="${subject}"`);

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

    const text = `${email.subject || ''} ${email.snippet || ''} ${email.from || ''} ${email.body || ''}`.toLowerCase();

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
   * Main classification method
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

    // Skip finance/receipt emails
    if (this.isFinanceReceipt(email)) {
      return null;
    }

    // Skip newsletters
    if (this.isNewsletter(email)) {
      console.log('⏭️  Skipping newsletter email');
      return null;
    }

    // Skip LinkedIn reminders (not actual application confirmations)
    if (this.isLinkedInReminder(email)) {
      console.log('⏭️  Skipping LinkedIn reminder email');
      return null;
    }

    // Skip job alert/discovery emails (not actual applications)
    if (this.isLinkedInJobAlert(email)) {
      console.log('⏭️  Skipping LinkedIn job alert email');
      return null;
    }

    // Skip personal emails
    const PERSONAL_SENDERS = ['mwang73151@aol.com'];
    if (PERSONAL_SENDERS.some(s => (email.from || '').toLowerCase().includes(s))) {
      console.log('⏭️  Skipping personal email');
      return null;
    }

    // Skip application reminders (verify account, complete application, etc.)
    const REMINDER_PATTERNS = [
      /verify your account to finalise your application/i,
      /complete your application/i,
      /finish your application/i,
      /reminder:.*application/i,
      /action required:.*application/i
    ];

    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();
    const text = `${subject} ${body}`;

    if (REMINDER_PATTERNS.some(p => p.test(text))) {
      console.log('⏭️  Skipping application reminder email');
      return null;
    }

    // Skip generic job discovery/alert emails
    // subject, body, and text are already defined above or need to be reused
    // We can reuse the 'text' variable from above or just use the existing variables if they are in scope.
    // However, looking at the code structure, the previous block defined them.
    // Let's just use the existing variables if they are available, or re-assign if needed.

    // Actually, to avoid confusion and errors, I will just use the variables without redeclaring them.
    // But since I can't see the full scope easily, I'll assume they might be redeclared in the block I just added.
    // Wait, the previous block I added:
    // const subject = ...
    // const body = ...
    // const text = ...

    // And the block BELOW (which was existing code) ALSO has:
    // const subject = ...
    // const body = ...
    // const text = ...

    // So I need to remove the declarations in the block BELOW.

    const JOB_ALERT_PATTERNS = [
      /job alert/i,
      /your job alert/i,
      /jobs? for you/i,
      /new jobs?/i,
      /recommended jobs?/i,
      /we found \d+ jobs?/i,
      /\d+ new jobs?/i,
      /job recommendations/i,
      /daily job alert/i,
      /weekly job alert/i
    ];

    if (JOB_ALERT_PATTERNS.some(pattern => pattern.test(text))) {
      console.log('⏭️  Skipping job alert/discovery email');
      return null;
    }

    if (this.isOutboundJobApplication(email)) {
      return this.createResult('application', 'high', 'outbound-application');
    }

    // Phrase-based heuristics before AI (improves accuracy without cost)
    const looksGenericContent = /\b(how to|guide|newsletter|daily update|tips|blog)\b/.test(subject);

    const phraseRules = [
      // Application confirmations - expanded patterns
      { pattern: /(application (was )?received|thank you for applying|we received your application)/, category: 'application' },
      { pattern: /(your application (to|for|as)|application to|application for)/, category: 'application' },
      { pattern: /(application was viewed|viewed your application|application reviewed)/, category: 'application' },
      // Specific GitHub confirmation
      { pattern: /thank you for including github in your job search/i, category: 'application' },
      // Removed generic "job alert" patterns that were causing false positives
      { pattern: /(now hiring|hiring in )/, category: 'application' },
      // Job discovery alerts - kept only specific ones that might be relevant, removed generic "found jobs"
      { pattern: /(\bnew jobs? in\b)/, category: 'application' },
      // Interview
      { pattern: /(interview|schedule d?an interview|availability for interview|invite(d)? you to interview)/, category: 'interview' },
      // Offer: require stronger patterns to avoid generic "special offer" matches
      { pattern: /(job offer|offer letter|offer details|accept (the )?offer|start date|compensation|onboarding)/, category: 'offer' },
      // Rejection - expanded patterns
      { pattern: /(reject|not (be )?moving forward|no longer moving forward|decline your application|will not be moving forward|unfortunately.*not)/, category: 'rejected' }  // UPDATED: added "will not be moving forward"
    ];

    for (const rule of phraseRules) {
      if (rule.pattern.test(text)) {
        if (rule.category === 'offer' && looksGenericContent) {
          // Skip weak offer when subject looks like generic content
          continue;
        }
        return this.createResult(rule.category, 'high', 'rule-phrase');
      }
    }

    // 3. AI Classification (fallback if no keyword match)
    // 3. AI Classification (fallback if no keyword match)
    if (this.enableAI) {
      const prompt = this.buildPrompt(email);
      let aiResult = null;

      // Try Gemini first (fast & cheap)
      if (this.useGemini) {
        aiResult = await this.classifyWithGemini(prompt);
      }

      // Fallback to OpenAI
      if (!aiResult && this.useOpenAI) {
        aiResult = await this.classifyWithOpenAI(prompt);
      }

      // Fallback to Anthropic
      if (!aiResult && this.useAnthropic) {
        aiResult = await this.classifyWithAnthropic(prompt);
      }

      if (aiResult) {
        await cache.set(cacheKey, aiResult);
        return aiResult;
      }
    }

    await cache.set(cacheKey, null, 60 * 60 * 1000);
    return null;
  }
}

module.exports = EmailClassifier;