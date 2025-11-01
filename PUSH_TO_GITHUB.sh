#!/bin/bash

echo "🚀 Pushing Gas Station Management System to GitHub..."
echo "=================================================="
echo ""

cd /Users/albara/Documents/ReportsAPP

# Configure git to use credential helper
git config credential.helper osxkeychain

echo "📤 Pushing to https://github.com/Albara6/lamar2.git"
echo ""
echo "⚠️  You will be prompted for your GitHub username and password/token"
echo "    (Use a Personal Access Token instead of password for better security)"
echo ""

git push -u origin main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub!"
    echo ""
    echo "🎯 Vercel will now automatically deploy your app!"
    echo "   Check: https://vercel.com/dashboard"
    echo ""
    echo "🌐 Your app will be live at: https://lamar2-chi.vercel.app"
    echo ""
    echo "📱 Access points:"
    echo "   • Safe Panel: https://lamar2-chi.vercel.app/safe-panel"
    echo "   • Admin Dashboard: https://lamar2-chi.vercel.app/admin"
    echo "   • Default PIN: 1234 (CHANGE THIS IMMEDIATELY!)"
else
    echo ""
    echo "❌ Push failed. Please check your GitHub credentials."
    echo ""
    echo "💡 Tips:"
    echo "   1. Use a Personal Access Token instead of password"
    echo "   2. Create one at: https://github.com/settings/tokens"
    echo "   3. Use 'repo' scope when creating the token"
fi

