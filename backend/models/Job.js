const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    company: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'Unknown Role'
    },
    status: {
        type: String,
        enum: ['Applied', 'Interviewing', 'Offer', 'Rejected'],
        default: 'Applied'
    },
    salary: {
        type: String,
        default: 'Unknown'
    },
    location: {
        type: String,
        default: 'Unknown'
    },
    date: {
        type: Date,
        default: Date.now
    },
    emailSnippet: {
        type: String
    },
    emailId: {
        type: String,
        unique: true,
        sparse: true // Allows null/undefined to not be unique, though we expect it to be present for scanned jobs
    },
    threadId: {
        type: String
    },
    description: {
        type: String
    },
    category: {
        type: String,
        enum: ['application', 'interview', 'offer', 'rejection', 'job_alert', 'other'],
        default: 'application'
    },
    rawClassification: {
        type: mongoose.Schema.Types.Mixed // Stores AI's full JSON output for future reprocessing
    },
    trashed: {
        type: Boolean,
        default: false,
        index: true
    },
    trashedDate: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Job', JobSchema);
