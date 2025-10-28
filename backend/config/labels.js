// Gmail's available label colors
const GMAIL_COLORS = {
  RED: { backgroundColor: '#fb4c2f', textColor: '#ffffff' },
  ORANGE: { backgroundColor: '#ff7537', textColor: '#ffffff' },
  YELLOW: { backgroundColor: '#fad165', textColor: '#000000' },
  GREEN: { backgroundColor: '#16a765', textColor: '#ffffff' },
  TEAL: { backgroundColor: '#43d692', textColor: '#000000' },
  BLUE: { backgroundColor: '#4a86e8', textColor: '#ffffff' },  // 改成Gmail接受的蓝色
  PURPLE: { backgroundColor: '#a479e2', textColor: '#ffffff' },
  PINK: { backgroundColor: '#f691b2', textColor: '#000000' },
  GREY: { backgroundColor: '#cccccc', textColor: '#000000' }
};

const JOB_LABELS = [

  // Application (merged all sublabels: Applied, Application-Viewed, Job-Alert)
  {
    name: 'Application',
    // Try a light blue; if Gmail rejects, fall back to TEAL then PURPLE
    color: { backgroundColor: '#a4c2f4', textColor: '#000000' },
    colorFallbacks: [GMAIL_COLORS.TEAL, GMAIL_COLORS.PURPLE],
    icon: '📄',
    description: 'All job application related emails (applied, viewed, job alerts)',
    moveToFolder: true,
    senders: [
      'jobalerts-noreply@linkedin.com',
      'jobs-noreply@linkedin.com',
      'linkedin-alerts@linkedin.com',
      'jobsalerts@linkedin.com',
      'indeed.com',
      'glassdoor.com',
      'ziprecruiter.com',
      'jobvite.com',
      'workday.com',
      'greenhouse.io',
      'lever.co',
      'smartrecruiters.com',
      'job-openings@',
      'careers@',
      'recruiting@'
    ],
    keywords: [
      // Job Alert keywords - LinkedIn specific patterns
      'job alert', 'new jobs', 'jobs for you', 'positions for you', 'roles for you',
      'recommended jobs', 'we found jobs', 'jobs you may be interested in',
      'job recommendations', 'matching jobs', 'job matches', 'job opening',
      'job opportunities', 'career opportunities', 'open positions',
      'fwd:', 'fw:', 'forwarded job',
      
      // Job title patterns from LinkedIn alerts
      'design associate', 'digital designer', 'junior graphic designer', 'graphic designer',
      'brand designer', 'junior designer', 'graphic design intern', 'design intern',
      'creative specialist', 'senior designer', 'art director', 'junior art director',
      'ui designer', 'ux designer', 'web designer', 'freelance designer',
      'production designer', 'visual designer', 'motion designer',
      
      // Recruiter intros / referrals
      'intro you to our recruiter', 'let me introduce you', 'connect you with',
      'introduction to', 'intro:', 'recruiter intro', 'recruiter introduction',
      'wanted to introduce you', 'happy to introduce', 'cc our recruiter',
      'meet the recruiter', 'meet our hiring manager',
      'designer and more', 'designer -', ': designer', 'designer at',
      'creative role', 'design role', 'design position', 'creative position',,
      'year salary', 'hour salary', '/year', '/hour', '$', 'salary',
      
      // Application Submitted/Received keywords
      'application received', 'thank you for applying', 'application submitted', 
      'application was sent', 'successfully applied', 'application complete',
      'we have received your application', 'your application has been submitted',
      'applied successfully', 'application confirmation',
      
      // Application Status/Viewed keywords
      'viewed your application', 'application viewed', 'profile viewed', 'resume viewed',
      'under consideration', 'application status', 'application update',
      'reviewing your application', 'application in progress', 'application review',
      
      // Outbound application keywords (emails you send)
      'portfolio', 'resume', 'cv', 'application for', 'applying for', 
      'interested in', 'position', 'attached my resume', 'my portfolio', 'cover letter',
      
      // Response to applications keywords
      'thank you for your email', 'thank you for your interest', 'high volume of applicants',
      'response time may be longer', 'reviewing your email', 'will respond as soon as we can',
      
      // Exclude social connection phrases (negative keywords)
      '!connection request', '!would like to connect', '!invitation to connect',
      '!connect with', '!sent you a connection'
    ],
    
    // Add negative keywords to exclude social connections
    excludeKeywords: [
      'connection request', 'would like to connect', 'invitation to connect',
      'connect with', 'sent you a connection', 'i\'d like to connect',
      'linkedin connection', 'connect on linkedin', 'invitation from',
      'unsubscribe', 'newsletter', 'daily briefing'
    ],
    
    // Exclude specific senders (social connections, not job related)
    excludeSenders: [
      'invitations@linkedin.com',
      'member-invitations@linkedin.com',
      'newsletters-noreply@linkedin.com',
      'mwang73151@aol.com',
      'support@erthwellness.com'
    ]
  },

  // 4) Interview (simplified single label for now)
  {
    name: 'Interview',
    color: GMAIL_COLORS.ORANGE,
    icon: '🗓️',
    description: 'Interview invitations, scheduling, and post-interview follow-ups',
    moveToFolder: false,
    priority: 'high',
    keywords: [
      // Invitation/action
      'interview invitation', 'schedule a call', 'are you available', 'please confirm', 'complete assessment', 'questionnaire',
      // Scheduled/confirmed
      'interview confirmed', 'meeting scheduled', 'calendar invite', 'zoom link', 'interview details',
      // Post-interview
      'thank you for interviewing', 'great speaking with you', 'following up from our interview', 'it was a pleasure speaking', 'post-interview'
    ]
  },

  // 5) Offer
  {
    name: 'Offer',
    color: GMAIL_COLORS.GREEN,
    icon: '🎉',
    description: 'Job offers and offer letters',
    moveToFolder: false,
    priority: 'urgent',
    notify: true,
    keywords: [
      'pleased to offer',
      'extend an offer',
      'offer letter',
      'congratulations',
      'compensation package'
    ]
  },

  // 6) Rejected
  {
    name: 'Rejected',
    color: GMAIL_COLORS.GREY,
    icon: '❌',
    description: 'Rejection emails',
    moveToFolder: true,
    keywords: [
      'unfortunately',
      'not moving forward',
      'other candidates',
      'decided to pursue',
      'not selected',
      'move forward in a different direction',
      'moving forward with another',
      'decided to move forward',
      'decided to move forward with other candidates',
      'we chose another candidate'
    ]
  },

  // 7) Ghost — over 30 days no follow-up (applied but no movement)
  {
    name: 'Ghost',
    color: GMAIL_COLORS.GREY,
    icon: '👻',
    description: 'No updates for 30+ days since Applied',
    moveToFolder: true
  },

  // Additional helpful labels (kept at the end)
  
];

module.exports = { GMAIL_COLORS, JOB_LABELS };