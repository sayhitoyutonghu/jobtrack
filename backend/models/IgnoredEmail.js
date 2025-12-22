const mongoose = require('mongoose');

const IgnoredEmailSchema = new mongoose.Schema({
    emailId: { type: String, required: true, unique: true }, // 核心去重ID
    threadId: { type: String }, // Gmail thread ID for future operations
    subject: String,
    sender: String,
    category: {
        type: String,
        enum: ['job_alert', 'receipt', 'promo', 'spam', 'not_job_related', 'other'],
        default: 'other'
    }, // AI classification category
    company: { type: String, default: 'Unknown' }, // Even for junk, store if available
    position: { type: String, default: 'Unknown' }, // Role/position if mentioned
    reason: String, // Human-readable skip reason ('job_alert', 'receipt', etc.)
    rawClassification: { type: mongoose.Schema.Types.Mixed }, // AI's full JSON output
    date: { type: Date, default: Date.now }, // Email date
    scannedAt: { type: Date, default: Date.now } // When first scanned by our system
});

module.exports = mongoose.model('IgnoredEmail', IgnoredEmailSchema);
