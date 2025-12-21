const mongoose = require('mongoose');

const IgnoredEmailSchema = new mongoose.Schema({
    emailId: { type: String, required: true, unique: true }, // 核心去重ID
    subject: String,
    sender: String,
    reason: String, // 记录为什么被忽略 (比如 "job_alert", "promo")
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IgnoredEmail', IgnoredEmailSchema);
