import { useState, useEffect } from 'react';
import { Settings, Toggle, Edit3, Save, X } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLabel, setEditingLabel] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadLabels();
  }, []);

  const loadLabels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/labels');
      const data = await response.json();
      
      if (data.success) {
        setLabels(data.labels);
      } else {
        console.error('Failed to load labels:', data.error);
      }
    } catch (error) {
      console.error('Error loading labels:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLabel = async (labelId, currentEnabled) => {
    try {
      const response = await fetch(`/api/labels/${labelId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !currentEnabled })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLabels(labels.map(label => 
          label.id === labelId 
            ? { ...label, enabled: !currentEnabled }
            : label
        ));
      } else {
        console.error('Failed to toggle label:', data.error);
      }
    } catch (error) {
      console.error('Error toggling label:', error);
    }
  };

  const startEditing = (label) => {
    setEditingLabel(label.id);
    setEditForm({
      name: label.name,
      description: label.description,
      keywords: label.keywords ? label.keywords.join(', ') : '',
      senders: label.senders ? label.senders.join(', ') : ''
    });
  };

  const cancelEditing = () => {
    setEditingLabel(null);
    setEditForm({});
  };

  const saveLabel = async () => {
    try {
      const response = await fetch(`/api/labels/${editingLabel}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          keywords: editForm.keywords.split(',').map(k => k.trim()).filter(k => k),
          senders: editForm.senders.split(',').map(s => s.trim()).filter(s => s)
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setLabels(labels.map(label => 
          label.id === editingLabel
            ? {
                ...label,
                name: editForm.name,
                description: editForm.description,
                keywords: editForm.keywords.split(',').map(k => k.trim()).filter(k => k),
                senders: editForm.senders.split(',').map(s => s.trim()).filter(s => s)
              }
            : label
        ));
        cancelEditing();
      } else {
        console.error('Failed to save label:', data.error);
      }
    } catch (error) {
      console.error('Error saving label:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading labels...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>
          <Settings className="icon" />
          Label Management Dashboard
        </h2>
        <p className="dashboard-subtitle">
          Configure which labels are active and customize their settings
        </p>
      </div>

      <div className="labels-grid">
        {labels.map((label) => (
          <div 
            key={label.id} 
            className={`label-card ${label.enabled ? 'enabled' : 'disabled'}`}
          >
            <div className="label-header">
              <div className="label-info">
                <span className="label-icon">{label.icon}</span>
                <div>
                  {editingLabel === label.id ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="edit-input label-name-input"
                    />
                  ) : (
                    <h3 className="label-name">{label.name}</h3>
                  )}
                  <div 
                    className="label-color" 
                    style={{ backgroundColor: label.color?.backgroundColor || '#cccccc' }}
                  ></div>
                </div>
              </div>
              
              <div className="label-actions">
                {editingLabel === label.id ? (
                  <div className="edit-actions">
                    <button onClick={saveLabel} className="btn btn-save">
                      <Save size={16} />
                    </button>
                    <button onClick={cancelEditing} className="btn btn-cancel">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => startEditing(label)}
                      className="btn btn-edit"
                    >
                      <Edit3 size={16} />
                    </button>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={label.enabled}
                        onChange={() => toggleLabel(label.id, label.enabled)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="label-content">
              {editingLabel === label.id ? (
                <>
                  <div className="edit-field">
                    <label>Description:</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      className="edit-textarea"
                      rows="2"
                    />
                  </div>
                  
                  <div className="edit-field">
                    <label>Keywords (comma-separated):</label>
                    <textarea
                      value={editForm.keywords}
                      onChange={(e) => setEditForm({...editForm, keywords: e.target.value})}
                      className="edit-textarea"
                      rows="3"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                  
                  <div className="edit-field">
                    <label>Senders (comma-separated):</label>
                    <textarea
                      value={editForm.senders}
                      onChange={(e) => setEditForm({...editForm, senders: e.target.value})}
                      className="edit-textarea"
                      rows="2"
                      placeholder="example.com, sender@domain.com"
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="label-description">{label.description}</p>
                  
                  {label.keywords && label.keywords.length > 0 && (
                    <div className="label-detail">
                      <strong>Keywords:</strong>
                      <div className="keywords-list">
                        {label.keywords.slice(0, 3).map((keyword, idx) => (
                          <span key={idx} className="keyword-tag">{keyword}</span>
                        ))}
                        {label.keywords.length > 3 && (
                          <span className="keyword-more">+{label.keywords.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {label.senders && label.senders.length > 0 && (
                    <div className="label-detail">
                      <strong>Senders:</strong>
                      <div className="senders-list">
                        {label.senders.slice(0, 2).map((sender, idx) => (
                          <span key={idx} className="sender-tag">{sender}</span>
                        ))}
                        {label.senders.length > 2 && (
                          <span className="sender-more">+{label.senders.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={`label-status ${label.enabled ? 'status-enabled' : 'status-disabled'}`}>
              {label.enabled ? 'Active' : 'Disabled'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;