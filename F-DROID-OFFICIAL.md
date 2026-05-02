# 📱 Submitting to Official F-Droid Repository

## Overview

To appear on `https://search.f-droid.org/?q=miles`, you need to submit your app to the **official F-Droid repository** (not just a custom repo).

## 📋 Submission Process

### Step 1: Create a GitLab Account
F-Droid uses GitLab for submissions: https://gitlab.com

### Step 2: Fork F-Droid Data Repository
1. Go to: https://gitlab.com/fdroid/fdroiddata
2. Click **Fork** → Create your own fork

### Step 3: Add Your App Metadata
1. In your fork, go to `metadata/` folder
2. Create new file: `com.mujeorg.milesclient.yml`
3. Copy contents from `/home/o/Documents/js/miles-client/metadata/com.mujeorg.milesclient.yml`
4. Commit the file

### Step 4: Create Merge Request (MR)
1. In your fork, click **Merge Requests** → **New Merge Request**
2. Source: your fork's `master` branch
3. Target: `fdroiddata:master`
4. Title: `Add Miles Client (com.mujeorg.milesclient)`
5. Description template:
   ```markdown
   ### New App Submission: Miles Client

   **Package Name:** com.mujeorg.milesclient
   **Category:** Navigation
   **License:** MIT

   **Description:**
   Miles Client is a mobile companion app for the Miles CRM system,
   providing real-time location tracking for field agents.

   **Features:**
   - Real-time GPS tracking with background location
   - Push notifications for lead assignments
   - Secure JWT authentication
   - Works with Netlify-hosted backend

   **Checklist:**
   - [x] I have read the F-Droid Inclusion Policy
   - [x] The app is not already in F-Droid
   - [x] I am the original author or have permission
   - [x] The app has a Free/Libre license (MIT)
   - [x] Metadata file is properly formatted
   ```

### Step 5: Wait for Review
- F-Droid maintainers will review your MR
- They may request changes
- Build will be tested automatically
- Once approved, app appears in official repo!

## 🔧 Required Changes to Your Repo

### 1. Add Fastlane Structure (for screenshots/description)
```
fastlane/
└── metadata/
    └── android/
        └── en-US/
            ├── full_description.txt
            ├── short_description.txt
            ├── title.txt
            ├── images/
            │   ├── icon.png
            │   └── phoneScreenshots/
            │       ├── screenshot1.png
            │       └── screenshot2.png
```

### 2. Tag Your Release
```bash
git tag -a v1.0.0 -m "Version 1.0.0 for F-Droid"
git push origin v1.0.0
```

### 3. Ensure Reproducible Build
F-Droid builds from source. Make sure:
- `android/` folder is in repo (after `expo prebuild`)
- All dependencies are in `package-lock.json`
- No proprietary dependencies (or mark with `AntiFeatures: NonFreeDep`)

## 📄 Metadata File Location

Your metadata file is ready at:
```
/home/o/Documents/js/miles-client/metadata/com.mujeorg.milesclient.yml
```

## ⏱️ Timeline

| Stage | Duration |
|-------|----------|
| Initial Review | 1-2 weeks |
| Build Testing | 1-2 weeks |
| Final Approval | 1 week |
| **Total** | **4-6 weeks** |

## 🌐 Once Published

Your app will be available at:
- Search: https://search.f-droid.org/?q=miles
- App Page: https://f-droid.org/packages/com.mujeorg.milesclient/

## 🆘 Need Help?

- F-Droid Docs: https://f-droid.org/docs/
- Inclusion Policy: https://f-droid.org/docs/Inclusion_Policy/
- Build Metadata Reference: https://f-droid.org/docs/Build_Metadata_Reference/
- Matrix Chat: #fdroid:matrix.org

## ⚡ Alternative: Custom Repo (Already Done!)

Your custom F-Droid repo is already live:
```
https://mujehoxe.github.io/miles-client/fdroid
```

Users can add this directly to F-Droid app. But for **search.f-droid.org**, you need the official submission above.
