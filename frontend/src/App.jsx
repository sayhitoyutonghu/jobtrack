import React, { useState, useEffect } from 'react';
import { Settings, Mail, Calendar, Bell, MessageSquare, Archive, Tag, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';

const JobEmailCategorizationApp = () => {
  const [categories, setCategories] = useState([
    { 
      id: 1, 
      name: 'Application', 
      label: 'Application',
      description: 'All job application related emails (applied, viewed, job alerts)',
      color: '#a4c2f4',
      icon: '📄',
      enabled: true,
      moveToFolder: true
    },
    { 
      id: 2, 
      name: 'Interview', 
      label: 'Interview',
      description: 'Interview invitations, scheduling, and post-interview follow-ups',
      color: '#ff7537',
      icon: '🗓️',
      enabled: true,
      moveToFolder: false
    },
    { 
      id: 3, 
      name: 'Offer', 
      label: 'Offer',
      description: 'Job offers and compensation details',
      color: '#16a765',
      icon: '💰',
      enabled: true,
      moveToFolder: false
    },
    { 
      id: 4, 
      name: 'Rejected', 
      label: 'Rejected',
      description: 'Rejection notifications and "not moving forward" emails',
      color: '#cccccc',
      icon: '❌',
      enabled: true,
      moveToFolder: true
    },
    { 
      id: 5, 
      name: 'Ghost', 
      label: 'Ghost',
      description: 'Companies that stopped responding after engagement',
      color: '#a479e2',
      icon: '👻',
      enabled: true,
      moveToFolder: true
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [respectUserLabels, setRespectUserLabels] = useState(true);

  // Load labels from API on component mount
  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/labels');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCategories(data.labels.map((label, index) => ({
            id: label.id,
            name: label.name,
            label: label.name,
            description: label.description,
            color: label.color?.backgroundColor || '#cccccc',
            icon: label.icon || '📧',
            enabled: label.enabled !== false,
            moveToFolder: label.moveToFolder || false
          })));
        } else {
          setError(data.error || 'Failed to load labels');
        }
      }
    } catch (err) {
      console.error('Failed to fetch labels:', err);
      setError('Failed to load labels');
    } finally {
      setLoading(false);
    }
  };

  const updateLabels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3000/api/labels/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          labels: categories,
          respectUserLabels 
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(data.error || 'Failed to update labels');
      }
    } catch (err) {
      console.error('Failed to update labels:', err);
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

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
            Once enabled, the system will automatically add colored labels to your job emails
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Email categorization</h2>
            <p className="text-gray-600">
              Automatically categorize job-related emails to keep you focused on what's important.
            </p>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-red-800">
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex gap-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div className="text-sm text-green-800">
                <p className="font-medium">Settings saved successfully!</p>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-sm text-blue-800">
              <p className="mb-1">Turning on a category below will move emails in that category out of your main inbox and into a folder (in Outlook) or label (in Gmail).</p>
            </div>
          </div>

          {/* Categories Header */}
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="text-center">Move to folder/label?</div>
              <div className="text-center font-medium">Categories</div>
              <div></div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="space-y-3 mb-8">
            {categories.map(category => (
              <div key={category.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Toggle Switch */}
                  <div className="flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={category.enabled}
                        onChange={() => toggleCategory(category.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Category Info */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div 
                        className="px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 text-black"
                        style={{ backgroundColor: category.color }}
                      >
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>

                  {/* Archive Toggle */}
                  <div className="flex justify-center">
                    <div className="text-xs text-gray-500 text-center">
                      <div className="mb-1">Archive emails</div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={category.moveToFolder}
                          onChange={() => toggleMoveToFolder(category.id)}
                          disabled={!category.enabled}
                          className="sr-only peer"
                        />
                        <div className={`w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 ${!category.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Fyxer email rules section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fyxer email rules</h3>
            <p className="text-sm text-gray-600 mb-4">
              Specify email addresses, domains, or specific email subjects to automatically assign to a label. For example, if there's a newsletter you're interested in, you can assign it to FYI so it doesn't go to marketing.
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
              + Add email or subject rule
            </button>
          </div>

          {/* Respect user-applied labels */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Respect user-applied labels</h3>
                <p className="text-sm text-gray-600">
                  When this is on, we won't re-categorize emails that you or that have been filtered into a folder, though we'll still categorize new emails. When it's off, we'll re-categorize everything based on your current category preferences.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-6">
                <input
                  type="checkbox"
                  checked={respectUserLabels}
                  onChange={(e) => setRespectUserLabels(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Update Button */}
          <div className="flex justify-center">
            <button 
              onClick={updateLabels}
              disabled={loading}
              className="w-full max-w-md bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update preferences</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobEmailCategorizationApp;