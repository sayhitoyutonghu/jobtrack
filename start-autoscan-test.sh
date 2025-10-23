#!/bin/bash

echo "🚀 Starting JobTrack Backend with Auto-Scan Test"
echo "═══════════════════════════════════════════════════════"

echo ""
echo "📦 Installing dependencies..."
cd backend
npm install

echo ""
echo "🔧 Starting backend server..."
npm run start:autoscan &
BACKEND_PID=$!

echo ""
echo "⏳ Waiting for server to start..."
sleep 5

echo ""
echo "🧪 Running auto-scan tests..."
cd ..
node test-autoscan.js

echo ""
echo "✅ Test completed! Check the backend console for logs."
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "📡 Backend: http://localhost:3000"
echo "❤️  Health: http://localhost:3000/health"
echo "🔍 Detailed: http://localhost:3000/health/detailed"
echo ""
echo "Press Ctrl+C to stop the backend server"

# 等待用户中断
trap "echo '🛑 Stopping backend server...'; kill $BACKEND_PID; exit" INT
wait $BACKEND_PID

