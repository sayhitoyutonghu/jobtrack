const { JOB_LABELS } = require('../config/labels');
const fs = require('fs').promises;
const path = require('path');

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

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229';
const GEMINI_TEMPERATURE = Number.isFinite(Number(process.env.GEMINI_TEMPERATURE))
  ? Number(process.env.GEMINI_TEMPERATURE)
  : 0.1;

// System Prompt for improved accuracy in distinguishing 'interview' from 'confirmation'
const SYSTEM_PROMPT = `你是一个专业的招聘邮件分析助手。你的任务是从邮件内容中提取招聘状态。

请严格遵循以下逻辑判断：

1. **APPLIED (已申请)**: 仅仅是系统自动回复 "We received your application" 或 "Thanks for applying"。即使邮件里提到了 "interview" 这个词（例如 "timeline for interview"），只要没有明确邀请你聊天，都属于此项。

2. **INTERVIEW (面试)**: 明确的邀请。关键词包括 "schedule a time", "availability", "chat", "phone screen", "technical round"。

3. **REJECTED (拒绝)**: 包含 "unfortunately", "pursue other candidates", "not moving forward"。

4. **OFFER (录用)**: 包含 "offer letter", "congratulations", "compensation"。

请输出纯 JSON 格式，包含两个字段：

- "status": 上述四个状态之一

- "confidence": 你的判断确信度 (Low/Medium/High)

以下是供你学习的案例 (Few-Shot Examples):

案例 1 (易错 - 只是确认信):

用户输入: "Subject: Application Received. Body: Thanks for applying. We will review your resume and if you are a match for the interview, we will contact you."

你的输出: { "status": "APPLIED", "confidence": "High" }

案例 2 (面试邀请):

用户输入: "Subject: Chat regarding Designer role? Body: Hi, I'd love to chat about your background. Are you free next Tuesday?"

你的输出: { "status": "INTERVIEW", "confidence": "High" }

案例 3 (拒绝):

用户输入: "Subject: Update on your application. Body: Thank you for your interest. Unfortunately, we have decided to move forward with other candidates."

你的输出: { "status": "REJECTED", "confidence": "High" }`;

class EmailClassifier {
  constructor(options = {}) {
    this.useGemini = false;
    this.useAnthropic = false;

    const {
      geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
      anthropicApiKey = process.env.ANTHROPIC_API_KEY
    } = options;

    // Initialize Google Gemini API
    if (geminiApiKey && geminiApiKey !== 'your-api-key-here' && geminiApiKey !== '') {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        this.genAI = new GoogleGenerativeAI(geminiApiKey);
        // Initialize model with JSON response format
        this.model = this.genAI.getGenerativeModel({ 
          model: GEMINI_MODEL,
          generationConfig: {
            temperature: GEMINI_TEMPERATURE,
            responseMimeType: 'application/json' // Ensure JSON response format
          }
        });
        this.useGemini = true;
        console.log(`✓ Google Gemini classification enabled (model: ${GEMINI_MODEL})`);
      } catch (error) {
        console.error('⚠ Failed to initialize Google Gemini SDK:', error.message);
        if (error.stack) {
          console.error('Error stack:', error.stack);
        }
      }
    }

    // Fallback to Anthropic if Gemini is not available
    if (!this.useGemini && anthropicApiKey && anthropicApiKey !== 'sk-ant-your-key-here') {
      try {
        const Anthropic = require('@anthropic-ai/sdk');
        this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
        this.useAnthropic = true;
        console.log('✓ Anthropic classification enabled');
      } catch (error) {
        console.error('⚠ Failed to initialize Anthropic SDK:', error.message);
      }
    }

