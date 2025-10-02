#!/bin/bash

# Setup script for F-Droid repository
# This script helps you set up the F-Droid publishing pipeline

set -e

echo "🚀 Setting up F-Droid publishing for Miles Client..."
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if we're in a git repository
if [[ ! -d ".git" ]]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

echo "📋 Pre-setup checklist:"
echo "✅ EAS CLI installed and configured"
echo "✅ EXPO_TOKEN secret added to GitHub"
echo "✅ Repository pushed to GitHub"
echo ""

# Enable GitHub Pages
echo "🔧 Next steps to complete F-Droid setup:"
echo ""
echo "1. 📡 Enable GitHub Pages:"
echo "   - Go to: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]//' | sed 's/.git$//')/settings/pages"
echo "   - Source: 'Deploy from a branch'"
echo "   - Branch: 'gh-pages' (will be created automatically)"
echo "   - Click 'Save'"
echo ""

echo "2. 🔑 Optional - Add F-Droid signing secrets (for custom keys):"
echo "   - Go to: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]//' | sed 's/.git$//')/settings/secrets/actions"
echo "   - Add FDROID_KEYSTORE_PASS (password for F-Droid keystore)"
echo "   - Add FDROID_KEY_PASS (password for F-Droid signing key)"
echo "   - If not added, default passwords will be used"
echo ""

echo "3. 🏷️  Create your first release:"
echo "   git tag v1.0.0"
echo "   git push origin v1.0.0"
echo ""

echo "4. 📱 Your F-Droid repository will be available at:"
echo "   https://$(git remote get-url origin | sed 's/.*github.com[:/]//' | sed 's/.git$//' | cut -d'/' -f1).github.io/$(git remote get-url origin | sed 's/.*github.com[:/]//' | sed 's/.git$//' | cut -d'/' -f2)/fdroid"
echo ""

echo "🎯 What happens when you create a release tag:"
echo "✅ EAS builds production APK"
echo "✅ F-Droid repository is updated"
echo "✅ GitHub Pages is deployed"
echo "✅ GitHub release with APK is created"
echo ""

echo "📖 For detailed instructions, see FDROID.md"
echo ""

# Check if workflows are committed
if [[ -f ".github/workflows/fdroid-publish.yml" ]] && [[ -f ".github/workflows/gh-pages.yml" ]]; then
    echo "✅ F-Droid workflows are ready!"
else
    echo "⚠️  F-Droid workflows may not be committed yet"
fi

# Check if metadata exists
if [[ -f "fdroid/metadata/com.mujeorg.milesclient.yml" ]]; then
    echo "✅ F-Droid metadata is ready!"
else
    echo "⚠️  F-Droid metadata may not be created yet"
fi

echo ""
echo "🎉 F-Droid setup complete! Create a release tag to publish your first version."