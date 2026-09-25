# ⚽ FPL Intelligence & Strategy Suite

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![FPL Season](https://img.shields.io/badge/FPL-Live_Season_2026%2F27-green.svg)](https://fantasy.premierleague.com/)
[![GitHub Actions](https://img.shields.io/badge/Data_Refresh-Automated_Cron-purple.svg)](.github/workflows/update_fpl.yml)
[![GitHub Pages](https://img.shields.io/badge/Deployment-GitHub_Pages_Ready-success.svg)](https://pages.github.com/)
[![Stack](https://img.shields.io/badge/Stack-HTML5_|_CSS3_|_JavaScript_|_PHP-orange.svg)](#technology-stack)

> **Advanced Fantasy Premier League Decision Support & Analytics Engine**  
> Real-time data integration, algorithmic captaincy picks, OCR screenshot squad scanning, Fixture Difficulty (FDR) ticker, and smart transfer recommendations.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Mathematical Formulas & Algorithms](#-mathematical-formulas--algorithms)
- [Quickstart & Local Setup](#-quickstart--local-setup)
- [GitHub Pages Deployment](#-github-pages-deployment)
- [Automated Cloud Data Refresh (GitHub Actions)](#-automated-cloud-data-refresh-github-actions)
- [Screenshot OCR Team Scanner](#-screenshot-ocr-team-scanner)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Contributing & License](#-contributing--license)

---

## 🌟 Overview

The **FPL Intelligence & Strategy Suite** is a modern decision-support platform designed to give Fantasy Premier League managers a data-backed edge. Built from the ground up with high visual appeal, responsive dark-mode aesthetics, and real-time analytical models, it transforms raw statistics into actionable gameweek decisions.

### Why It Stands Out:
- **Dual-Mode Operation**: Runs natively in dynamic **PHP environments** (with automated server-side caching) or as a zero-dependency **Static Web App on GitHub Pages**.
- **No Third-Party Backend Required**: Features automated daily data synchronisation directly through **GitHub Actions**.
- **Computer Vision Integration**: Scan your squad straight from mobile or web screenshots via client-side OCR (Tesseract.js).

---

## 🚀 Key Features

### 1. ⚡ Command Center (Live Dashboard)
- **Algorithmic Captaincy Matrix**: Evaluates candidates through weighted multi-factor scoring (form, fixture ease, expected goal involvement per 90, and home advantage).
- **High-Upside Differentials**: Highlights under-the-radar assets owned by `< 10%` of managers with high form and upcoming fixture swings.
- **Market Movers & Price Trends**: Live tracking of top transferred-in and transferred-out players to beat price rises and falls.
- **Deadline Countdown**: Real-time countdown timer tracking upcoming gameweek lockouts.

### 2. 🏟️ Interactive Pitch & Squad Planner
- **Virtual Pitch View**: Standard 15-player squad board (11 starters and 4 bench players) with automatic formation detection (3-5-2, 3-4-3, 4-4-2, 4-3-3, 5-3-2, etc.).
- **Budget & Team Validation**: Live bank balance calculation against the £100.0m budget cap, enforcing the 3-players-per-club rule.
- **Auto-Pick Best Squad**: Optimization algorithm that selects the optimal 15-man squad maximizing the Smart Buy Score within budget constraints.
- **Role Assignment**: Dynamic captaincy (`C`) and vice-captaincy (`V`) assignment with live point multipliers.

### 3. 📸 Client-Side OCR Squad Scanner
- Paste an image from your clipboard (`Ctrl+V`) or drag & drop a screenshot of your FPL team.
- Powered by `Tesseract.js` running in-browser with automated fuzzy matching against the official 600+ Premier League player roster.
- Instantly reconstructs your starting lineup and bench on the virtual pitch.

### 4. 🔍 Player Scout & Analytics Table
- Real-time search and filtering by **Position** (GKP, DEF, MID, FWD), **Club**, **Max Price**, and **Availability Status** (injuries, doubts, suspensions).
- Interactive sorting across **Smart Buy Score**, **Form**, **ICT Index**, **xGI/90**, **Selected %**, and **Price**.
- Detailed **Player Dossier Modal** showcasing seasonal statistics, radar metrics, and next 5 fixtures with individual FDR difficulty tags.

### 5. 📊 Strategy Engine & FDR Fixture Ticker
- **5-Gameweek Fixture Difficulty Rating (FDR)**: Color-coded heatmap (1 = Green/Easy to 5 = Dark Red/Hard) for all 20 Premier League clubs.
- **Fixture Swing Radar**: Identifies clubs with the easiest upcoming runs to buy from and tough fixture schedules to sell.
- **Algorithmic Transfer Optimizer**: Suggests direct replacement transfers tailored to improve your squad's total fixture ease and form.

### 6. 🔄 Direct Manager Squad Sync
- Enter your official **FPL Team ID** to instantly pull your active gameweek team, overall rank, total points, and manager details.

---

## 🧠 Mathematical Formulas & Algorithms

### Smart Buy Score (SBS)
The proprietary **Smart Buy Score** synthesizes form, expected metrics, fixture difficulty, and value efficiency:

$$\text{Smart Buy Score} = (\text{Form} \times 3.5) + (\text{FDR Bonus} \times 3.0) + (\text{xGI}_{90} \times 25.0) + (\text{Value Form} \times 1.5)$$

Where:
- $\text{FDR Bonus} = \max(0, (3 - \text{Avg FDR}_3) \times 2)$
- $\text{xGI}_{90} = \frac{\text{xG} + \text{xA}}{\text{Minutes}} \times 90$

### Algorithmic Captaincy Score
$$\text{Captaincy Score} = (\text{Form} \times 3.5) + (\text{FDR Bonus} \times 3.0) + (\text{xGI}_{90} \times 25.0) + (\text{Home Advantage} \times 10.0)$$

---

## 🛠️ System Architecture

```
                       ┌────────────────────────────────────────┐
                       │   Official Fantasy Premier League API  │
                       │   (bootstrap-static & fixtures)        │
                       └───────────────────┬────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
        [ Local / Server Mode ]                      [ Static / GitHub Pages Mode ]
  ┌─────────────────────────────────┐             ┌──────────────────────────────────┐
  │         api/get_data.php        │             │   .github/workflows/update_fpl   │
  │  - cURL request with fallback   │             │   - Runs every 6h via cron       │
  │  - 10-minute local disk cache   │             │   - Compiles data/fpl_data.json  │
  └────────────────┬────────────────┘             └────────────────┬─────────────────┘
                   │                                               │
                   └──────────────────────┬────────────────────────┘
                                          ▼
                       ┌─────────────────────────────────────┐
                       │          assets/js/app.js           │
                       │  - Detects runtime environment      │
                       │  - Loads API or fallback JSON       │
                       │  - Initializes state & components   │
                       └──────────────────┬──────────────────┘
                                          │
        ┌──────────────────┬──────────────┴─────┬──────────────────┐
        ▼                  ▼                    ▼                  ▼
┌──────────────┐   ┌──────────────┐     ┌──────────────┐   ┌──────────────┐
│  scout.js    │   │  pitch.js    │     │ strategy.js  │   │ocr_advisor.js│
│ Player Scout │   │ Pitch Board  │     │ FDR & Moves  │   │ Tesseract OCR│
└──────────────┘   └──────────────┘     └──────────────┘   └──────────────┘
```

---

## 💻 Quickstart & Local Setup

### Option 1: Running with XAMPP (Recommended)
1. Clone or copy this repository into your XAMPP web root:
   ```powershell
   git clone https://github.com/<YOUR-USERNAME>/fpl.git C:\xampp\htdocs\fpl
   ```
2. Start the **Apache** service in the XAMPP Control Panel.
3. Open your browser and navigate to:
   ```
   http://localhost/fpl/
   ```
   *(The app will automatically invoke `api/get_data.php` and cache responses in `cache/`)*.

### Option 2: Running with Built-in PHP Server
```bash
cd c:\xampp\htdocs\fpl
php -S localhost:8000
```
Then visit `http://localhost:8000/index.php`.

### Option 3: Running Purely Statically (No PHP)
You can test the static build directly using any static file server:
```bash
# Using Python
python -m http.server 8080

# Using Node.js npx
npx serve .
```
Visit `http://localhost:8080/index.html`.

---

## 🌐 GitHub Pages Deployment

The repository is pre-configured for instant zero-configuration deployment to **GitHub Pages**:

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: Initial commit for FPL Intelligence Suite"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git push -u origin main
   ```

2. **Configure Pages in GitHub**:
   - Go to your repo on GitHub: `https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>`
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, choose **GitHub Actions** (or select **Deploy from a branch** -> `main` / `/ (root)`).
   - Your site will be published at:  
     `https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`

3. **Embedding in a Portfolio**:
   You can easily embed this web application in your portfolio page:
   ```html
   <iframe 
     src="https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/" 
     width="100%" 
     height="850px" 
     style="border: none; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" 
     title="FPL Intelligence Suite">
   </iframe>
   ```

For detailed troubleshooting, refer to [`GITHUB_PAGES_GUIDE.md`](GITHUB_PAGES_GUIDE.md).

---

## ⏰ Automated Cloud Data Refresh (GitHub Actions)

This project includes a fully automated GitHub Actions workflow in [`.github/workflows/update_fpl.yml`](.github/workflows/update_fpl.yml):

- **Cron Schedule**: Automatically triggers every 6 hours (`0 */6 * * *`) to fetch updated player stats, price adjustments, injuries, and fixture changes from the Premier League servers.
- **Node.js & PHP Engine**: Executes static bundle compilation and exports the synchronized dataset into `data/fpl_data.json`.
- **Auto-Commit**: If new data is detected, the bot commits and updates your repository without requiring manual intervention.
- **Manual Trigger**: You can run an on-demand update at any time via **GitHub Repo > Actions > "Update FPL Data & Deploy GitHub Pages" > "Run workflow"**.

---

## 📷 Screenshot OCR Team Scanner

The OCR Squad Scanner allows managers to import their squads without manual typing:
1. Open the official Fantasy Premier League app or website.
2. Take a screenshot of your pitch view or pick-team screen.
3. Open the **Pitch & Squad** tab in the app and click **Scan Screenshot**.
4. Paste the image directly with `Ctrl + V` or select the image file.
5. The client-side OCR engine parses text, reconciles player surnames against the active database using Levenshtein distance matching, and populates the squad.

---

## 📁 Project Structure

```
├── .github/
│   └── workflows/
│       └── update_fpl.yml        # Cloud automated data synchronizer & Pages deployment
├── api/
│   └── get_data.php              # Dynamic PHP proxy with local caching & live FPL API hooks
├── assets/
│   ├── css/
│   │   └── style.css             # Custom responsive dark-mode styling & pitch layout
│   └── js/
│       ├── app.js                # Main application orchestrator & state manager
│       ├── pitch.js              # Pitch visualizer, drag/swap logic, formation engine
│       ├── scout.js              # Player table filters, search, sorting, modal detail
│       ├── strategy.js           # 5-GW FDR fixture ticker & transfer recommender
│       └── ocr_advisor.js        # Tesseract.js screenshot parsing & player matching
├── cache/                        # Cached server-side FPL payloads (local PHP mode)
├── data/
│   └── fpl_data.json             # Static pre-compiled dataset for GitHub Pages & offline mode
├── export_static.php             # CLI script to generate data/fpl_data.json from CLI
├── index.html                    # Static entry point (used for GitHub Pages)
├── index.php                     # Dynamic entry point (used for XAMPP / PHP servers)
├── GITHUB_PAGES_GUIDE.md         # Deployment and portfolio embedding handbook
├── LICENSE                       # Apache License 2.0
├── vercel.json                   # Vercel deployment routing configuration
└── README.md                     # Project documentation
```

---

## 🧰 Technology Stack

- **Frontend Core**: Vanilla HTML5, Modern ECMAScript (ES6+), Vanilla CSS3.
- **Styling Framework**: Bootstrap 5.3 & Bootstrap Icons, Google Fonts (*Outfit* and *Inter*).
- **Computer Vision**: [Tesseract.js](https://tesseract.projectnaptha.com/) for in-browser OCR image recognition.
- **Backend / API**: PHP 8.x with cURL extension and local filesystem caching.
- **DevOps / CI-CD**: GitHub Actions (Ubuntu runner, Node.js fallback parser), GitHub Pages.
- **Data Source**: Official Fantasy Premier League REST endpoints.

---

## 📄 License & Attribution

Distributed under the **Apache License, Version 2.0**. See [`LICENSE`](LICENSE) for more details.

```
Copyright 2026 Clarence-14

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

*Data provided by the Fantasy Premier League (Premier League). This project is an independent analytics tool and is not officially affiliated with or endorsed by the Premier League.*
