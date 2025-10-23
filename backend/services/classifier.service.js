const { JOB_LABELS } = require('../config/labels');
const fs = require('fs').promises;
const path = require('path');

class ClassifierService {
  constructor(apiKey) {
    // AI is optional - we'll use rules first
    this.useAI = false;
    if (apiKey && apiKey !== 'sk-ant-your-key-here') {
      try {
        const Anthropic = require('@anthropic-ai/sdk');
        this.anthropic = new Anthropic({ apiKey });
        this.useAI = true;
        console.log('✓ AI classification enabled');
      } catch (error) {
        console.log('⚠ AI disabled (install @anthropic-ai/sdk to enable)');
      }
    } else {
      console.log('⚠ AI disabled (no API key provided)');
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
    if (!this.useAI) {
      return null;
    }

    const prompt = `Analyze this job search email and categorize it.

Email Details:
From: ${email.from}
Subject: ${email.subject}
Preview: ${email.snippet}

Categories:
1. Application - Job applications (submitted, status updates, viewed notifications, job alerts)
2. Interview - Interview invitations, scheduling, and follow-ups
3. Offer - Job offers and offer letters
4. Rejected - Rejection emails
5. Ghost - No response for 30+ days
6. Not-Job-Related - Not related to job search

Return ONLY valid JSON:
{
  "category": "category name",
  "confidence": "high/medium/low",
  "reason": "brief explanation"
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const result = JSON.parse(message.content[0].text);
      
      if (result.category === 'Not-Job-Related') {
        return null;
      }

      // Map AI classification results to our label names
      const categoryMapping = {
        'application': 'Application',
        'interview': 'Interview', 
        'offer': 'Offer',
        'rejected': 'Rejected',
        'ghost': 'Ghost'
      };
      
      const labelName = categoryMapping[result.category.toLowerCase()];
      const labelConfig = JOB_LABELS.find(l => l.name === labelName);

      if (!labelConfig) return null;

      return {
        label: labelConfig.name,
        confidence: result.confidence,
        method: 'ai-classification',
        reason: result.reason,
        config: labelConfig
      };
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
    // Try rules first (free & fast)
    const ruleResult = await this.classifyByRules(email);
    if (ruleResult) {
      return ruleResult;
    }

    // Fallback to AI if available
    if (this.useAI) {
      return await this.classifyByAI(email);
    }

    return null;
  }
}

module.exports = ClassifierService;