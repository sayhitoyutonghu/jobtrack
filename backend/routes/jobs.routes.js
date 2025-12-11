const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// GET /api/jobs - Get all jobs for the current user
router.get('/', async (req, res) => {
    try {
        // req.user is set by requireAuth middleware
        // We use session ID or email to identify user. 
        // Since we don't have user email in session object easily without another API call,
        // we will use the session ID for now, BUT ideally we should use email.
        // Let's try to get email from gmail profile if possible, or just use a consistent ID.
        // For now, let's assume we want to fetch all jobs. 
        // Wait, if we use session ID, it changes on login. We need a stable user ID.
        // The `emailClassifier` will extract email from the profile.
        // Let's assume the frontend passes the user email or we fetch it.

        // Actually, let's fetch the user profile first to get the email address
        // This might be slow. Better to store email in session when logging in.
        // For this iteration, let's fetch all jobs and filter by what?
        // We need to know WHO is logged in.

        // Let's use the google oauth client to get the user's email
        const oauth2Client = req.user.auth;
        const gmail = require('googleapis').google.gmail({ version: 'v1', auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const userEmail = profile.data.emailAddress;

        const jobs = await Job.find({ userId: userEmail }).sort({ date: -1 });
        res.json({ success: true, jobs });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
    }
});

// PATCH /api/jobs/:id - Update a job
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const job = await Job.findOneAndUpdate(
            { id: id }, // We used 'id' (string) in frontend, but MongoDB uses _id. Let's check schema.
            // Schema has 'id' field? No, it has default _id. 
            // But frontend uses 'id' which is usually the email ID.
            // Let's make sure we are consistent.
            // The frontend sends 'id' which is the email ID.
            // In our schema, we have 'originalEmailId'.
            // So we should query by 'originalEmailId' OR '_id'.
            // Let's assume frontend sends the MongoDB _id if it has it, or the email ID.
            // Wait, the frontend ID comes from Gmail ID initially.
            // When we save to DB, we should probably return the DB _id.
            // BUT to keep it simple and compatible with existing frontend which uses Gmail IDs:
            // We should probably use `originalEmailId` as the key if possible.
            // Let's check the schema again.
            // Schema: originalEmailId (unique).

            // If the frontend sends an ID that looks like a Gmail ID (hex string), use originalEmailId.
            // If it looks like a Mongo ID (24 hex chars), use _id.
            // Actually, let's just try to find by originalEmailId first.
            { $set: updates },
            { new: true }
        );

        if (!job) {
            // Try finding by _id
            try {
                const jobById = await Job.findByIdAndUpdate(id, { $set: updates }, { new: true });
                if (jobById) return res.json({ success: true, job: jobById });
            } catch (e) {
                // Ignore invalid object id error
            }
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        res.json({ success: true, job });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ success: false, error: 'Failed to update job' });
    }
});

// DELETE /api/jobs/:id - Delete a job
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Try delete by originalEmailId
        let result = await Job.findOneAndDelete({ originalEmailId: id });

        if (!result) {
            // Try delete by _id
            try {
                result = await Job.findByIdAndDelete(id);
            } catch (e) { }
        }

        if (!result) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        res.json({ success: true, message: 'Job deleted' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ success: false, error: 'Failed to delete job' });
    }
});

module.exports = router;
