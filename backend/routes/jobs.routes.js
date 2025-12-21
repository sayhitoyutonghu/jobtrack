const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// GET /api/jobs - Get all active jobs for the current user (excluding trashed)
router.get('/', async (req, res) => {
    try {
        const oauth2Client = req.user.auth;
        const gmail = require('googleapis').google.gmail({ version: 'v1', auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const userEmail = profile.data.emailAddress;

        // Only fetch non-trashed jobs
        const jobs = await Job.find({ userId: userEmail, trashed: { $ne: true } }).sort({ date: -1 });
        res.json({ success: true, jobs });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
    }
});

// GET /api/jobs/trash - Get all trashed jobs
router.get('/trash', async (req, res) => {
    try {
        const oauth2Client = req.user.auth;
        const gmail = require('googleapis').google.gmail({ version: 'v1', auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const userEmail = profile.data.emailAddress;

        const jobs = await Job.find({ userId: userEmail, trashed: true }).sort({ trashedDate: -1 });
        res.json({ success: true, jobs });
    } catch (error) {
        console.error('Error fetching trashed jobs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch trashed jobs' });
    }
});

// PATCH /api/jobs/:id - Update a job
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const job = await Job.findOneAndUpdate(
            { emailId: id },
            { $set: updates },
            { new: true }
        );

        if (!job) {
            try {
                const jobById = await Job.findByIdAndUpdate(id, { $set: updates }, { new: true });
                if (jobById) return res.json({ success: true, job: jobById });
            } catch (e) { }
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        res.json({ success: true, job });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ success: false, error: 'Failed to update job' });
    }
});

// POST /api/jobs/:id/restore - Restore a trashed job
router.post('/:id/restore', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { trashed: false, trashedDate: null };

        let job = await Job.findOneAndUpdate(
            { emailId: id },
            { $set: updates },
            { new: true }
        );

        if (!job) {
            try {
                job = await Job.findByIdAndUpdate(id, { $set: updates }, { new: true });
            } catch (e) { }
        }

        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        res.json({ success: true, job });
    } catch (error) {
        console.error('Error restoring job:', error);
        res.status(500).json({ success: false, error: 'Failed to restore job' });
    }
});

// DELETE /api/jobs/:id - Soft Delete a job (Move to Trash)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { trashed: true, trashedDate: new Date() };

        let job = await Job.findOneAndUpdate(
            { emailId: id },
            { $set: updates },
            { new: true }
        );

        if (!job) {
            try {
                job = await Job.findByIdAndUpdate(id, { $set: updates }, { new: true });
            } catch (e) { }
        }

        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        res.json({ success: true, message: 'Job moved to trash' });
    } catch (error) {
        console.error('Error moving job to trash:', error);
        res.status(500).json({ success: false, error: 'Failed to move job to trash' });
    }
});

// DELETE /api/jobs/:id/permanent - Permanently Delete a job
router.delete('/:id/permanent', async (req, res) => {
    try {
        const { id } = req.params;
        let result = await Job.findOneAndDelete({ emailId: id });

        if (!result) {
            try {
                result = await Job.findByIdAndDelete(id);
            } catch (e) { }
        }

        if (!result) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        res.json({ success: true, message: 'Job permanently deleted' });
    } catch (error) {
        console.error('Error permanently deleting job:', error);
        res.status(500).json({ success: false, error: 'Failed to delete job' });
    }
});

module.exports = router;
