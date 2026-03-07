#!/bin/bash
# Test script for vite-browser

set -e

echo "🚀 Starting vite-browser test..."
echo ""

# Start demo app in background
echo "📦 Starting demo Vue app..."
cd /e/Projects/github/vite-browser/demo
pnpm dev > /tmp/vite-demo.log 2>&1 &
DEMO_PID=$!
echo "Demo app PID: $DEMO_PID"

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Demo app is running at http://localhost:5173"
else
    echo "❌ Demo app failed to start"
    kill $DEMO_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🧪 Testing vite-browser commands..."
echo ""

cd /e/Projects/github/vite-browser/vite-browser

# Test 1: Open browser
echo "1️⃣ Opening browser..."
node dist/cli.js open http://localhost:5173
sleep 2

# Test 2: Detect framework
echo ""
echo "2️⃣ Detecting framework..."
node dist/cli.js detect

# Test 3: Vue component tree
echo ""
echo "3️⃣ Getting Vue component tree..."
node dist/cli.js vue tree

# Test 4: Vue Pinia stores
echo ""
echo "4️⃣ Getting Pinia stores..."
node dist/cli.js vue pinia

# Test 5: Vue Router
echo ""
echo "5️⃣ Getting Vue Router info..."
node dist/cli.js vue router

# Test 6: Screenshot
echo ""
echo "6️⃣ Taking screenshot..."
node dist/cli.js screenshot

# Test 7: Network requests
echo ""
echo "7️⃣ Getting network requests..."
node dist/cli.js network

# Test 8: Logs
echo ""
echo "8️⃣ Getting console logs..."
node dist/cli.js logs

# Test 9: Close browser
echo ""
echo "9️⃣ Closing browser..."
node dist/cli.js close

echo ""
echo "✅ All tests completed!"
echo ""

# Cleanup
echo "🧹 Cleaning up..."
kill $DEMO_PID 2>/dev/null || true
echo "Done!"
