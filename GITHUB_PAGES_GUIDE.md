# How to Deploy This FPL Web App to GitHub Pages (`github.io`)

This guide explains how to host this application on GitHub Pages as part of your personal portfolio (e.g., `https://<your-username>.github.io/fpl/` or embedded into your main portfolio site).

---

## 1. How It Works (PHP vs Static GitHub Pages)

- **GitHub Pages only hosts static files** (`.html`, `.css`, `.js`, `.json`, images). It does not have a PHP runtime.
- **Dual-Mode Compatibility**:
  - When running locally in XAMPP, the app calls `api/get_data.php` dynamically.
  - When deployed to GitHub Pages, the JavaScript (`assets/js/app.js`) **automatically detects that PHP is unavailable and seamlessly loads `data/fpl_data.json` and `index.html` instead**.
  - We also included a **GitHub Action** (`.github/workflows/update_fpl.yml`) that runs daily on GitHub's cloud servers to fetch fresh FPL data, regenerate `data/fpl_data.json`, and commit it back to your repo automatically!

---

## 2. Step-by-Step Deployment Instructions

### Step 1: Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g., `fpl` or `fpl-advisor`).
3. Set visibility to **Public**.
4. Leave "Add a README" unchecked, then click **Create repository**.

---

### Step 2: Push Your Local Project to GitHub
Open PowerShell or your terminal in `c:\xampp\htdocs\fpl\` and run:

```powershell
cd c:\xampp\htdocs\fpl

# 1. Initialize git (if not already initialized)
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit: FPL Intelligence Suite"

# 4. Set main branch
git branch -M main

# 5. Connect to your GitHub repository (replace with your actual GitHub repo URL)
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git

# 6. Push
git push -u origin main
```

---

### Step 3: Enable GitHub Pages in Repository Settings
1. Go to your repository on GitHub: `https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>`.
2. Click on **Settings** (tab at the top right).
3. On the left sidebar, click **Pages** (under the "Code and automation" section).
4. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Select `main` and folder `/ (root)`.
   - Click **Save**.
5. Wait 1–2 minutes. GitHub will display:
   > *"Your site is live at `https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`"*

---

### Step 4: Add to Your Existing Portfolio Website

You have two easy ways to integrate it into your portfolio:

#### Option A: Direct Showcase Link / Card
Add a project card or button on your portfolio page:
```html
<a href="https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/" target="_blank" class="btn btn-primary">
  Launch FPL Intelligence Suite ⚽
</a>
```

#### Option B: Embed Directly via an `<iframe>`
To display the web app inside your portfolio page without leaving the site:
```html
<div class="portfolio-item-container" style="border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
  <iframe 
    src="https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/" 
    width="100%" 
    height="850px" 
    style="border: none;" 
    title="FPL Intelligence Suite">
  </iframe>
</div>
```

---

### Step 5: Keeping Data Fresh Automatically
Because we added `.github/workflows/update_fpl.yml`:
1. GitHub Actions will run **every day at 06:00 UTC** to update `data/fpl_data.json` with the latest FPL scores, prices, fixtures, and injuries.
2. You can also trigger an instant refresh anytime by going to:
   **GitHub Repo -> Actions tab -> "Update FPL Live Data" -> "Run workflow"**.
3. If you want to update it locally before pushing:
   Simply run:
   ```powershell
   & "C:\xampp\php\php.exe" export_static.php
   git add data/fpl_data.json index.html
   git commit -m "Update FPL data"
   git push
   ```
