import React, { useState } from 'react';
import { Settings, Mail, Calendar, Bell, MessageSquare, Archive, Tag, AlertCircle } from 'lucide-react';

const JobEmailCategorizationApp = () => {
  const [categories, setCategories] = useState([
    { 
      id: 1, 
      name: 'Applied', 
      label: 'Applied',
      description: 'Job application confirmation emails',
      color: '#FF6B6B',
      enabled: true,
      moveToFolder: true
    },
    { 
      id: 2, 
      name: 'Response Needed', 
      label: 'Response Needed',
      description: 'Emails requiring your response (interview invites, questionnaires)',
      color: '#4ECDC4',
      enabled: true,
      moveToFolder: false
    },
    { 
      id: 3, 
      name: 'Interview Scheduled', 
      label: 'Interview Scheduled',
      description: 'Interview appointment confirmations',
      color: '#FFD93D',
      enabled: true,
      moveToFolder: false
    },
    { 
      id: 4, 
      name: 'Offer', 
      label: 'Offer',
      description: 'Job offers and offer letters',
      color: '#6BCF7F',
      enabled: true,
      moveToFolder: false
    },
    { 
      id: 5, 
      name: 'Rejected', 
      label: 'Rejected',
      description: 'Rejection notifications',
      color: '#95A5A6',
      enabled: true,
      moveToFolder: true
    },
    { 
      id: 6, 
      name: 'Status Update', 
      label: 'Status Update',
      description: 'Application status updates, no action needed',
      color: '#A29BFE',
      enabled: true,
      moveToFolder: true
    },
    { 
      id: 7, 
      name: 'Recruiter Outreach', 
      label: 'Recruiter Outreach',
      description: 'Recruiter or HR cold outreach',
      color: '#FD79A8',
      enabled: true,
      moveToFolder: false
    },
    { 
      id: 8, 
      name: 'Job Alert', 
      label: 'Job Alert',
      description: 'Job board notification emails',
      color: '#74B9FF',
      enabled: false,
      moveToFolder: true
    }
  ]);

  const [customRules, setCustomRules] = useState([
    { email: 'recruiter@google.com', category: 'Response Needed' },
    { domain: 'linkedin.com', category: 'Job Alert' }
  ]);

  const [respectUserLabels, setRespectUserLabels] = useState(true);

  const toggleCategory = (id) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, enabled: !cat.enabled } : cat
    ));
  };

  const toggleMoveToFolder = (id) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, moveToFolder: !cat.moveToFolder } : cat
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">JobTracker</h1>
          <p className="text-sm text-gray-500 mt-1">Smart Job Search Assistant</p>
        </div>

        <div className="space-y-1">
          <div className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer flex items-center gap-3">
            <Mail size={18} />
            <span>Inbox</span>
          </div>
          <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer flex items-center gap-3 font-medium">
            <Settings size={18} />
            <span>Categorization</span>
          </div>
          <div className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer flex items-center gap-3">
            <Calendar size={18} />
            <span>Interviews</span>
          </div>
          <div className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer flex items-center gap-3">
            <MessageSquare size={18} />
            <span>Pending Replies</span>
          </div>
        </div>

        <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
          <p className="text-sm text-indigo-800 font-medium">💡 Tip</p>
          <p className="text-xs text-indigo-600 mt-2">
            Once enabled, the system will automatically add colored labels to job emails
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Email Categorization</h2>
          <p className="text-gray-600 mb-8">
            JobTracker uses AI to automatically identify job-related emails and add colored labels, helping you focus on what matters
          </p>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What happens when categorization is enabled?</p>
              <p>Checked categories will automatically create colored labels in Gmail. Selecting "Move out of inbox" will archive emails to their corresponding label folders.</p>
            </div>
          </div>

          {/* Categories Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Category Settings</h3>
                  <p className="text-sm text-gray-500 mt-1">Choose which categories to display in your inbox</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="px-6 py-3 bg-gray-50 grid grid-cols-12 gap-4 text-xs font-medium text-gray-600">
                <div className="col-span-1">Enable</div>
                <div className="col-span-5">Category</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2 text-right">Archive</div>
              </div>

              {categories.map(category => (
                <div key={category.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={category.enabled}
                      onChange={() => toggleCategory(category.id)}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  
                  <div className="col-span-5 flex items-center gap-3">
                    <div 
                      className="px-3 py-1.5 rounded-md text-white text-xs font-medium shadow-sm whitespace-nowrap"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.label}
                    </div>
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </div>
                  
                  <div className="col-span-4">
                    <span className="text-sm text-gray-500">{category.description}</span>
                  </div>
                  
                  <div className="col-span-2 flex justify-end">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={category.moveToFolder}
                        onChange={() => toggleMoveToFolder(category.id)}
                        disabled={!category.enabled}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 ${!category.enabled ? 'opacity-50 cursor-not-allowed' : ''}` }></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Rules Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Custom Rules</h3>
              <p className="text-sm text-gray-500 mt-1">
                Specify email addresses, domains, or subject keywords to automatically assign to a category
              </p>
            </div>

            <div className="p-6">
              {customRules.map((rule, index) => (
                <div key={index} className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                  <Tag size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700 flex-1">
                    {rule.email || rule.domain} → <span className="font-medium">{rule.category}</span>
                  </span>
                  <button className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                </div>
              ))}

              <button className="mt-4 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 flex items-center gap-2 transition-colors">
                <span className="text-lg">+</span>
                Add Email or Subject Rule
              </button>
            </div>
          </div>

          {/* Respect User Labels */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Respect Manual Labels</h3>
                <p className="text-sm text-gray-500">
                  When enabled, the system won't re-categorize emails you've manually labeled, preserving your filing decisions. 
                  When disabled, all emails will be re-classified by AI.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={respectUserLabels}
                  onChange={(e) => setRespectUserLabels(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* Alternative Emails */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Connected Accounts</h3>
            <p className="text-sm text-gray-500 mb-4">
              If you use multiple email accounts for job applications, add other Gmail accounts to manage them together
            </p>
            <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 flex items-center gap-2 transition-colors">
              <Mail size={16} />
              Add Another Gmail Account
            </button>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end gap-3">
            <button className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors">
              Cancel
            </button>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobEmailCategorizationApp;