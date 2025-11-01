#!/bin/bash

# Deployment script for Gas Station Management System
# Run this to push to GitHub and deploy via Vercel

echo "🚀 Gas Station Management System - GitHub Deployment"
echo "=================================================="
echo ""

# Check if git remote exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ Git remote already configured"
else
    echo "📝 Please enter your GitHub repository URL"
    echo "   Format: https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git"
    read -p "GitHub URL: " GITHUB_URL
    
    git remote add origin "$GITHUB_URL"
    echo "✅ Git remote added"
fi

echo ""
echo "📤 Pushing code to GitHub..."
git push -u origin main --force

echo ""
echo "✅ Code pushed successfully!"
echo ""
echo "🎯 Next steps in Vercel Dashboard:"
echo "   1. Go to https://vercel.com/dashboard"
echo "   2. Open your 'reports_app' project"
echo "   3. Go to Settings → Git"
echo "   4. Click 'Connect Git Repository'"
echo "   5. Select your repository"
echo "   6. Vercel will auto-deploy!"
echo ""
echo "🔗 Or just click 'Deploy' and it will use this code automatically"

