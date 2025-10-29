const fs = require('fs').promises;
const path = require('path');

class CustomLabelClassifier {
  constructor() {
    this.configFile = path.join(__dirname, '../data/label-config.json');
  }

  /**
   * Load label configuration
   */
  async loadConfig() {
    try {
      const data = await fs.readFile(this.configFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log('[custom-classifier] Error loading config:', error.message);
      return { labels: {} };
    }
  }

  /**
   * Check if email matches a custom label rule
   */
  async classifyWithCustomRules(email) {
    const config = await this.loadConfig();
    const labels = config.labels || {};
    
    const emailText = `${email.subject || ''} ${email.body || ''}`.toLowerCase();
    const senderEmail = email.from || '';
    
    for (const [labelId, labelConfig] of Object.entries(labels)) {
      if (!labelConfig.enabled) continue;
      
      // Check if this is a custom label (not preset)
      if (labelConfig.type !== 'custom') continue;
      
      const labelName = labelConfig.name;
      const keywords = labelConfig.keywords || [];
      const senders = labelConfig.senders || [];
      
      let matches = false;
      let matchReason = '';
      
      // Check keywords
      if (keywords.length > 0) {
        const keywordMatch = keywords.some(keyword => 
          emailText.includes(keyword.toLowerCase())
        );
        if (keywordMatch) {
          matches = true;
          matchReason = 'keyword-match';
        }
      }
      
      // Check senders
      if (!matches && senders.length > 0) {
        const senderMatch = senders.some(sender => {
          const senderLower = sender.toLowerCase();
          return senderEmail.toLowerCase().includes(senderLower) || 
                 senderEmail.toLowerCase().includes(senderLower.replace('@', ''));
        });
        if (senderMatch) {
          matches = true;
          matchReason = 'sender-match';
        }
      }
      
      if (matches) {
        return {
          success: true,
          label: labelName,
          labelId: labelId,
          confidence: 'high',
          method: 'custom-rule',
          reason: matchReason,
          config: labelConfig
        };
      }
    }
    
    return { success: false };
  }

  /**
   * Classify email using all available rules (custom + preset)
   */
  async classify(email) {
    // First try custom rules
    const customResult = await this.classifyWithCustomRules(email);
    if (customResult.success) {
      return customResult;
    }
    
    return { success: false };
  }
}

module.exports = CustomLabelClassifier;
