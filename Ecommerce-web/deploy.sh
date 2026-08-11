#!/bin/bash
# ============================================================
# SAAMPARK GROUP — HOSTINGER VPS AUTOMATED DEPLOYMENT SCRIPT
# Target Domain: saampark.com
# ============================================================

set -e # Exit immediately on error

echo "🚀 Starting deployment for Saampark Group (saampark.com)..."

# 1. Fetch latest changes from GitHub repository
echo "📥 Pulling latest updates from Git..."
git pull origin main || git pull origin master

# 2. Install production dependencies
echo "📦 Installing npm dependencies..."
npm install

# 3. Build Next.js production bundle
echo "🏗️ Building Next.js production app..."
npm run build

# 4. Restart app using PM2 process manager
echo "🔄 Reloading PM2 server process..."
if pm2 list | grep -q "saampark-web"; then
  pm2 restart saampark-web
else
  pm2 start npm --name "saampark-web" -- start
  pm2 save
fi

echo "✅ Deployment successful! Live at https://saampark.com"
