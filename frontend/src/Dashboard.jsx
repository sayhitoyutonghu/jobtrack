import PropTypes from 'prop-types';
import { Settings, Edit3, Save, X, Trash2, AlertTriangle, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { gmailApi } from './api/client';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for merging tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

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
      // Note: This URL should ideally come from an environment variable or API client
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/labels/${editingLabel}`, {
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
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-12 border-b-4 border-black pb-6">
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter flex items-center gap-4 mb-4">
          <Settings className="w-10 h-10 md:w-16 md:h-16" strokeWidth={2.5} />
          Label Management
        </h2>
        <p className="text-xl font-bold text-zinc-500 uppercase tracking-wide">
          Configure active labels & customization settings
        </p>
      </div>

      {toggleError && (
        <div className="mb-8 bg-red-100 border-4 border-red-600 p-4 flex items-center gap-3 font-bold text-red-600">
          <AlertTriangle size={24} />
          <span>{toggleError}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-8 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-2xl font-black uppercase">Loading labels...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {localLabels.map((label) => (
            <div
              key={label.id}
              className={cn(
                "bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all",
                !label.enabled && "opacity-75 bg-zinc-50"
              )}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                <div className="flex items-start gap-4 flex-1">
                  <span className="text-4xl">{label.icon}</span>
                  <div className="flex-1">
                    {editingLabel === label.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full text-3xl font-black uppercase border-b-4 border-black focus:outline-none focus:border-blue-600 bg-transparent mb-2"
                      />
                    ) : (
                      <h3 className="text-3xl font-black uppercase tracking-tight mb-2">{label.name}</h3>
                    )}
                    <div
                      className="h-2 w-24 border-2 border-black"
                      style={{ backgroundColor: label.color?.backgroundColor || '#cccccc' }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {editingLabel === label.id ? (
                    <>
                      <button
                        onClick={saveLabel}
                        className="p-2 bg-green-600 text-white border-2 border-black hover:bg-green-700 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                      >
                        <Save size={20} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-2 bg-red-600 text-white border-2 border-black hover:bg-red-700 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                      >
                        <X size={20} strokeWidth={2.5} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(label)}
                        className="p-2 hover:bg-black hover:text-white border-2 border-black transition-colors"
                        title="Edit Label"
                      >
                        <Edit3 size={20} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => deleteLabelFromGmail(label.id, label.name)}
                        className="p-2 hover:bg-red-600 hover:text-white border-2 border-black transition-colors"
                        disabled={deletingLabel === label.id}
                        title="Delete Label"
                      >
                        {deletingLabel === label.id ? (
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 size={20} strokeWidth={2.5} />
                        )}
                      </button>
                      <button
                        className={cn(
                          "px-4 py-2 font-bold border-2 border-black transition-colors min-w-[80px]",
                          label.enabled
                            ? "bg-green-400 text-black hover:bg-green-500"
                            : "bg-zinc-200 text-zinc-500 hover:bg-zinc-300"
                        )}
                        onClick={() => {
                          toggleLabel(label.id, label.enabled);
                        }}
                        disabled={togglingLabel === label.id}
                      >
                        {togglingLabel === label.id
                          ? '...'
                          : label.enabled ? 'ACTIVE' : 'OFF'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {editingLabel === label.id ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase mb-2">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full p-3 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        rows="2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase mb-2">Keywords (comma-separated)</label>
                      <textarea
                        value={editForm.keywords}
                        onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })}
                        className="w-full p-3 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        rows="3"
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase mb-2">Senders (comma-separated)</label>
                      <textarea
                        value={editForm.senders}
                        onChange={(e) => setEditForm({ ...editForm, senders: e.target.value })}
                        className="w-full p-3 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        rows="2"
                        placeholder="example.com, sender@domain.com"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium text-zinc-700 border-l-4 border-zinc-200 pl-4 italic">
                      {label.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {label.keywords && label.keywords.length > 0 && (
                        <div className="bg-zinc-50 p-4 border-2 border-black">
                          <strong className="block text-xs font-black uppercase mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-black"></span>
                            Keywords
                          </strong>
                          <div className="flex flex-wrap gap-2">
                            {label.keywords.slice(0, 5).map((keyword, idx) => (
                              <span key={idx} className="px-2 py-1 bg-white border border-black text-xs font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {keyword}
                              </span>
                            ))}
                            {label.keywords.length > 5 && (
                              <span className="px-2 py-1 text-xs font-bold text-zinc-500">
                                +{label.keywords.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {label.senders && label.senders.length > 0 && (
                        <div className="bg-zinc-50 p-4 border-2 border-black">
                          <strong className="block text-xs font-black uppercase mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-black"></span>
                            Senders
                          </strong>
                          <div className="flex flex-wrap gap-2">
                            {label.senders.slice(0, 3).map((sender, idx) => (
                              <span key={idx} className="px-2 py-1 bg-white border border-black text-xs font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {sender}
                              </span>
                            ))}
                            {label.senders.length > 3 && (
                              <span className="px-2 py-1 text-xs font-bold text-zinc-500">
                                +{label.senders.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 flex justify-center">
        <button
          className="px-8 py-4 bg-black text-white text-xl font-black uppercase border-4 border-black hover:bg-white hover:text-black transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] flex items-center gap-3"
          onClick={onRefresh}
        >
          <Settings className="animate-spin-slow" />
          Refresh Configuration
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
  onRefresh: () => { },
  onToggleUpdate: () => { }
};

export default Dashboard;