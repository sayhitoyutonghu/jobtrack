const express = require('express');
const router = express.Router();
const { GMAIL_COLORS, JOB_LABELS } = require('../config/labels');

/**
 * GET /api/labels - Get all label configurations with enabled/disabled status
 */
router.get('/', async (req, res) => {
  try {
    const labelsWithStatus = JOB_LABELS.map(label => ({
      ...label,
      enabled: true, // Default all to enabled for now
      id: label.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    }));

    res.json({
      success: true,
      labels: labelsWithStatus,
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

    // For now, we'll just return success
    // In a real implementation, you'd want to store this in a database
    // or modify the labels configuration dynamically

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

    // For now, we'll just return success
    // In a real implementation, you'd want to update the actual configuration

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

module.exports = router;