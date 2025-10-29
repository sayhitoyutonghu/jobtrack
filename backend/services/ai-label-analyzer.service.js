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
      const prompt = `You are an AI assistant that analyzes emails to create Gmail label rules for job tracking. 

Given this email content, analyze it and suggest:
1. A suitable label name (2-3 words max)
2. A brief description
3. Key keywords that would identify similar emails
4. Sender patterns (domains or email patterns)
5. A suitable emoji icon
6. A color suggestion (hex code)

Email content:
${emailContent}

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

Focus on job-related email patterns like:
- Job applications and responses
- Interview scheduling
- Offer letters
- Rejection emails
- Recruiter communications
- Company newsletters
- Job alerts and notifications`;

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
