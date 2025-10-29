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

    if (!this.useOpenAI && !this.useAnthropic) {
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
3. If about interview scheduling/confirmation, classify as "interview".
4. If mentions offer/package/compensation/onboarding, classify as "offer".
5. If application rejected or not selected, classify as "rejected".
6. If about application or status updates, classify as "application".
7. If self-sent and no response for long time, classify as "ghost".
8. If introducing new recruiter/headhunter, classify as "application".
9. For general news/marketing/newsletters/updates, classify as "other".
10. If contains unsubscribe/preferences/newsletter/daily update, prioritize as "other".
11. Must output only one category: application/interview/offer/rejected/ghost/other.

Examples:
- Example 1 → "application":
  Subject: "Your application was received"
  Body: "Thank you for applying. Our team will review your resume."
- Example 2 → "interview":
  Subject: "Interview availability"
  Body: "We would like to schedule a technical interview next week."
- Example 3 → "offer":
  Subject: "Offer details"
  Body: "We are pleased to offer you the position with a starting salary..."
- Example 4 → "rejected":
  Subject: "Application update"
  Body: "We appreciate your interest but will not move forward."
- Example 5 → "application":
  Subject: "Intro: You x Recruiter"
  Body: "Let me introduce you to our recruiter who is hiring for several roles."
- Example 6 → "other":
  Subject: "LinkedIn Newsletter: Design Trends"
  Body: "Stay updated with the latest industry news..."

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
   * Check if this is an outbound job application email
   */
  isOutboundJobApplication(email) {
    const subject = (email.subject || '').toLowerCase();
    const text = `${subject} ${email.snippet || ''}`.toLowerCase();
    const from = (email.from || '').toLowerCase();
    
    const isFromUser = from.includes('@gmail.com') || 
                      email.threadLabels?.includes('SENT');
    
    if (!isFromUser) return false;
    
    const APPLICATION_KEYWORDS = [
      'application', 'applying', 'portfolio', 'resume', 'cv',
      'cover letter', 'position', 'job opening', 'opportunity', 'role'
    ];
    
    return APPLICATION_KEYWORDS.some(keyword => text.includes(keyword));
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
      'opportunity', 'resume', 'cv', 'employment'
    ];

    const text = `${email.subject} ${email.snippet} ${email.from}`.toLowerCase();
    return baseKeywords.some(k => text.includes(k));
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

    // First try quick checks
    if (this.isLinkedInJobAlert(email)) {
      return this.createResult('application', 'high', 'linkedin-job-alert');
    }

    if (this.isOutboundJobApplication(email)) {
      return this.createResult('application', 'high', 'outbound-application');
    }

    // Fall back to AI classification
    if (this.useOpenAI || this.useAnthropic) {
      try {
        const prompt = this.buildPrompt(email);

        if (this.useOpenAI) {
          const result = await this.classifyWithOpenAI(prompt);
          if (result) {
            await cache.set(cacheKey, result);
            return result;
          }
        }

        if (this.useAnthropic) {
          const result = await this.classifyWithAnthropic(prompt);
          if (result) {
            await cache.set(cacheKey, result);
            return result;
          }
        }
      } catch (error) {
        console.error('AI classification failed:', error.message);
      }
    }

    await cache.set(cacheKey, null, 60 * 60 * 1000);
    return null;
  }
}

module.exports = EmailClassifier;