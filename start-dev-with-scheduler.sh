#!/bin/bash
# Bash script to start dev server with email scheduler
# This automatically runs both the Next.js dev server and email scheduler

echo "🚀 Starting development server with automatic email scheduler..."
echo ""

# Start dev server in background
npm run dev &
DEV_PID=$!

# Wait a bit for server to start
sleep 3

# Start email scheduler in background
npm run email:scheduler &
SCHEDULER_PID=$!

echo "✅ Development server and email scheduler started!"
echo "📧 Email scheduler will automatically check and send emails every minute"
echo "💡 Press Ctrl+C to stop both processes"
echo ""

# Wait for both processes
wait $DEV_PID $SCHEDULER_PID
