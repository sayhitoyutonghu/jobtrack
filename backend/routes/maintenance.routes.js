const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

/**
 * POST /api/maintenance/deduplicate
 * Clean up duplicate jobs and migrate old schema data
 */
router.post('/deduplicate', async (req, res) => {
    console.log('🧹 [maintenance] Starting deduplication process...');
    try {
        let stats = {
            migrated: 0,
            deleted: 0,
            scanned: 0
        };

        // 1. Migration: Copy originalEmailId to emailId if missing
        // Find jobs that have originalEmailId but NO emailId
        const jobsToMigrate = await Job.find({
            originalEmailId: { $exists: true, $ne: null },
            emailId: { $exists: false }
        });

        console.log(`[maintenance] Found ${jobsToMigrate.length} jobs to migrate schema...`);

        for (const job of jobsToMigrate) {
            try {
                // Check if target emailId already exists (conflict)
                const existing = await Job.findOne({ emailId: job.originalEmailId });
                if (existing) {
                    // Duplicate found during migration!
                    // We should delete the older/less complete one.
                    // For safety, let's keep the one that already has the new schema (existing)
                    // and delete this old one (job)
                    await Job.deleteOne({ _id: job._id });
                    stats.deleted++;
                } else {
                    job.emailId = job.originalEmailId;
                    await job.save();
                    stats.migrated++;
                }
            } catch (e) {
                console.error(`Error migrating job ${job._id}:`, e.message);
            }
        }

        // 2. Deduplication: Find duplicates by emailId
        // Aggregate to find emailIds that appear more than once
        const duplicates = await Job.aggregate([
            {
                $group: {
                    _id: "$emailId",
                    count: { $sum: 1 },
                    ids: { $push: "$_id" } // Keep track of all _ids for this emailId
                }
            },
            {
                $match: {
                    count: { $gt: 1 } // Only groups with > 1 document
                }
            }
        ]);

        console.log(`[maintenance] Found ${duplicates.length} duplicate sets by emailId...`);

        for (const group of duplicates) {
            if (!group._id) continue; // Skip null emailIds

            // ids is an array of ObjectIds.
            // We want to keep the NEWEST updated one (most recent scan usually has better data)
            // or maybe the oldest creation?
            // Let's fetch them to decide.
            const docs = await Job.find({ _id: { $in: group.ids } }).sort({ updatedAt: -1 });

            // Keep the first one (most recently updated), delete the rest
            const [keep, ...remove] = docs;

            if (remove.length > 0) {
                const removeIds = remove.map(d => d._id);
                await Job.deleteMany({ _id: { $in: removeIds } });
                stats.deleted += remove.length;
                console.log(`[maintenance] Fixed duplicate group for ${group._id}: kept ${keep._id}, removed ${removeIds.length}`);
            }
        }

        // 3. Description cleanup (optional, based on observed duplication in UI)
        // Sometimes same job, different email ID (e.g. follow ups).
        // For now, only focus on exact email ID duplicates.

        console.log('✅ [maintenance] Deduplication complete.', stats);
        res.json({
            success: true,
            message: 'Deduplication complete',
            stats
        });

    } catch (error) {
        console.error('Deduplication error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
