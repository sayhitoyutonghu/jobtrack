const OpenAI = require('openai');

class AILabelAnalyzerService {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Analyze email content and suggest label configuration
   */
  async analyzeEmailForLabel(emailContent) {
    try {
      const prompt = `You are an AI assistant that analyzes emails to create Gmail label rules. 

Given this email content, analyze it and suggest:
1. A suitable label name (2-3 words max) - PRIORITIZE sender-based names when appropriate
2. A brief description
3. Key keywords that would identify similar emails
4. Sender patterns (domains or email patterns)
5. A suitable emoji icon
6. A color suggestion (hex code)

Email content:
${emailContent}

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
        model: 'gpt-3.5-turbo',
        max_tokens: 1000,
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

      return {
        success: true,
        analysis
      };

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
      const prompt = `Extract sender information from this email content. Look for:
1. From field or sender email address
2. Company/organization name
3. Person's name
4. Domain name

Email content:
${emailContent}

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
        model: 'gpt-3.5-turbo',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const senderInfo = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          senderInfo
        };
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
      const prompt = `Analyze this email content and determine if it's job-related (job applications, interviews, offers, rejections, recruiter communications, job alerts, etc.).

Email content:
${emailContent}

Respond with only "YES" or "NO" followed by a brief reason.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.choices[0].message.content.trim();
      const isJobRelated = content.startsWith('YES');
      
      return {
        success: true,
        isJobRelated,
        reasoning: content
      };

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
