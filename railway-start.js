/**
 * Railway Production Start Script
 * 
 * This script handles the production startup for Railway deployment
 * It starts both the Node.js backend and Python ML service
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting JobTrack on Railway...');

// Start Python ML service
console.log('🐍 Starting Python ML service...');
const pythonProcess = spawn('python', ['app.py'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    FLASK_ENV: 'production',
    PORT: process.env.PYTHON_PORT || '5000'
  }
});

pythonProcess.on('error', (err) => {
  console.error('❌ Python service error:', err);
});

pythonProcess.on('exit', (code) => {
  console.log(`🐍 Python service exited with code ${code}`);
});

// Start Node.js backend
console.log('🟢 Starting Node.js backend...');
const nodeProcess = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, 'backend'),
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '3000',
    PYTHON_API_URL: process.env.PYTHON_API_URL || 'http://localhost:5000'
  }
});

nodeProcess.on('error', (err) => {
  console.error('❌ Node.js service error:', err);
});

nodeProcess.on('exit', (code) => {
  console.log(`🟢 Node.js service exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  pythonProcess.kill('SIGTERM');
  nodeProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  pythonProcess.kill('SIGINT');
  nodeProcess.kill('SIGINT');
});

// Keep the process alive
process.on('exit', () => {
  console.log('👋 JobTrack services stopped');
});
