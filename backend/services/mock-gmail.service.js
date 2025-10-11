/**
 * Mock Gmail Service for Testing (No real Gmail API calls)
 */

class MockGmailService {
  constructor() {
    this.mockLabels = [];
  }

  /**
   * Mock: Create or get Gmail labels
   */
  async setupLabels(labelConfigs) {
    console.log('🧪 [TEST MODE] Simulating Gmail label creation...');
    
    const results = [];
    
    for (const config of labelConfigs) {
      // Simulate label creation
      const mockLabel = {
        id: `mock-label-${Math.random().toString(36).substring(7)}`,
        name: config.fullName,
        type: 'user',
        messageListVisibility: 'show',
        labelListVisibility: 'labelShow',
        color: {
          backgroundColor: config.color,
          textColor: '#ffffff'
        }
      };
      
      this.mockLabels.push(mockLabel);
      
      results.push({
        name: config.fullName,
        id: mockLabel.id,
        status: 'created (test mode)',
        color: config.color
      });
      
      console.log(`  ✓ Mock label created: ${config.fullName}`);
    }
    
    return {
      success: true,
      results,
      message: 'Test mode: Labels simulated successfully'
    };
  }

  /**
   * Mock: List Gmail labels
   */
  async listLabels() {
    console.log('🧪 [TEST MODE] Returning mock labels...');
    
    return {
      labels: [
        ...this.mockLabels,
        { id: 'INBOX', name: 'INBOX', type: 'system' },
        { id: 'SENT', name: 'SENT', type: 'system' },
        { id: 'DRAFT', name: 'DRAFT', type: 'system' }
      ]
    };
  }

  /**
   * Mock: Scan emails
   */
  async scanEmails(query, maxResults = 10) {
    console.log(`🧪 [TEST MODE] Simulating email scan: query="${query}", max=${maxResults}`);
    
    // Generate mock emails
    const mockEmails = this.generateMockEmails(maxResults);
    
    const results = mockEmails.map((email, index) => ({
      id: email.id,
      subject: email.subject,
      from: email.from,
      snippet: email.snippet,
      label: email.predictedLabel,
      confidence: email.confidence,
      labelApplied: true,
      testMode: true
    }));
    
    return {
      success: true,
      stats: {
        total: maxResults,
        processed: maxResults,
        skipped: 0,
        labeled: maxResults
      },
      results,
      message: 'Test mode: Email scan simulated'
    };
  }

  /**
   * Generate mock email data
   */
  generateMockEmails(count) {
    const templates = [
      {
        subject: 'Interview Invitation - Software Engineer Position',
        from: 'recruiter@techcorp.com',
        snippet: 'We are impressed with your background and would like to schedule an interview...',
        predictedLabel: 'Interview Scheduled',
        confidence: 0.92
      },
      {
        subject: 'Application Received - Job #12345',
        from: 'noreply@careers.company.com',
        snippet: 'Thank you for applying to our Software Engineer position. We have received your application...',
        predictedLabel: 'Applied',
        confidence: 0.88
      },
      {
        subject: 'Job Alert: Senior Developer at StartupXYZ',
        from: 'jobs@linkedin.com',
        snippet: 'Based on your profile, we found this job that might interest you...',
        predictedLabel: 'Job Alert',
        confidence: 0.95
      },
      {
        subject: 'Offer Letter - Welcome to the Team!',
        from: 'hr@amazingcompany.com',
        snippet: 'Congratulations! We are pleased to offer you the position of Senior Engineer...',
        predictedLabel: 'Offer',
        confidence: 0.97
      },
      {
        subject: 'Update on Your Application',
        from: 'hiring@company.com',
        snippet: 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates...',
        predictedLabel: 'Rejected',
        confidence: 0.89
      },
      {
        subject: 'Following up on our conversation',
        from: 'recruiter@techfirm.com',
        snippet: 'Hi! I wanted to follow up on the email I sent last week regarding the Senior Dev position...',
        predictedLabel: 'Response Needed',
        confidence: 0.76
      },
      {
        subject: 'Quick question about your availability',
        from: 'talent@startup.io',
        snippet: 'Are you available for a quick call this week to discuss an exciting opportunity?',
        predictedLabel: 'Recruiter Outreach',
        confidence: 0.84
      },
      {
        subject: 'Application Status Update',
        from: 'careers@bigtech.com',
        snippet: 'Your application for the Software Engineer role is currently under review...',
        predictedLabel: 'Status Update',
        confidence: 0.91
      }
    ];

    const emails = [];
    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      emails.push({
        id: `mock-email-${i}-${Math.random().toString(36).substring(7)}`,
        threadId: `mock-thread-${i}`,
        ...template,
        date: new Date(Date.now() - i * 86400000).toISOString() // Each email 1 day apart
      });
    }
    
    return emails;
  }

  /**
   * Mock: Apply label to message
   */
  async applyLabel(messageId, labelId) {
    console.log(`🧪 [TEST MODE] Simulating label application: message=${messageId}, label=${labelId}`);
    return {
      success: true,
      message: 'Test mode: Label applied successfully'
    };
  }
}

module.exports = MockGmailService;

