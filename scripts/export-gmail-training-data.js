#!/usr/bin/env node
/**
 * Quick utility to run a Gmail scan via the backend API and persist
 * the results as CSV for training / evaluation use.
 *
 * Usage:
 *   node scripts/export-gmail-training-data.js --query "is:unread" --maxResults 50 --outfile data/training-snapshot.csv
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const SESSION_ID = process.env.JOBTRACK_SESSION_ID || process.env.SESSION_ID;

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    query: 'is:unread',
    maxResults: 50,
    outfile: path.join('data', `training-${Date.now()}.csv`)
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (!value) continue;

    switch (key) {
      case '--query':
        options.query = value;
        break;
      case '--maxResults':
        options.maxResults = Number(value) || options.maxResults;
        break;
      case '--outfile':
        options.outfile = value;
        break;
      default:
        console.warn(`Unknown argument: ${key}`);
    }
  }

  return options;
}

async function main() {
  if (!SESSION_ID) {
    console.error('❌ Missing SESSION_ID environment variable.');
    console.error('   Run the frontend login flow, copy the session id, and export it e.g.');
    console.error('   export JOBTRACK_SESSION_ID=your_session_id_here');
    process.exit(1);
  }

  const { query, maxResults, outfile } = parseArgs();
  const outPath = path.resolve(outfile);
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('📬 Fetching Gmail scan results...');
  console.log(`   query: ${query}`);
  console.log(`   maxResults: ${maxResults}`);

  const response = await axios.post(
    `${API_BASE_URL}/api/gmail/scan`,
    { query, maxResults },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': SESSION_ID
      }
    }
  );

  if (!response.data?.success) {
    throw new Error(response.data?.error || 'Scan failed');
  }

  const records = response.data.results || [];
  console.log(`   Received ${records.length} rows. Writing CSV -> ${outPath}`);

  const headers = ['threadId', 'messageId', 'label', 'skipped', 'subject', 'from', 'snippet'];
  const csv = [headers.join(',')];

  for (const item of records) {
    const row = [
      item.threadId || '',
      item.id || '',
      item.label || '',
      item.skipped || '',
      (item.subject || '').replace(/"/g, '""'),
      (item.from || '').replace(/"/g, '""'),
      (item.snippet || '').replace(/"/g, '""')
    ].map((cell) => `"${cell}"`);
    csv.push(row.join(','));
  }

  fs.writeFileSync(outPath, csv.join('\n'), 'utf8');
  console.log('✅ Export complete.');
}

main().catch((err) => {
  console.error('❌ Export failed:', err.message);
  process.exit(1);
});


