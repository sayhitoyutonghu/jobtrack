const { JOB_LABELS } = require('../config/labels');
const fs = require('fs').promises;
const path = require('path');

const CATEGORY_MAP = {
  application: 'Application',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  ghost: 'Ghost'
};

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
const OPENAI_TEMPERATURE = Number.isFinite(Number(process.env.OPENAI_TEMPERATURE))
  ? Number(process.env.OPENAI_TEMPERATURE)
  : 0;

class ClassifierService {
  constructor(options = {}) {
    if (typeof options === 'string') {
      options = { anthropicApiKey: options };
    }

    const {
      openaiApiKey = process.env.OPENAI_API_KEY,
      anthropicApiKey = process.env.ANTHROPIC_API_KEY,
      aiMinIntervalMs = process.env.AI_MIN_INTERVAL_MS
    } = options;

    this.useOpenAI = false;
    this.useAnthropic = false;
    const parsedInterval = Number(aiMinIntervalMs);
    this.aiMinIntervalMs = Number.isFinite(parsedInterval) && parsedInterval > 0 ? parsedInterval : 0;
    this.lastAIRequestAt = 0;

    if (openaiApiKey) {
      try {
        const { OpenAI } = require('openai');
        this.openai = new OpenAI({ apiKey: openaiApiKey });
        this.useOpenAI = true;
        console.log('✓ OpenAI classification enabled');
      } catch (error) {
        console.error('⚠ Failed to initialize OpenAI SDK:', error.message);
      }
    }

    if (!this.useOpenAI && anthropicApiKey && anthropicApiKey !== 'sk-ant-your-key-here') {
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

  buildPrompt(email) {
    const safe = (value) => (value || '').toString().trim();
    const body = safe(email.body);
    const trimmedBody = body.length > 6000 ? `${body.slice(0, 6000)}...` : body;

    return `You are an assistant that classifies job-search related emails into one of five categories. Follow the rules strictly.

Categories:
- application: 求职申请、投递简历、职位申请状态更新、职位提醒
- interview: 面试邀请、安排面试、面试跟进
- offer: 录用通知、offer 细节、入职说明
- rejected: 拒信、被拒绝通知
- ghost: 对方长期未回复（30+天无回应）
- other: 不属于求职相关内容

Instructions:
1. 基于完整邮件正文做判断。若正文缺失，用主题和摘要推断。
2. 优先判断是否与求职直接相关；非相关邮件返回 `other`。
3. 如果明确提到安排/确认面试，分类为 interview。
4. 如果提到 offer、package、compensation 或入职安排，分类为 offer。
5. 如果邮件说明申请被拒或未被选中，分类为 rejected。
6. 如果是申请或申请状态更新（提交、收到、查看），分类为 application。
7. 如果邮件是自己发出的、在跟进某职位但长期无回复，分类为 ghost。
8. 如果是介绍/引荐新的招聘联系人或猎头（例如 “let me introduce you to our recruiter”），视为 application。
9. 如果是通用新闻、营销推广、订阅简报、政治资讯、产品更新（常见特征：包含 unsubscribe/newsletter/manage preferences/© copyright/ marketing images），即使提到 job、career 等字眼也返回 other。
10. 发现包含明显“unsubscribe”、“preferences”、“newsletter”、“daily update”、“copyright ©” 等字样，优先判断为 other。
11. 必须只输出一个小写类别名称，且只能是 application/interview/offer/rejected/ghost/other 之一。

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
- Example 5 → "rejected":
  Subject: "Your application to Graphic Designer"
  Body: "We’ve decided to move forward with other candidates."
- Example 6 → "application":
  Subject: "Intro: You x Recruiter"
  Body: "Let me introduce you to our recruiter who is hiring for several roles."
- Example 7 → "other":
  Subject: "Company News Update"
  Body: "Here is your weekly newsletter. Unsubscribe anytime."
- Example 8 → "other":
  Subject: "Trump to Use $130 Million Anonymous Donation to Help Pay Troops"
  Body: "A political news update about government shutdown and budget, includes an unsubscribe link."

Email metadata:
- From: ${safe(email.from)}
- Subject: ${safe(email.subject)}
- Snippet: ${safe(email.snippet)}
- Body:
${trimmedBody}

Respond with only one label (lowercase).`;
  }

  parseCategory(rawText) {
    if (!rawText) return null;

    let text = rawText;

    if (Array.isArray(text)) {
      text = text.join(' ');
    }

    text = text.toString().trim();

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') {
        text = parsed;
      } else if (parsed && typeof parsed === 'object' && typeof parsed.category === 'string') {
        text = parsed.category;
      }
    } catch (error) {
      // ignore JSON parse errors
    }

    const normalized = text.toLowerCase().trim();
    if (CATEGORY_MAP[normalized]) {
      return CATEGORY_MAP[normalized];
    }

    const normalizedTokens = normalized
      .replace(/[^a-z]/g, ' ')
      .split(' ')
      .filter(Boolean);

    const matchedKey = normalizedTokens.find((token) => CATEGORY_MAP[token]);

    if (!matchedKey) {
      return null;
    }

    return CATEGORY_MAP[matchedKey];
  }

