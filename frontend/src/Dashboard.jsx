import PropTypes from 'prop-types';
import { Settings, Edit3, Save, X, PlayCircle, PauseCircle, Clock, Activity, Trash2, AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import './Dashboard.css';
import { gmailApi } from './api/client';

const Dashboard = ({ labels, loading, onRefresh, onToggleUpdate }) => {
  const [editingLabel, setEditingLabel] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deletingLabel, setDeletingLabel] = useState(null);
  const [togglingLabel, setTogglingLabel] = useState(null);
  const [toggleError, setToggleError] = useState(null);

  const stableLabels = useMemo(() => labels || [], [labels]);
  const [localLabels, setLocalLabels] = useState(stableLabels);

  useEffect(() => {
    setLocalLabels(stableLabels);
  }, [stableLabels]);

  const toggleLabel = async (labelId, currentEnabled) => {
    setTogglingLabel(labelId);
    setToggleError(null);
    const nextEnabled = !currentEnabled;
    const previousLabels = localLabels;

    setLocalLabels((prev) =>
      prev.map((label) =>
        label.id === labelId ? { ...label, enabled: nextEnabled } : label
      )
    );

    try {
      const response = await gmailApi.toggleLabel(labelId, nextEnabled);

      if (response.success) {
        const finalEnabled = typeof response.enabled === 'boolean' ? response.enabled : nextEnabled;
        if (finalEnabled !== nextEnabled) {
          setLocalLabels((prev) =>
            prev.map((label) =>
              label.id === labelId ? { ...label, enabled: finalEnabled } : label
            )
          );
        }

        if (onToggleUpdate) {
          onToggleUpdate(labelId, finalEnabled);
        }
      } else {
        const error = response.error || 'Failed to toggle label';
        console.error('Failed to toggle label:', error);
        setLocalLabels(previousLabels);
        setToggleError(error);
      }
    } catch (error) {
      console.error('Error toggling label:', error);
      setLocalLabels(previousLabels);
      const message = error?.response?.data?.error || error.message || 'Network error while toggling label';
      setToggleError(message);
    } finally {
      setTogglingLabel(null);
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
      const response = await fetch(`http://localhost:3000/api/labels/${editingLabel}`, {
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
      
      if (data.success && onRefresh) {
        cancelEditing();
        onRefresh();
      } else if (!data.success) {
        console.error('Failed to save label:', data.error);
      }
    } catch (error) {
      console.error('Error saving label:', error);
    }
  };


  const deleteLabelFromGmail = async (labelId, labelName) => {
    const confirmMessage = `⚠️ DANGER: This will permanently delete the "${labelName}" label from Gmail!\n\nThis action:\n• Cannot be undone\n• Will remove the label from ALL messages\n• Will delete the label completely from Gmail\n\nAre you absolutely sure you want to continue?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingLabel(labelId);
    try {
      const result = await gmailApi.deleteLabelFromGmail(labelId);
      
      if (result.success) {
        alert(`✅ Successfully deleted "${labelName}" label from Gmail!`);
        if (onRefresh) onRefresh();
      } else {
        alert(`❌ Failed to delete label: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting label from Gmail:', error);
      alert(`❌ Error deleting label: ${error.message}`);
    } finally {
      setDeletingLabel(null);
    }
  };

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

      {toggleError && (
        <div className="dashboard-alert error">
          <AlertTriangle size={16} />
          <span>{toggleError}</span>
        </div>
      )}

      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading labels...</p>
        </div>
      ) : (
        <div className="labels-grid">
        {localLabels.map((label) => (
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
                    <button 
                      onClick={() => deleteLabelFromGmail(label.id, label.name)}
                      className="btn btn-delete"
                      disabled={deletingLabel === label.id}
                      title="⚠️ PERMANENTLY DELETE this label from Gmail (cannot be undone!)"
                    >
                      {deletingLabel === label.id ? (
                        <Activity size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                    <button 
                      className={`btn ${label.enabled ? 'btn-success' : 'btn-secondary'}`}
                      onClick={() => {
                        toggleLabel(label.id, label.enabled);
                      }}
                      disabled={togglingLabel === label.id}
                      style={{
                        minWidth: '60px',
                        height: '32px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      {togglingLabel === label.id
                        ? '...'
                        : label.enabled ? 'ON' : 'OFF'}
                    </button>
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
      )}

      <div className="dashboard-footer">
        <button className="btn btn-refresh" onClick={onRefresh}>
          <Settings size={16} /> Refresh Labels
        </button>
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  labels: PropTypes.array,
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
  onToggleUpdate: PropTypes.func
};

Dashboard.defaultProps = {
  labels: [],
  loading: false,
  onRefresh: () => {},
  onToggleUpdate: () => {}
};

export default Dashboard;