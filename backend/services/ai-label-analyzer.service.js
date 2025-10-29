const OpenAI = require('openai');
const crypto = require('crypto');
const path = require('path');
const PersistentCache = require('./persistent-cache.service');

// Persistent caches (file-backed) with TTLs
const analyzeCache = new PersistentCache({
  filePath: path.join(__dirname, '../data/cache-analyze.json'),
  defaultTtlMs: 7 * 24 * 60 * 60 * 1000
});
const senderInfoCache = new PersistentCache({
  filePath: path.join(__dirname, '../data/cache-sender.json'),
  defaultTtlMs: 14 * 24 * 60 * 60 * 1000
});
const jobCheckCache = new PersistentCache({
  filePath: path.join(__dirname, '../data/cache-jobcheck.json'),
  defaultTtlMs: 3 * 24 * 60 * 60 * 1000
});

function truncateContent(input, limit = 1500) {
  if (!input) return '';
  const text = input.toString();
  return text.length > limit ? text.slice(0, limit) : text;
}

function hashContent(input) {
  return crypto.createHash('sha1').update(input || '').digest('hex');
}

class AILabelAnalyzerService {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Analyze email content and suggest label configuration
   */
  async analyzeEmailForLabel(emailContent) {
    try {
      const truncated = truncateContent(emailContent, 1500);
      const cacheKey = hashContent(truncated);
      const cached = await analyzeCache.get(cacheKey);
      if (cached) return cached;
      const prompt = `You are an AI assistant that analyzes emails to create Gmail label rules. 

Given this email content, analyze it and suggest:
1. A suitable label name (2-3 words max) - PRIORITIZE sender-based names when appropriate
2. A brief description
3. Key keywords that would identify similar emails
4. Sender patterns (domains or email patterns)
5. A suitable emoji icon
6. A color suggestion (hex code)

Email content:
${truncated}

IMPORTANT LABEL NAMING RULES:
- If the email is from a company/organization, use the company name as the label (e.g., "Pursuit", "LinkedIn", "Google")
- If from a person, use their name or role (e.g., "John Smith", "Recruiter")
- If it's a service/platform, use the service name (e.g., "GitHub", "Slack", "Zoom")
- For generic emails, use descriptive terms (e.g., "Newsletter", "Notification", "Invoice")
- Keep label names short and memorable (1-3 words max)

Please respond in JSON format:
{
  "labelName": "Suggested Label Name",
  "description": "Brief description of what this email type represents",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "senders": ["domain.com", "pattern@company.com"],
  "icon": "📧",
  "color": "#4a86e8",
  "confidence": 0.85,
  "reasoning": "Brief explanation of why this classification makes sense"
}

Analyze the email and suggest appropriate labels for ANY type of email, including:
- Job-related emails (applications, interviews, offers, rejections, recruiter communications)
- Work emails (meetings, projects, announcements)
- Personal emails (family, friends, social)
- Business emails (invoices, contracts, services)
- System emails (notifications, alerts, confirmations)
- Any other email type you can identify

Always provide a label suggestion regardless of the email type.`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.choices[0].message.content;
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!analysis.labelName || !analysis.keywords || !Array.isArray(analysis.keywords)) {
        throw new Error('Invalid analysis response from AI');
      }

      const result = {
        success: true,
        analysis
      };
      await analyzeCache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract sender information from email content
   */
  async extractSenderInfo(emailContent) {
    try {
      const truncated = truncateContent(emailContent, 800);
      const cacheKey = hashContent(truncated);
      const cached = await senderInfoCache.get(cacheKey);
      if (cached) return cached;
      const prompt = `Extract sender information from this email content. Look for:
1. From field or sender email address
2. Company/organization name
3. Person's name
4. Domain name

Email content:
${truncated}

Respond in JSON format:
{
  "senderEmail": "sender@company.com",
  "senderName": "John Smith",
  "companyName": "Company Name",
  "domain": "company.com",
  "suggestedLabelName": "Company Name"
}

If information is not available, use null for that field.`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const senderInfo = JSON.parse(jsonMatch[0]);
        const result = {
          success: true,
          senderInfo
        };
        await senderInfoCache.set(cacheKey, result);
        return result;
      } else {
        return {
          success: false,
          error: 'No valid JSON found in response'
        };
      }

    } catch (error) {
      console.error('Sender extraction error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if email content is job-related
   */
  async isJobRelated(emailContent) {
    try {
      const truncated = truncateContent(emailContent, 600);
      const cacheKey = hashContent(truncated);
      const cached = await jobCheckCache.get(cacheKey);
      if (cached) return cached;
      const prompt = `Analyze this email content and determine if it's job-related (job applications, interviews, offers, rejections, recruiter communications, job alerts, etc.).

Email content:
${truncated}

Respond with only "YES" or "NO" followed by a brief reason.`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        max_tokens: 60,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.choices[0].message.content.trim();
      const isJobRelated = content.startsWith('YES');
      
      const result = {
        success: true,
        isJobRelated,
        reasoning: content
      };
      await jobCheckCache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Job-related check error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = AILabelAnalyzerService;