  createAIResult(labelConfig, provider, extras = {}) {
    if (!labelConfig) return null;
    return {
      label: labelConfig.name,
      confidence: extras.confidence || 'medium',
      method: `${provider}-ai`,
      reason: extras.reason || `Classified by ${provider === 'openai' ? 'OpenAI' : 'Anthropic'}`,
      rawCategory: extras.rawCategory,
      rawResponse: extras.rawResponse,
      config: labelConfig
    };
  }

  async classifyWithOpenAI(prompt) {
    if (!this.openai) return null;

    try {
      const requestPayload = {
        model: OPENAI_MODEL,
        temperature: OPENAI_TEMPERATURE,
        messages: [{ role: 'user', content: prompt }]
      };

      const response = await this.openai.chat.completions.create(requestPayload);

      const messageContent = response?.choices?.[0]?.message?.content || '';
      const labelName = this.parseCategory(messageContent);
      if (!labelName) {
        console.warn('[classifier][openai] Unable to map category from response:', messageContent);
        return null;
      }
      const labelConfig = JOB_LABELS.find((label) => label.name === labelName);
      return this.createAIResult(labelConfig, 'openai', {
        rawCategory: messageContent,
        rawResponse: { request: requestPayload, response },
        confidence: response?.choices?.[0]?.confidence || (response?.choices?.[0]?.message?.refusal ? 'low' : 'medium')
      });
    } catch (error) {
      const detail = error?.response?.data || error.message;
      console.error('OpenAI classification failed:', detail);
      return null;
    }
  }

  async classifyWithAnthropic(prompt) {
    if (!this.anthropic) return null;

    try {
      const requestPayload = {
        model: ANTHROPIC_MODEL,
        max_tokens: 500,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }]
      };

      const response = await this.anthropic.messages.create(requestPayload);

      const content = Array.isArray(response?.content)
        ? response.content.map((part) => part.text || '').join(' ')
        : '';