    if (!this.useGemini && !this.useAnthropic) {
      console.log('⚠ AI disabled (no valid API key provided)');
      console.log('   Please set GOOGLE_GEMINI_API_KEY or ANTHROPIC_API_KEY environment variable');
    }
  }

  /**
   * Build user prompt for AI classification (Gemini/Anthropic)
   * This is used for the 30% AI processing part
   */
  buildUserPrompt(email) {
    const safe = (value) => (value || '').toString().trim();
    const body = safe(email.body);
    const emailSnippet = body.length > 6000 ? `${body.slice(0, 6000)}...` : body;
    const emailSubject = safe(email.subject);

    return `Subject: ${emailSubject}\nBody: ${emailSnippet}`;
  }

  /**
   * Legacy prompt builder (kept for Anthropic compatibility)
   */
  buildPrompt(email) {
    const safe = (value) => (value || '').toString().trim();
    const body = safe(email.body);
    const trimmedBody = body.length > 6000 ? `${body.slice(0, 6000)}...` : body;

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

  /**
   * Parse AI response status and map to internal category
   * Maps: APPLIED -> application, INTERVIEW -> interview, REJECTED -> rejected, OFFER -> offer
   */
  parseAIStatus(aiResponse) {
    if (!aiResponse) return null;

    try {
      // Handle JSON string response
      let parsed;
      if (typeof aiResponse === 'string') {
        parsed = JSON.parse(aiResponse);
      } else if (typeof aiResponse === 'object') {
        parsed = aiResponse;
      } else {
        return null;
      }

      const status = parsed.status?.toUpperCase();
      const confidence = parsed.confidence || 'Medium';

      // Map AI status to internal category
      const statusMap = {
        'APPLIED': 'application',
        'INTERVIEW': 'interview',
        'REJECTED': 'rejected',
        'OFFER': 'offer'
      };

      const category = statusMap[status];
      if (!category) {
        console.warn('[classifier] Invalid AI status:', status);
        return null;
      }

      // Map confidence levels
      const confidenceMap = {
        'Low': 'low',
        'Medium': 'medium',
        'High': 'high'
      };

      return {
        category,
        confidence: confidenceMap[confidence] || 'medium',
        rawStatus: status
      };
    } catch (error) {
      console.warn('[classifier] Failed to parse AI response:', error.message);
      return null;
    }
  }

  /**
   * Legacy category parser (kept for backward compatibility)
   */
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

  /**
   * Classify email using Google Gemini API with optimized prompt and JSON response format
   * This is the 30% AI processing part that has been optimized
   */
  async classifyWithOpenAI(email) {
    // Note: Method name kept as classifyWithOpenAI for backward compatibility
    // but now uses Google Gemini API
    if (!this.useGemini || !this.model) {
      console.warn('[classifier][gemini] Gemini API not initialized');
      return null;
    }

    try {
      const userPrompt = this.buildUserPrompt(email);
      
      // Combine system prompt and user prompt for Gemini
      // Gemini doesn't have separate system/user roles, so we combine them
      const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      
      if (!response) {
        console.warn('[classifier][gemini] Empty response from API');
        return null;
      }

      // Get the JSON text from response
      let content;
      try {
        content = response.text();
      } catch (textError) {
        console.error('[classifier][gemini] Failed to extract text from response:', textError.message);
        // Try alternative method
        const candidates = response.candidates;
        if (candidates && candidates.length > 0 && candidates[0].content) {
          const parts = candidates[0].content.parts;
          if (parts && parts.length > 0 && parts[0].text) {
            content = parts[0].text;
          }
        }
        
        if (!content) {
          console.error('[classifier][gemini] Could not extract content from response');
          console.error('[classifier][gemini] Response structure:', JSON.stringify(response, null, 2));
          return null;
        }
      }

      if (!content || content.trim().length === 0) {
        console.warn('[classifier][gemini] Empty content in response');
        return null;
      }

      // Parse JSON response
      const parsed = this.parseAIStatus(content);
      if (!parsed) {
        console.warn('[classifier][gemini] Failed to parse response');
        console.warn('[classifier][gemini] Raw content:', content);
        return null;
      }

      return this.createResult(parsed.category, parsed.confidence, 'gemini-ai', {
        rawResponse: response,
        rawStatus: parsed.rawStatus,
        rawContent: content
      });
    } catch (error) {
      // Enhanced error handling
      if (error.message) {
        console.error('[classifier][gemini] Classification failed:', error.message);
      } else {
        console.error('[classifier][gemini] Classification failed with unknown error:', error);
      }
      
      // Log additional error details if available
      if (error.stack) {
        console.error('[classifier][gemini] Error stack:', error.stack);
      }
      
      // Handle specific Gemini API errors
      if (error.status) {
        console.error('[classifier][gemini] API status code:', error.status);
      }
      if (error.statusText) {
        console.error('[classifier][gemini] API status text:', error.statusText);
      }
      
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

    // Fall back to AI classification (30% AI processing part - optimized)
    if (this.useGemini || this.useAnthropic) {
      try {
        if (this.useGemini) {
          // Use optimized Google Gemini classification with new System Prompt
          const result = await this.classifyWithOpenAI(email);
          if (result) return result;
        }

        if (this.useAnthropic) {
          // Keep legacy prompt for Anthropic (backward compatibility)
          const prompt = this.buildPrompt(email);
          const result = await this.classifyWithAnthropic(prompt);
          if (result) return result;
        }
      } catch (error) {
        console.error('[classifier] AI classification failed:', error.message);
        if (error.stack) {
          console.error('[classifier] Error stack:', error.stack);
        }
      }
    }

    return null;
  }
}

module.exports = EmailClassifier;