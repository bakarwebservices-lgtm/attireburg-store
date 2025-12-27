#!/bin/bash

# Attireburg Demo Deployment Script

echo "🚀 Deploying Attireburg Demo Store..."

# Check if we have the required tools
if ! command -v git &> /dev/null; then
    echo "❌ Git is required but not installed."
    exit 1
fi

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Attireburg e-commerce store"
fi

# Check if we have a remote
if ! git remote get-url origin &> /dev/null; then
    echo "⚠️  No Git remote found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/attireburg-store.git"
    echo "   git push -u origin main"
    echo ""
    echo "Then run this script again or deploy manually to Vercel."
    exit 1
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Ready for deployment - $(date)"
git push origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "🌐 Next steps:"
echo "1. Go to https://vercel.com"
echo "2. Sign up/login with GitHub"
echo "3. Click 'New Project'"
echo "4. Import your repository"
echo "5. Add these environment variables:"
echo "   - NODE_ENV=production"
echo "   - JWT_SECRET=your-secure-secret-32-chars-min"
echo "   - DATABASE_URL=your-postgresql-connection-string"
echo "   - NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app"
echo "6. Deploy!"
echo ""
echo "🗄️  For database, use Supabase (free): https://supabase.com"
echo "📧 Demo mode will work without payment credentials"
echo ""
echo "🎉 Your Attireburg store will be live in minutes!"