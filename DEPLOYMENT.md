# Deploy to GitHub Pages

## Your Repository
https://github.com/2nist/AlGoreRyhthm-Bomb

## Quick Deployment Steps

### 1. Prepare Files
Rename `index (1).html` to `index.html` (required for GitHub Pages)

### 2. Upload to GitHub
```bash
cd "C:\Users\CraftAuto-Sales\Algoresryhthmbomb"
git init
git add .
git commit -m "Initial commit - Al Gore's Rhythm Bomb"
git branch -M main
git remote add origin https://github.com/2nist/AlGoreRyhthm-Bomb.git
git push -u origin main
```

### 3. Enable GitHub Pages
1. Go to https://github.com/2nist/AlGoreRyhthm-Bomb/settings/pages
2. Under "Source", select **main** branch
3. Select **/ (root)** folder
4. Click **Save**
5. Wait 1-2 minutes for deployment

### 4. Your Live URL
After deployment completes:
**https://2nist.github.io/AlGoreRyhthm-Bomb/**

## Files to Upload
- ✅ index.html (renamed from "index (1).html")
- ✅ script.js
- ✅ AGRB.png
- ✅ README.md (optional but recommended)

## Alternative: Manual Upload
If you don't want to use Git commands:
1. Go to https://github.com/2nist/AlGoreRyhthm-Bomb
2. Click "Add file" → "Upload files"
3. Drag and drop all files
4. Click "Commit changes"
5. Enable GitHub Pages in settings

## Testing Locally First
```bash
cd "C:\Users\CraftAuto-Sales\Algoresryhthmbomb"
python -m http.server 8000
```
Then visit: http://localhost:8000/index.html

## After Deployment
Share your link: **https://2nist.github.io/AlGoreRyhthm-Bomb/**

Anyone can use it - no installation required!