      const labelName = this.parseCategory(content);
      if (!labelName) {
        console.warn('[classifier][anthropic] Unable to map category from response:', content);
        return null;
      }
      const labelConfig = JOB_LABELS.find((label) => label.name === labelName);
      return this.createAIResult(labelConfig, 'anthropic', {
        rawCategory: content,
        rawResponse: { request: requestPayload, response },
        confidence: response?.usage?.output_tokens ? 'medium' : 'low'
      });
    } catch (error) {
      console.error('Anthropic classification failed:', error.message);
      return null;
    }
  }

  // 加载label配置以检查enabled状态
  async loadLabelConfig() {
    try {
      const configFile = path.join(__dirname, '../data/label-config.json');
      const data = await fs.readFile(configFile, 'utf8');
      const config = JSON.parse(data);
      return config.labels || {};
    } catch (error) {
      console.log('[classifier] Using default label config');
      return {};
    }
  }

  /**
   * Check if this is a LinkedIn Job Alert email
   */
  isLinkedInJobAlert(email) {
    const subject = (email.subject || '').toLowerCase();
    const from = (email.from || '').toLowerCase();
    
    // Must be from LinkedIn Job Alerts
    const isFromJobAlerts = from.includes('linkedin job alerts') || 
                           from.includes('jobalerts-noreply@linkedin.com') ||
                           from.includes('jobs-noreply@linkedin.com');
    
    if (!isFromJobAlerts) return false;
    
    // Job title patterns that indicate job alerts
    const JOB_TITLE_PATTERNS = [
      // Design roles
      '"design associate"', '"digital designer"', '"junior graphic designer"', 
      '"graphic designer"', '"brand designer"', '"junior designer"', 
      '"graphic design intern"', '"design intern"', '"creative specialist"',
      '"senior designer"', '"art director"', '"junior art director"',
      '"ui designer"', '"ux designer"', '"web designer"', '"freelance designer"',
      '"production designer"', '"visual designer"', '"motion designer"',
      
      // Common patterns in LinkedIn alerts
      'designer":', 'designer -', 'designer and more', 'designer at',
      '/year salary', '/hour salary', '$', 'salary'
    ];
    
    const hasJobPattern = JOB_TITLE_PATTERNS.some(pattern => 
      subject.includes(pattern)
    );
    
    // Check for designer-related content even without quotes
    const DESIGN_KEYWORDS = ['designer', 'design', 'creative', 'art director', 'graphic'];
    const hasDesignKeyword = DESIGN_KEYWORDS.some(keyword => 
      subject.includes(keyword)
    );
    
    return hasJobPattern || hasDesignKeyword;
  }

  /**
   * Check if this is a LinkedIn application status notification
   */
  isLinkedInApplicationStatus(email) {
    const subject = (email.subject || '').toLowerCase();
    const from = (email.from || '').toLowerCase();
    const text = `${subject} ${email.snippet || ''}`.toLowerCase();
    
    // Must be from LinkedIn
    const isFromLinkedIn = from.includes('jobs-noreply@linkedin.com') || 
                          from.includes('linkedin') ||
                          from.includes('jobalerts-noreply@linkedin.com');
    
    if (!isFromLinkedIn) return false;
    
    // Application status notification patterns
    const STATUS_PATTERNS = [
      'your application was viewed',
      'application was viewed by',
      'viewed your application',
      'application status',
      'application update',
      'hiring team at',
      'great job getting noticed',
      'application received',
      'thanks for applying',
      'application submitted'
    ];
    
    return STATUS_PATTERNS.some(pattern => 
      subject.includes(pattern) || text.includes(pattern)
    );
  }

  /**
   * Check if this is an outbound job application email (sent by user)
   */
  isOutboundJobApplication(email) {
    const subject = (email.subject || '').toLowerCase();
    const text = `${subject} ${email.snippet || ''}`.toLowerCase();
    const from = (email.from || '').toLowerCase();
    
    // Check if email is from the user (common user email patterns)
    const isFromUser = from.includes('sayhitoyutonghu@gmail.com') || 
                      from.includes('yutong') ||
                      email.threadLabels?.includes('SENT');
    
    if (!isFromUser) return false;
    
    // Job application indicators in sent emails
    const APPLICATION_INDICATORS = [
      // Job titles and positions
      'graphic designer', 'designer', 'ui designer', 'ux designer',
      'frontend developer', 'developer', 'engineer', 'intern',
      
      // Application content
      'application', 'applying', 'portfolio', 'resume', 'cv',
      'cover letter', 'attached', 'interested in', 'position',
      'job opening', 'opportunity', 'role',
      
      // Professional outreach phrases
      'reach out', 'wanted to connect', 'noticed your posting',
      'saw your job', 'application form'
    ];
    
    // Company/work-related recipients
    const WORK_DOMAINS = ['work', 'studio', 'agency', 'company', 'corp', 'inc', 'llc'];
    const hasWorkDomain = WORK_DOMAINS.some(domain => from.includes(domain));
    
    const hasApplicationIndicator = APPLICATION_INDICATORS.some(indicator => 
      text.includes(indicator)
    );
    
    return hasApplicationIndicator || (hasWorkDomain && text.length > 50);
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
      // Specific case reported by you
      'invoice+statements@mail.anthropic.com',
      // Common billing systems (extensible)
      'billing@', 'no-reply@billing', 'receipts@', 'invoices@', 'accounts@',
      '@billing.', '@payments.', '@mail.stripe.com', '@paypal.com'
    ];

    const hasFinanceWord = FINANCE_KEYWORDS.some(k => text.includes(k));
    const fromMatches = FINANCE_SENDERS.some(s => from.includes(s));
    // If sender明显是账单，或出现典型账单词，就忽略
    return fromMatches || hasFinanceWord;
  }

  /**
   * Check if email is job-related
   */
  isJobRelated(email) {
    const baseKeywords = [
      'application', 'interview', 'position', 'role', 'job',
      'recruiter', 'hiring', 'candidate', 'offer', 'career',
      'opportunity', 'resume', 'cv', 'employment',
      'linkedin', 'indeed', 'glassdoor', 'ziprecruiter',
      'apply now', 'opening', 'open roles', 'we are hiring', 'job alert',
      'designer', 'developer', 'engineer', 'intern', 'product manager'
    ];

    // Include keywords/senders from configured labels to widen the gate
    const fromConfig = [];
    for (const l of JOB_LABELS) {
      if (l.keywords) fromConfig.push(...l.keywords.map(k => k.toLowerCase()));
      if (l.senders) fromConfig.push(...l.senders.map(s => s.toLowerCase()));
    }

    const text = `${email.subject} ${email.snippet} ${email.from}`.toLowerCase();
    return [...new Set([...baseKeywords, ...fromConfig])].some(k => text.includes(k));
  }

  /**
   * Rule-based classification (fast, no AI cost)
   */
  async classifyByRules(email) {
    let subject = (email.subject || '').toLowerCase();
    // Normalize forwarded prefixes
    subject = subject.replace(/^\s*(fwd?|fw):\s*/i, '');
    const text = `${subject} ${email.snippet}`.toLowerCase();
    const from = email.from.toLowerCase();
    
    // 加载label配置以检查enabled状态
    const labelConfigs = await this.loadLabelConfig();
    
    // Check if this is an outbound job application email
    const isOutboundApplication = this.isOutboundJobApplication(email);
    if (isOutboundApplication) {
      const applicationLabel = JOB_LABELS.find(l => l.name === 'Application');
      if (applicationLabel) {
        // 检查Application label是否enabled
        const labelId = applicationLabel.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const isEnabled = labelConfigs[labelId]?.enabled !== false; // 默认enabled
        if (!isEnabled) {
          console.log(`[classifier] Application label is disabled, skipping`);
          return null;
        }
        
        return {
          label: applicationLabel.name,
          confidence: 'high',
          method: 'outbound-application',
          config: applicationLabel
        };
      }
    }

    // Special handling for LinkedIn Job Alerts
    const isLinkedInJobAlert = this.isLinkedInJobAlert(email);
    if (isLinkedInJobAlert) {
      const applicationLabel = JOB_LABELS.find(l => l.name === 'Application');
      if (applicationLabel) {
        // 检查Application label是否enabled
        const labelId = applicationLabel.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const isEnabled = labelConfigs[labelId]?.enabled !== false; // 默认enabled
        if (!isEnabled) {
          console.log(`[classifier] Application label is disabled, skipping`);
          return null;
        }
        
        return {
          label: applicationLabel.name,
          confidence: 'high',
          method: 'linkedin-job-alert',
          config: applicationLabel
        };
      }
    }

    // Special handling for LinkedIn Application Status Notifications
    const isLinkedInApplicationStatus = this.isLinkedInApplicationStatus(email);
    if (isLinkedInApplicationStatus) {
      const applicationLabel = JOB_LABELS.find(l => l.name === 'Application');
      if (applicationLabel) {
        // 检查Application label是否enabled
        const labelId = applicationLabel.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const isEnabled = labelConfigs[labelId]?.enabled !== false; // 默认enabled
        if (!isEnabled) {
          console.log(`[classifier] Application label is disabled, skipping`);
          return null;
        }
        
        return {
          label: applicationLabel.name,
          confidence: 'high',
          method: 'linkedin-application-status',
          config: applicationLabel
        };
      }
    }

  for (const labelConfig of JOB_LABELS) {
      // 首先检查label是否enabled
      const labelId = labelConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const isEnabled = labelConfigs[labelId]?.enabled !== false; // 默认enabled
      if (!isEnabled) {
        console.log(`[classifier] Label ${labelConfig.name} is disabled, skipping`);
        continue; // Skip disabled labels
      }
      
      // Check exclude senders first
      if (labelConfig.excludeSenders) {
        const hasExcludeSender = labelConfig.excludeSenders.some(sender => 
          from.includes(sender.toLowerCase())
        );
        if (hasExcludeSender) {
          continue; // Skip this label if exclude sender found
        }
      }
      
      // Check exclude keywords
      if (labelConfig.excludeKeywords) {
        const hasExcludeKeyword = labelConfig.excludeKeywords.some(kw => 
          text.includes(kw.toLowerCase())
        );
        if (hasExcludeKeyword) {
          continue; // Skip this label if exclude keyword found
        }
      }

      // Check keywords
      if (labelConfig.keywords) {
        const hasKeyword = labelConfig.keywords.some(kw => {
          const keyword = kw.toLowerCase();
          // Skip negative keywords (starting with !)
          if (keyword.startsWith('!')) {
            return false;
          }
          return text.includes(keyword);
        });
        if (hasKeyword) {
          return {
            label: labelConfig.name,
            confidence: 'high',
            method: 'rule-based',
            config: labelConfig
          };
        }
      }

      // Check sender domains
      if (labelConfig.senders) {
        const hasSender = labelConfig.senders.some(sender => {
          const senderLower = sender.toLowerCase();
          // Exact match for specific email addresses
          if (senderLower.includes('@')) {
            return from.includes(senderLower);
          }
          // Domain match only for domain names
          return from.includes(senderLower);
        });
        if (hasSender) {
          // Double check for exclusions even with sender match
          if (labelConfig.excludeKeywords) {
            const hasExcludeKeyword = labelConfig.excludeKeywords.some(kw => 
              text.includes(kw.toLowerCase())
            );
            if (hasExcludeKeyword) {
              continue; // Skip even if sender matches
            }
          }
          
          return {
            label: labelConfig.name,
            confidence: 'high',
            method: 'sender-match',
            config: labelConfig
          };
        }
      }

      // Special fallback: forwarded job alerts (subject contains fwd/fw + job titles)
      if (labelConfig.name === 'Application') {
        const hasFwd = /(fwd?|fw)[:\-]/i.test(email.subject || '') || text.includes(' fwd ');
        // guard against finance/receipt terms
        const NEGATIVE = ['receipt','invoice','payment','statement','order','subscription'];
        const hasNegative = NEGATIVE.some(n => text.includes(n));
        
        if (hasFwd && !hasNegative) {
          const JOB_TITLES = ['designer','developer','engineer','intern','product manager','manager','data scientist','analyst'];
          const hit = JOB_TITLES.some(t => text.includes(t));
          if (hit) {
            return {
              label: labelConfig.name,
              confidence: 'medium',
              method: 'fwd-fallback',
              config: labelConfig
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * AI-based classification (fallback for complex emails)
   */
  async classifyByAI(email) {
    if (!this.useOpenAI && !this.useAnthropic) {
      return null;
    }

    const prompt = this.buildPrompt(email);

    try {
      if (this.useOpenAI) {
        if (this.aiMinIntervalMs > 0) {
          const elapsed = Date.now() - this.lastAIRequestAt;
          const delay = this.aiMinIntervalMs - elapsed;
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
        const openAIResult = await this.classifyWithOpenAI(prompt);
        this.lastAIRequestAt = Date.now();
        if (openAIResult) {
          return openAIResult;
        }
      }

      if (this.useAnthropic) {
        const anthropicResult = await this.classifyWithAnthropic(prompt);
        if (anthropicResult) {
          return anthropicResult;
        }
      }

      return null;
    } catch (error) {
      console.error('AI classification failed:', error.message);
      return null;
    }
  }

  /**
   * Main classification method (rules first, AI fallback)
   */
  async classify(email) {
    // Skip finance/receipt emails - they will be ignored
    if (this.isFinanceReceipt(email)) {
      return null;
    }
    // Always use AI when available
    if (this.useOpenAI || this.useAnthropic) {
      const aiResult = await this.classifyByAI(email);
      if (aiResult) {
        return aiResult;
      }
    }

    // If AI is not configured or returns nothing, skip classification
    return null;
  }
}

module.exports = ClassifierService;