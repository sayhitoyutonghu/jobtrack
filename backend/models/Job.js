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
    description: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Job', JobSchema);
