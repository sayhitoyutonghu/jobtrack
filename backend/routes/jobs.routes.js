const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Read jobs from file
async function readJobs() {
    await ensureDataDir();
    try {
        const data = await fs.readFile(JOBS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {}; // Return empty object if file doesn't exist
        }
        throw error;
    }
}

// Write jobs to file
async function writeJobs(jobs) {
    await ensureDataDir();
    await fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

/**
 * GET /api/jobs
 * Retrieve all saved job overrides
 */
router.get('/', async (req, res) => {
    try {
        const jobs = await readJobs();
        res.json({
            success: true,
            jobs
        });
    } catch (error) {
        console.error('Error reading jobs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve jobs'
        });
    }
});

/**
 * POST /api/jobs
 * Save or update a job
 */
router.post('/', async (req, res) => {
    try {
        const { id, ...jobData } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Job ID is required'
            });
        }

        const jobs = await readJobs();

        // Update or create job entry
        jobs[id] = {
            id,
            ...jobData,
            updatedAt: new Date().toISOString()
        };

        await writeJobs(jobs);

        res.json({
            success: true,
            message: 'Job saved successfully',
            job: jobs[id]
        });
    } catch (error) {
        console.error('Error saving job:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save job'
        });
    }
});

module.exports = router;
