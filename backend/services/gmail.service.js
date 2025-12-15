const { google } = require('googleapis');
const { JOB_LABELS } = require('../config/labels');

class GmailService {
  constructor(auth) {
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  // Detect Gmail color palette error
  isColorPaletteError(error) {
    const msg = error?.response?.data?.error?.message || error?.message || '';
    return /allowed color palette|invalid.*color/i.test(msg);
  }

  /**
   * Create or update a colored label in Gmail
   */
  async createLabel(labelConfig) {
    // Check if label exists (new name)
    let existingLabel = await this.findLabel(labelConfig.name);

    // Migration: if not found, but old JobTrack/ prefix exists, rename it
    if (!existingLabel) {
      const oldName = `JobTrack/${labelConfig.name}`;
      const legacy = await this.findLabel(oldName);
      if (legacy) {
        console.log(`↪ Renaming legacy label: ${oldName} -> ${labelConfig.name}`);
        try {
          await this.gmail.users.labels.patch({
            userId: 'me',
            id: legacy.id,
            requestBody: {
              name: labelConfig.name,
              labelListVisibility: 'labelShow',
              messageListVisibility: 'show'
            }
          });
          existingLabel = { ...legacy, name: labelConfig.name };
        } catch (e) {
          console.warn(`Failed to rename ${oldName}: ${e.message}`);
        }
      }
    }

    // Migration: renamed categories (aliases)
    if (!existingLabel) {
      const ALIASES = {
        'Application': [
          'Application/Applied', 'Applied',
          'Application/Application-Viewed', 'Application-Viewed', 'Status-Update',
          'Application/Job-Alert', 'Job-Alert',
          'JobTrack/Applied', 'JobTrack/Application-Viewed', 'JobTrack/Job-Alert'
        ],
        'Interview': ['Interview/Scheduled', 'Interview/Invitation', 'Interview/Interviewed', 'Response-Needed', 'Interview-Scheduled']
      };
      const aliases = ALIASES[labelConfig.name] || [];
      for (const alias of aliases) {
        const found = await this.findLabel(alias);
        if (found) {
          console.log(`↪ Renaming alias label: ${alias} -> ${labelConfig.name}`);
          try {
            await this.gmail.users.labels.patch({
              userId: 'me',
              id: found.id,
              requestBody: {
                name: labelConfig.name,
                labelListVisibility: 'labelShow',
                messageListVisibility: 'show'
              }
            });
            existingLabel = { ...found, name: labelConfig.name };
            break;
          } catch (e) {
            console.warn(`Failed to rename ${alias}: ${e.message}`);
          }
        }
      }
    }

    if (existingLabel) {
      console.log(`✓ Label exists: ${labelConfig.name}`);
      // Try to update color and visibility, but tolerate palette errors
      try {
        await this.gmail.users.labels.patch({
          userId: 'me',
          id: existingLabel.id,
          requestBody: {
            color: labelConfig.color,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show'
          }
        });
      } catch (error) {
        if (this.isColorPaletteError(error)) {
          console.warn(`⚠ Color not allowed for ${labelConfig.name}. Trying fallbacks...`);
          const fallbacks = labelConfig.colorFallbacks || [];
          let applied = false;
          for (const fb of fallbacks) {
            try {
              await this.gmail.users.labels.patch({
                userId: 'me',
                id: existingLabel.id,
                requestBody: {
                  color: fb,
                  labelListVisibility: 'labelShow',
                  messageListVisibility: 'show'
                }
              });
              applied = true;
              console.log(`✓ Applied fallback color for ${labelConfig.name}`);
              break;
            } catch (e) {
              if (!this.isColorPaletteError(e)) throw e;
            }
          }
          if (!applied) {
            console.warn(`⚠ No fallback colors worked; updating visibility only for ${labelConfig.name}.`);
            await this.gmail.users.labels.patch({
              userId: 'me',
              id: existingLabel.id,
              requestBody: {
                labelListVisibility: 'labelShow',
                messageListVisibility: 'show'
              }
            });
          }
          return existingLabel;
        }
        throw error;
      }
      return existingLabel;
    }

    // Create new label (with fallback if color rejected)
    try {
      console.log(`Creating label: ${labelConfig.name}`);
      const response = await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: labelConfig.name,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
          color: labelConfig.color
        }
      });
      return response.data;
    } catch (error) {
      if (this.isColorPaletteError(error)) {
        console.warn(`⚠ Color not allowed for ${labelConfig.name}. Retrying without color...`);
        const response = await this.gmail.users.labels.create({
          userId: 'me',
          requestBody: {
            name: labelConfig.name,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show'
          }
        });
        return response.data;
      }
      console.error(`Error with label ${labelConfig.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Set up all job tracking labels
   */
  async setupAllLabels() {
    console.log('🎨 Setting up JobTrack labels in Gmail...');
    const results = [];

    for (const labelConfig of JOB_LABELS) {
      try {
        const label = await this.createLabel(labelConfig);
        results.push({
          success: true,
          name: labelConfig.name,
          icon: labelConfig.icon
        });

        // Rate limiting
        await this.sleep(200);
      } catch (error) {
        results.push({
          success: false,
          name: labelConfig.name,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    console.log(`✅ Set up ${successful}/${JOB_LABELS.length} labels`);

    return results;
  }

  /**
   * Get the user's email address
   */
  async getUserEmail() {
    const response = await this.gmail.users.getProfile({ userId: 'me' });
    return response.data.emailAddress;
  }

  /**
   * Create a single custom label
   */
  async createCustomLabel(labelData) {
    const { name, description, color, icon } = labelData;

    const labelConfig = {
      name,
      description: description || '',
      color: color || { backgroundColor: '#4a86e8', textColor: '#ffffff' },
      icon: icon || '📋',
      moveToFolder: false
    };

    return await this.createLabel(labelConfig);
  }

  /**
   * List all labels
   */
  async listLabels() {
    const response = await this.gmail.users.labels.list({ userId: 'me' });
    return response.data.labels || [];
  }

  /**
   * Find a label by name
   */
  async findLabel(labelName) {
    const response = await this.gmail.users.labels.list({ userId: 'me' });
    return response.data.labels?.find(l => l.name === labelName);
  }

  /**
   * Apply label to an entire thread (recommended for Gmail UI consistency)
   */
  async applyLabelToThread(threadId, labelName, removeInbox = false) {
    try {
      let label = await this.findLabel(labelName);

      // Auto-create if missing
      if (!label) {
        console.log(`Label ${labelName} not found. Attempting to create it...`);
        const labelConfig = JOB_LABELS.find(l => l.name === labelName);
        if (labelConfig) {
          label = await this.createLabel(labelConfig);
        } else {
          // Fallback for custom labels not in JOB_LABELS (shouldn't happen often for core logic)
          console.warn(`Label ${labelName} config not found. Creating with default settings.`);
          label = await this.createCustomLabel({ name: labelName });
        }
      }

      if (!label) {
        throw new Error(`Failed to find or create label ${labelName}`);
      }

      const request = {
        userId: 'me',
        id: threadId,
        requestBody: {
          // Always keep in INBOX for visibility
          addLabelIds: [label.id, 'INBOX']
        }
      };

      await this.gmail.users.threads.modify(request);
      return { success: true, labelId: label.id };
    } catch (error) {
      console.error('Error applying label to thread:', error.message);
      throw error;
    }
  }

  /**
   * Legacy: Apply label to a single message (kept for compatibility)
   */
  async applyLabel(messageId, labelName, removeInbox = false) {
    try {
      const label = await this.findLabel(labelName);
      if (!label) {
        throw new Error(`Label ${labelName} not found. Run /setup first.`);
      }

      const modifyRequest = {
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [label.id]
        }
      };

      if (removeInbox) {
        modifyRequest.requestBody.removeLabelIds = ['INBOX'];
      }

      await this.gmail.users.messages.modify(modifyRequest);
      return { success: true, labelId: label.id };
    } catch (error) {
      console.error(`Error applying label:`, error.message);
      throw error;
    }
  }

  /**
   * Debug helper: get label names applied to a thread
   */
  async getThreadLabelNames(threadId) {
    // Fetch thread to get labelIds
    const threadResp = await this.gmail.users.threads.get({
      userId: 'me',
      id: threadId
    });

    // Collect label IDs from messages in the thread (union)
    const labelIdSet = new Set();
    for (const msg of threadResp.data.messages || []) {
      for (const lid of msg.labelIds || []) {
        labelIdSet.add(lid);
      }
    }

    // Build label map id -> name
    const labelsResp = await this.gmail.users.labels.list({ userId: 'me' });
    const map = new Map((labelsResp.data.labels || []).map(l => [l.id, l.name]));

    return Array.from(labelIdSet).map(id => map.get(id) || id);
  }

  /**
   * Add INBOX back to a thread (reinbox)
   */
  async addInboxToThread(threadId) {
    await this.gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: { addLabelIds: ['INBOX'] }
    });
  }

  /**
   * List message stubs by labelId (for backfill utilities)
   */
  async listMessagesByLabelId(labelId, maxResults = 100) {
    const resp = await this.gmail.users.messages.list({
      userId: 'me',
      labelIds: [labelId],
      maxResults
    });
    return resp.data.messages || [];
  }

  /**
   * Remove a label from an entire thread
   */
  async removeLabelFromThread(threadId, labelName) {
    const label = await this.findLabel(labelName);
    if (!label) return { success: false, reason: 'label-not-found' };
    await this.gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: { removeLabelIds: [label.id] }
    });
    return { success: true, removed: labelName };
  }

  /**
   * Remove a label from all messages that have it
   */
  async removeLabelFromAllMessages(labelName, maxResults = 100) {
    const label = await this.findLabel(labelName);
    if (!label) return { success: false, reason: 'label-not-found' };

    try {
      // 获取所有带有该label的消息
      const messages = await this.listMessagesByLabelId(label.id, maxResults);
      let removedCount = 0;

      for (const message of messages) {
        try {
          // 获取消息详情以获取threadId
          const email = await this.getEmail(message.id);
          await this.gmail.users.threads.modify({
            userId: 'me',
            id: email.threadId,
            requestBody: { removeLabelIds: [label.id] }
          });
          removedCount++;
          await this.sleep(100); // 避免API限制
        } catch (error) {
          console.warn(`Failed to remove label from message ${message.id}:`, error.message);
        }
      }

      return {
        success: true,
        removed: labelName,
        count: removedCount,
        total: messages.length
      };
    } catch (error) {
      console.error(`Error removing label ${labelName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a label completely from Gmail by label ID
   */
  async deleteLabelById(labelId) {
    try {
      // 首先获取标签信息以检查是否是系统标签
      const label = await this.gmail.users.labels.get({
        userId: 'me',
        id: labelId
      });

      const labelName = label.data.name;

      // 检查是否是系统标签（不能删除）
      const systemLabels = ['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH', 'STARRED', 'IMPORTANT', 'UNREAD'];
      if (systemLabels.includes(labelName)) {
        return { success: false, reason: 'system-label', message: 'Cannot delete system labels' };
      }

      // 删除标签
      await this.gmail.users.labels.delete({
        userId: 'me',
        id: labelId
      });

      console.log(`✅ Successfully deleted label by ID: ${labelName} (${labelId})`);
      return {
        success: true,
        deleted: labelName,
        labelId: labelId
      };
    } catch (error) {
      console.error(`Error deleting label by ID ${labelId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a label completely from Gmail
   */
  async deleteLabel(labelName) {
    const label = await this.findLabel(labelName);
    if (!label) return { success: false, reason: 'label-not-found' };

    try {
      // 检查是否是系统标签（不能删除）
      const systemLabels = ['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH', 'STARRED', 'IMPORTANT', 'UNREAD'];
      if (systemLabels.includes(label.name)) {
        return { success: false, reason: 'system-label', message: 'Cannot delete system labels' };
      }

      // 删除标签
      await this.gmail.users.labels.delete({
        userId: 'me',
        id: label.id
      });

      console.log(`✅ Successfully deleted label: ${labelName}`);
      return {
        success: true,
        deleted: labelName,
        labelId: label.id
      };
    } catch (error) {
      console.error(`Error deleting label ${labelName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Migrate all messages from one label to another, then delete the old label
   */
  async migrateLabelTo(oldName, newName, maxResults = 500) {
    const from = await this.findLabel(oldName);
    const to = await this.findLabel(newName);
    if (!from) {
      return { migrated: 0, deleted: false, note: `old label '${oldName}' not found` };
    }
    if (!to) {
      throw new Error(`target label '${newName}' not found; run /setup first`);
    }

    const messages = await this.listMessagesByLabelId(from.id, maxResults);
    let migrated = 0;
    for (const m of messages) {
      const email = await this.getEmail(m.id);
      await this.applyLabelToThread(email.threadId, newName, false);
      await this.removeLabelFromThread(email.threadId, oldName);
      migrated++;
      await this.sleep(50);
    }

    // Delete old label after migration
    await this.gmail.users.labels.delete({ userId: 'me', id: from.id });
    return { migrated, deleted: true };
  }

  /**
   * Get email details
   */
  async getEmail(messageId) {
    const response = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const message = response.data;
    const headers = message.payload.headers || [];

    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : '';
    };

    const decodePart = (part) => {
      if (!part) return '';
      if (part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString();
      }
      if (Array.isArray(part.parts)) {
        return part.parts.map(decodePart).join('\n');
      }
      return '';
    };

    const extractPlainText = (payload) => {
      if (!payload) return '';
      if (payload.mimeType === 'text/plain') {
        return decodePart(payload);
      }

      if (payload.mimeType === 'text/html') {
        const html = decodePart(payload);
        return html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ');
      }

      if (Array.isArray(payload.parts)) {
        let text = '';
        for (const part of payload.parts) {
          text += extractPlainText(part) + '\n';
        }
        return text;
      }

      return decodePart(payload);
    };

    const rawBody = extractPlainText(message.payload) || '';
    const normalizedBody = rawBody
      .replace(/\u00a0/g, ' ')
      .replace(/[\r\t]+/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .replace(/https?:\/\/[\S]+/g, '[link]')
      .replace(/\s{3,}/g, ' ')
      .trim();
    const clippedBody = normalizedBody.substring(0, 20000);

    return {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader('Subject') || message.payload?.headers?.find(h => h.name === 'subject')?.value || '',
      from: getHeader('From'),
      to: getHeader('To'),
      date: getHeader('Date'),
      snippet: message.snippet,
      body: clippedBody,
      plainBodyLength: normalizedBody.length,
      labelIds: message.labelIds || []
    };
  }

  /**
   * Scan for new emails
   */
  async scanNewEmails(query = 'is:unread', maxResults = 50) {
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults
    });

    return response.data.messages || [];
  }

  /**
   * Helper: sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get authenticated user's email address
   */
  async getUserEmail() {
    try {
      const profile = await this.gmail.users.getProfile({ userId: 'me' });
      return profile.data.emailAddress;
    } catch (error) {
      console.error('Error fetching user profile:', error.message);
      return 'unknown';
    }
  }
}

module.exports = GmailService;