const express = require('express');
const router = express.Router();
const { GMAIL_COLORS, JOB_LABELS } = require('../config/labels');
const fs = require('fs').promises;
const path = require('path');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, '../data/label-config.json');

// 读取配置
async function loadConfig() {
  try {
    console.log('[labels] Loading config from:', CONFIG_FILE);
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    const config = JSON.parse(data);
    console.log('[labels] Loaded config:', JSON.stringify(config, null, 2));
    return config;
  } catch (error) {
    console.log('[labels] Error loading config:', error.message);
    // 如果文件不存在，返回默认配置
    return {
      labels: JOB_LABELS.reduce((acc, label) => {
        const id = label.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        acc[id] = {
          enabled: true,
          name: label.name,
          description: label.description,
          keywords: label.keywords || [],
          senders: label.senders || []
        };
        return acc;
      }, {})
    };
  }
}

// 保存配置
async function saveConfig(config) {
  console.log('[labels] Saving config to:', CONFIG_FILE);
  console.log('[labels] Config data:', JSON.stringify(config, null, 2));
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log('[labels] Config saved successfully');
}

/**
 * GET /api/labels - Get all label configurations with enabled/disabled status
 */
router.get('/', async (req, res) => {
  try {
    const config = await loadConfig();
    
    // Get preset labels
    const presetLabels = JOB_LABELS.map(label => {
      const id = label.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const savedConfig = config.labels[id] || {};
      
      return {
        ...label,
        id,
        enabled: savedConfig.enabled !== undefined ? savedConfig.enabled : true,
        description: savedConfig.description || label.description,
        keywords: savedConfig.keywords || label.keywords || [],
        senders: savedConfig.senders || label.senders || [],
        type: 'preset'
      };
    });

    // Get custom labels from Gmail if user is authenticated
    let customLabels = [];
    if (req.user && req.user.auth) {
      try {
        const GmailService = require('../services/gmail.service');
        const gmailService = new GmailService(req.user.auth);
        const gmailLabels = await gmailService.listLabels();
        
        // Filter out system labels and preset labels
        const presetLabelNames = JOB_LABELS.map(l => l.name);
        customLabels = gmailLabels
          .filter(label => 
            label.type === 'user' && 
            !presetLabelNames.includes(label.name) &&
            !label.name.startsWith('JobTrack/') // Exclude our own labels
          )
          .map(label => ({
            id: label.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: label.name,
            description: `Custom label: ${label.name}`,
            keywords: [],
            senders: [],
            enabled: true,
            type: 'custom',
            color: {
              backgroundColor: label.color?.backgroundColor || '#4a86e8',
              textColor: label.color?.textColor || '#ffffff'
            },
            icon: '📋',
            messagesTotal: label.messagesTotal || 0,
            messagesUnread: label.messagesUnread || 0
          }));
      } catch (gmailError) {
        console.warn('Failed to fetch custom labels from Gmail:', gmailError.message);
        // Continue without custom labels if Gmail fetch fails
      }
    }

    const allLabels = [...presetLabels, ...customLabels];

    res.json({
      success: true,
      labels: allLabels,
      colors: GMAIL_COLORS
    });
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/labels/:id/toggle - Toggle a label's enabled/disabled status
 */
router.put('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    console.log(`[labels] Toggle request: id=${id}, enabled=${enabled}`);

    const config = await loadConfig();
    console.log(`[labels] Loaded config:`, JSON.stringify(config, null, 2));
    
    if (!config.labels[id]) {
      console.log(`[labels] Label ${id} not found`);
      return res.status(404).json({
        success: false,
        error: 'Label not found'
      });
    }

    console.log(`[labels] Before update: ${id}.enabled = ${config.labels[id].enabled}`);
    config.labels[id].enabled = enabled;
    console.log(`[labels] After update: ${id}.enabled = ${config.labels[id].enabled}`);
    
    await saveConfig(config);
    console.log(`[labels] Config saved, sending response`);

    res.json({
      success: true,
      message: `Label ${id} ${enabled ? 'enabled' : 'disabled'}`,
      labelId: id,
      enabled
    });
  } catch (error) {
    console.error('Error toggling label:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/labels/:id - Update label configuration
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, keywords, senders } = req.body;

    const config = await loadConfig();
    
    if (!config.labels[id]) {
      return res.status(404).json({
        success: false,
        error: 'Label not found'
      });
    }

    // 更新配置
    if (name !== undefined) config.labels[id].name = name;
    if (description !== undefined) config.labels[id].description = description;
    if (keywords !== undefined) config.labels[id].keywords = keywords;
    if (senders !== undefined) config.labels[id].senders = senders;
    
    await saveConfig(config);

    res.json({
      success: true,
      message: `Label ${id} updated successfully`,
      labelId: id,
      updates: { name, description, color, keywords, senders }
    });
  } catch (error) {
    console.error('Error updating label:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/labels/:id/remove-from-gmail - Remove label from all messages in Gmail
 */
router.post('/:id/remove-from-gmail', async (req, res) => {
  try {
    const { id } = req.params;
    const { maxResults = 100 } = req.body;

    console.log(`[labels] Remove from Gmail request: id=${id}, maxResults=${maxResults}`);

    // 检查用户是否已认证
    if (!req.user || !req.user.auth) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const config = await loadConfig();
    if (!config.labels[id]) {
      return res.status(404).json({
        success: false,
        error: 'Label not found'
      });
    }

    const labelName = config.labels[id].name;
    console.log(`[labels] Removing label "${labelName}" from Gmail messages`);

    // 使用Gmail服务移除label
    const GmailService = require('../services/gmail.service');
    const gmailService = new GmailService(req.user.auth);
    
    const result = await gmailService.removeLabelFromAllMessages(labelName, maxResults);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Removed label "${labelName}" from ${result.count} messages`,
        labelName,
        removedCount: result.count,
        totalFound: result.total
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to remove label from messages'
      });
    }
  } catch (error) {
    console.error('Error removing label from Gmail:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/labels/:id/delete-from-gmail - Delete label completely from Gmail
 */
router.delete('/:id/delete-from-gmail', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[labels] Delete from Gmail request: id=${id}`);

    // 检查用户是否已认证
    if (!req.user || !req.user.auth) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const config = await loadConfig();
    if (!config.labels[id]) {
      return res.status(404).json({
        success: false,
        error: 'Label not found'
      });
    }

    const labelName = config.labels[id].name;
    console.log(`[labels] Deleting label "${labelName}" from Gmail`);

    // 使用Gmail服务删除label
    const GmailService = require('../services/gmail.service');
    const gmailService = new GmailService(req.user.auth);
    
    const result = await gmailService.deleteLabel(labelName);
    
    if (result.success) {
      // 从配置中移除该label
      delete config.labels[id];
      await saveConfig(config);
      
      res.json({
        success: true,
        message: `Successfully deleted label "${labelName}" from Gmail`,
        labelName,
        labelId: result.labelId
      });
    } else {
      let errorMessage = result.error || 'Failed to delete label';
      if (result.reason === 'system-label') {
        errorMessage = 'Cannot delete system labels (INBOX, SENT, etc.)';
      } else if (result.reason === 'label-not-found') {
        errorMessage = 'Label not found in Gmail';
      }
      
      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  } catch (error) {
    console.error('Error deleting label from Gmail:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;