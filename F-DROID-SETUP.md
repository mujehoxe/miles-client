# 📱 F-Droid Setup Summary

## ✅ Current Status

The mobile app (`miles-client`) is configured for F-Droid hosting with automatic builds linked to your Netlify deployment.

## 🔗 Backend URL Updated

All configuration files have been updated to use your Netlify deployment:

```
https://earnest-jelly-104eb3.netlify.app
```

### Files Updated:
- ✅ `.env` - Local development environment
- ✅ `eas.json` - All build profiles (development, staging, preview, production)
- ✅ `.github/workflows/local-build.yml` - CI/CD build environment

## 🚀 Build Options

### Option 1: EAS Cloud Build (Recommended - Free Tier)
Uses Expo's cloud build service. **Android builds are unlimited and free.**

**Trigger builds:**
```bash
# Development build
eas build --profile development --platform android

# Production build (for F-Droid release)
eas build --profile production --platform android
```

**Required Setup:**
1. Get your Expo token:
   ```bash
   npm install -g eas-cli
   eas login
   eas access-token:create
   ```
2. Add `EXPO_TOKEN` secret to your GitHub repository (Settings → Secrets → Actions)

### Option 2: Local Build (No Expo Server Dependency)
Builds entirely on GitHub Actions without using Expo's cloud service.

**Trigger via GitHub:**
- Push to `main` branch → Preview build
- Push to `develop` branch → Staging build
- Push tag `v*` → Production build

**Or run manually:**
```bash
cd /home/o/Documents/js/miles-client
npm ci
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

### Option 3: F-Droid Auto-Publish (Tag-Based)
Automatically publishes to F-Droid repository when you create a release tag.

**Create a release:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers:
1. ✅ Production APK build via EAS
2. ✅ F-Droid repository metadata generation
3. ✅ GitHub Pages deployment
4. ✅ GitHub Release with APK attached

## 📦 F-Droid Repository

The F-Droid repository will be hosted at:
```
https://mujehoxe.github.io/miles-client/fdroid
```

### For Users to Install:
1. Install F-Droid app from https://f-droid.org/
2. Add repository: `https://mujehoxe.github.io/miles-client/fdroid`
3. Search for "Miles Client" and install

## 🔐 Required GitHub Secrets

Add these secrets to your GitHub repository for full automation:

| Secret | Required For | How to Get |
|--------|--------------|------------|
| `EXPO_TOKEN` | EAS cloud builds | Run `eas access-token:create` |
| `ANDROID_KEYSTORE_BASE64` | Signed production builds | Base64 of your keystore file |
| `ANDROID_KEY_ALIAS` | Signed production builds | Your keystore alias |
| `ANDROID_STORE_PASSWORD` | Signed production builds | Your keystore password |
| `ANDROID_KEY_PASSWORD` | Signed production builds | Your key password |
| `FDROID_KEYSTORE_PASS` | F-Droid signing | Generate new or use existing |
| `FDROID_KEY_PASS` | F-Droid signing | Generate new or use existing |

## 📱 App Configuration

**Package Name:** `com.mujeorg.milesclient`

**Permissions:**
- Internet & Network access
- Background location tracking
- Notifications
- Storage

**Features:**
- 📍 Real-time location tracking
- 📢 Push notifications via OneSignal
- 🔐 Secure token storage
- 📊 Works with your Netlify CRM backend

## 🔄 Next Steps

1. **Commit the changes:**
   ```bash
   cd /home/o/Documents/js/miles-client
   git add .env eas.json .github/workflows/local-build.yml F-DROID-SETUP.md
   git commit -m "Update backend URL to Netlify deployment for F-Droid builds"
   git push
   ```

2. **Add GitHub Secrets** (if using EAS cloud builds or F-Droid publishing)

3. **Test a build:**
   - For local build: Push to `main` branch
   - For EAS build: Run `eas build --profile preview --platform android`

4. **Create a release tag** to trigger F-Droid publishing:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

## 🌐 Backend Connectivity

The mobile app will connect to:
```
API Base: https://earnest-jelly-104eb3.netlify.app
Location Endpoint: /api/location/
Leads Endpoint: /api/lead/
Auth Endpoint: /api/users/
```

## 📚 Documentation

- **F-Droid Guide:** See `FDROID.md` for detailed user installation instructions
- **CI/CD Setup:** See `.github/CICD_SETUP.md` for build configuration
- **Existing Builds:** Check `.github/workflows/` for all available workflows

---

**Your mobile app is ready for F-Droid distribution! 🎉**
