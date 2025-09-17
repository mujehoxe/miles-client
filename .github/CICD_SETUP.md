# CI/CD Setup Guide

## Overview
This project uses **EAS Build + GitHub Actions** for automated builds and deployments.

## What's Included

### 🔧 Build Profiles (eas.json)
- **development**: Development builds with dev client
- **staging**: Internal testing builds for develop branch
- **preview**: Internal preview builds for main branch  
- **production**: Production builds for tagged releases

### 🚀 GitHub Actions Workflows

#### 1. EAS Build (.github/workflows/build.yml)
Triggers on:
- Push to `main` → Preview build
- Push to `develop` → Staging build  
- Push to feature branches → Development build
- Git tags `v*` → Production build

**iOS Build Strategy** (to conserve free tier):
- Only builds for `production` and `preview` profiles
- Skips iOS builds for staging/development

#### 2. EAS Update (.github/workflows/update.yml) 
- Publishes OTA updates for JS-only changes
- Faster than full builds
- Unlimited and free

## Required Setup

### 1. Get Your Expo Access Token
```bash
# Install EAS CLI if you haven't already
npm install -g eas-cli

# Login to your Expo account
eas login

# Generate an access token
eas user:whoami
```

Go to [Expo Access Tokens](https://expo.dev/accounts/[account]/settings/access-tokens) and create a new token.

### 2. Add GitHub Secret
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `EXPO_TOKEN`
5. Value: Your Expo access token

### 3. Verify EAS Project Setup
Make sure you're logged into EAS CLI:
```bash
eas whoami
eas project:info
```

## Usage

### Automatic Builds
- **Push to main** → Triggers preview build + OTA update
- **Push to develop** → Triggers staging build + OTA update
- **Create release tag** → Triggers production build
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```

### Manual Builds
```bash
# Development build
eas build --profile development --platform all

# Staging build  
eas build --profile staging --platform all

# Production build
eas build --profile production --platform all
```

### Manual OTA Updates
```bash
# Update main channel
eas update --channel main --message "Bug fixes"

# Update staging channel
eas update --channel staging --message "New features"
```

## Build Limits
- **Android**: Unlimited builds (free)
- **iOS**: 30 builds/month (free tier)
- **OTA Updates**: Unlimited and free

## Monitoring
- Build status: https://expo.dev/accounts/muje-org/projects/miles-client/builds
- Update deployments: https://expo.dev/accounts/muje-org/projects/miles-client/updates

## Store Submission
The workflow includes optional auto-submission to app stores for production builds. Uncomment the submission step in `build.yml` when ready.

## Troubleshooting
- Ensure `EXPO_TOKEN` secret is set correctly
- Verify your Expo account has access to the project
- Check build logs in GitHub Actions for specific errors
- Confirm EAS CLI version is up to date locally