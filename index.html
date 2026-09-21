<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FPL Intelligence & Strategy Suite | Live Analytics & Picks</title>
  <meta name="description" content="Advanced Fantasy Premier League decision support system. Live FPL API data, FDR fixture ticker, Smart Buy Scores, Captaincy matrix, and transfer optimizer.">

  <!-- Google Fonts: Inter & Outfit -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet">

  <!-- Bootstrap 5 CSS & Bootstrap Icons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

  <!-- Custom Stylesheet -->
  <link rel="stylesheet" href="assets/css/style.css">

  <style>
    .font-brand { font-family: 'Outfit', sans-serif; }
    .spin-animation { animation: spin 1s infinite linear; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>

  <!-- Loading Overlay -->
  <div id="global-loading" style="display: none; position: fixed; inset: 0; background: rgba(10, 13, 20, 0.85); z-index: 9999; backdrop-filter: blur(8px); align-items: center; justify-content: center; flex-direction: column;">
    <div class="spinner-border text-success" role="status" style="width: 3.5rem; height: 3.5rem;">
      <span class="visually-hidden">Loading...</span>
    </div>
    <div class="mt-3 text-white fw-bold fs-5 font-brand">Synchronizing Live FPL Data...</div>
    <small class="text-muted">Computing Smart Scores, Fixture Ratings & Expected Metrics</small>
  </div>

  <!-- Toast Notification Container -->
  <div id="toast-container" class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1080;"></div>

  <!-- Top Navigation Bar with Mobile Hamburger Menu -->
  <nav class="navbar navbar-expand-lg fpl-navbar">
    <div class="container-fluid px-lg-4">
      <!-- Logo -->
      <a href="index.html" class="brand-logo font-brand navbar-brand">
        <i class="bi bi-shield-shaded text-success fs-3"></i>
        <span>FPL<span style="color: var(--pl-green);">INTELLIGENCE</span></span>
        <span class="brand-badge">LIVE 2026/27</span>
      </a>

      <!-- Hamburger Toggler for Mobile -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarFPLContent" aria-controls="navbarFPLContent" aria-expanded="false" aria-label="Toggle navigation">
        <i class="bi bi-list fs-2 text-success"></i>
      </button>

      <!-- Collapsible Navigation & Actions -->
      <div class="collapse navbar-collapse" id="navbarFPLContent">
        <!-- Navigation Tabs -->
        <ul class="nav nav-pills flex-column flex-lg-row mx-auto my-3 my-lg-0 gap-1 gap-lg-2" id="fpl-main-tabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active w-100" id="tab-dashboard" data-bs-toggle="pill" data-bs-target="#dashboard-tab-pane" type="button" role="tab">
              <i class="bi bi-speedometer2"></i> Command Center
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link w-100" id="tab-pitch" data-bs-toggle="pill" data-bs-target="#pitch-tab-pane" type="button" role="tab">
              <i class="bi bi-grid-1x2"></i> Pitch & Squad
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link w-100" id="tab-scout" data-bs-toggle="pill" data-bs-target="#scout-tab-pane" type="button" role="tab">
              <i class="bi bi-search"></i> Player Scout
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link w-100" id="tab-strategy" data-bs-toggle="pill" data-bs-target="#strategy-tab-pane" type="button" role="tab">
              <i class="bi bi-graph-up-arrow"></i> Strategy & FDR
            </button>
          </li>
        </ul>

        <!-- Action Controls & Import Manager -->
        <div class="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 mt-2 mt-lg-0">
          <form id="form-load-manager" class="d-flex align-items-center gap-1">
            <input type="number" id="input-team-id" class="form-control form-control-sm form-control-dark" placeholder="FPL Team ID" style="min-width: 120px;" title="Enter your official FPL Manager/Team ID">
            <button type="submit" class="btn btn-sm btn-fpl-outline text-nowrap" title="Import Squad">
              <i class="bi bi-cloud-arrow-down"></i> Load
            </button>
          </form>

          <button id="btn-refresh-data" class="btn btn-sm btn-fpl-green d-flex align-items-center justify-content-center gap-1 text-nowrap" title="Fetch fresh data">
            <i class="bi bi-arrow-repeat"></i> <span>Refresh Data</span>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Gameweek & Deadline Ticker Banner -->
  <section class="gw-ticker-banner">
    <div class="container-fluid px-lg-4">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div class="d-flex align-items-center gap-3">
          <span class="badge bg-purple" style="background: var(--pl-purple); border: 1px solid rgba(0,255,135,0.3);" id="current-gw-display">Gameweek 1</span>
          <span class="text-white fw-bold font-brand" id="next-gw-title">GW 2 Deadline</span>
          <div class="countdown-box">
            <i class="bi bi-stopwatch text-success"></i>
            <span id="gw-countdown">00d 00h 00m 00s</span>
          </div>
        </div>

        <div class="d-flex align-items-center gap-3 text-muted small">
          <span id="last-updated-stamp"><i class="bi bi-clock-history me-1"></i>Synchronizing...</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Manager Profile Banner (Shown when Team ID loaded) -->
  <section id="manager-profile-banner" class="container-fluid px-lg-4 mt-3" style="display: none;">
    <div class="fpl-card p-3 d-flex flex-wrap justify-content-between align-items-center gap-3" style="background: linear-gradient(90deg, rgba(56,0,60,0.4), rgba(18,24,38,0.9)); border-color: rgba(0,255,135,0.3);">
      <div class="d-flex align-items-center gap-3">
        <div class="bg-dark p-2 rounded-circle border border-success">
          <i class="bi bi-person-badge fs-3 text-success"></i>
        </div>
        <div>
          <h5 class="mb-0 fw-bold text-white font-brand" id="manager-team-name">My Squad</h5>
          <small class="text-muted" id="manager-owner-name">Manager</small>
        </div>
      </div>
      <div class="d-flex gap-4">
        <div class="text-center">
          <div class="small text-muted text-uppercase">Total Points</div>
          <div class="h5 fw-bold text-success mb-0" id="manager-overall-pts">-</div>
        </div>
        <div class="text-center">
          <div class="small text-muted text-uppercase">Overall Rank</div>
          <div class="h5 fw-bold text-white mb-0" id="manager-overall-rank">-</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Main Content Container -->
  <main class="container-fluid px-lg-4 mt-4">
    <div class="tab-content" id="fpl-tab-content">

      <!-- ====================================================================
           TAB 1: COMMAND CENTER (DASHBOARD)
           ==================================================================== -->
      <div class="tab-pane fade show active" id="dashboard-tab-pane" role="tabpanel">
        
        <!-- Captaincy Recommendations Matrix -->
        <div class="mb-4">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h4 class="fw-bold text-white font-brand mb-1">
                <i class="bi bi-c-circle-fill text-success me-2"></i>Algorithmic Captaincy Matrix
              </h4>
              <p class="text-muted small mb-0">Calculated using Weighted Form (35%), Fixture Ease (30%), xGI per 90 (25%), and Home Advantage (10%).</p>
            </div>
          </div>
          <div class="row" id="captain-recommendations-container">
            <!-- Rendered by app.js -->
            <div class="col-12 text-center py-4 text-muted"><div class="spinner-border text-success"></div></div>
          </div>
        </div>

        <div class="row g-4">
          <!-- Top Differentials (< 10% Ownership) -->
          <div class="col-lg-8">
            <div class="fpl-card h-100">
              <div class="fpl-card-header">
                <h5 class="fpl-card-title">
                  <i class="bi bi-lightning-charge"></i> High-Upside Differentials (&lt; 10% Owned)
                </h5>
                <span class="badge bg-dark border border-secondary text-muted">Low Ownership Gems</span>
              </div>
              <p class="text-muted small mb-3">Players with under 10% ownership boasting high form, strong expected data, and favorable upcoming fixture runs.</p>
              <div class="row" id="differentials-container">
                <!-- Rendered by app.js -->
              </div>
            </div>
          </div>

          <!-- Market Movers (Price Change Radar) -->
          <div class="col-lg-4">
            <div class="fpl-card h-100">
              <div class="fpl-card-header">
                <h5 class="fpl-card-title">
                  <i class="bi bi-activity"></i> Market Movers
                </h5>
                <span class="badge bg-dark border border-secondary text-muted">Price Trends</span>
              </div>
              
              <div class="mb-3">
                <h6 class="text-success small fw-bold text-uppercase"><i class="bi bi-graph-up-arrow me-1"></i> Top Transferred In</h6>
                <div id="transfers-in-container">
                  <!-- Rendered by app.js -->
                </div>
              </div>

              <div>
                <h6 class="text-danger small fw-bold text-uppercase"><i class="bi bi-graph-down-arrow me-1"></i> Top Transferred Out</h6>
                <div id="transfers-out-container">
                  <!-- Rendered by app.js -->
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ====================================================================
           TAB 2: PITCH & SQUAD PLANNER
           ==================================================================== -->
      <div class="tab-pane fade" id="pitch-tab-pane" role="tabpanel">
        <div class="row g-4">
          <!-- Pitch Visualization -->
          <div class="col-lg-8">
            <div class="fpl-card p-3">
              <div class="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
                <div class="d-flex align-items-center gap-3">
                  <h5 class="fpl-card-title mb-0">
                    <i class="bi bi-grid-3x3-gap-fill text-success"></i> Squad Pitch
                  </h5>
                  <span class="badge bg-dark border border-secondary text-white" id="squad-count-display">15/15 Players</span>
                </div>

                <div class="d-flex align-items-center gap-2">
                  <button class="btn btn-sm btn-fpl-green" data-bs-toggle="modal" data-bs-target="#screenshotModal" title="Upload or paste a screenshot of your team for OCR analysis">
                    <i class="bi bi-camera-fill me-1"></i> Scan Screenshot
                  </button>
                  <button id="btn-auto-pick" class="btn btn-sm btn-fpl-outline" title="Auto-picks highest Smart Buy Score players within budget">
                    <i class="bi bi-magic"></i> Auto-Pick Best
                  </button>
                  <button id="btn-clear-squad" class="btn btn-sm btn-fpl-outline text-danger border-danger" title="Clear entire squad">
                    <i class="bi bi-trash"></i> Clear
                  </button>
                </div>
              </div>

              <!-- Pitch Board -->
              <div class="pitch-container">
                <div class="pitch-center-circle"></div>
                <div class="pitch-penalty-top"></div>
                <div class="pitch-penalty-bottom"></div>

                <!-- Goalkeepers Row (1 Starter) -->
                <div class="pitch-row" id="pitch-gk-row"></div>

                <!-- Defenders Row (3 to 5 Starters) -->
                <div class="pitch-row" id="pitch-def-row"></div>

                <!-- Midfielders Row (2 to 5 Starters) -->
                <div class="pitch-row" id="pitch-mid-row"></div>

                <!-- Forwards Row (1 to 3 Starters) -->
                <div class="pitch-row" id="pitch-fwd-row"></div>

                <!-- Bench Dugout (4 Substitutes) -->
                <div class="bench-dugout">
                  <div class="bench-title d-flex justify-content-between">
                    <span><i class="bi bi-inboxes me-1"></i> Substitutes Bench</span>
                    <small class="text-muted">Click any player to swap</small>
                  </div>
                  <div class="d-flex justify-content-around flex-wrap gap-2" id="pitch-bench-container"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Squad Stats & Budget Sidebar -->
          <div class="col-lg-4">
            <!-- Budget & Constraints Card -->
            <div class="fpl-card mb-3">
              <h5 class="fpl-card-title mb-3">
                <i class="bi bi-wallet2 text-success"></i> Budget & Bank
              </h5>
              <div class="row g-2 text-center mb-3">
                <div class="col-6">
                  <div class="p-2 rounded bg-dark border border-secondary">
                    <div class="small text-muted">Squad Value</div>
                    <div class="h5 fw-bold text-white mb-0" id="squad-spent-display">£0.0m</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-2 rounded bg-dark border border-secondary">
                    <div class="small text-muted">In The Bank</div>
                    <div class="h5 fw-bold text-success mb-0" id="squad-bank-display">£100.0m</div>
                  </div>
                </div>
              </div>

              <div class="small text-muted mb-2">
                <i class="bi bi-info-circle me-1"></i> Rules: Max 3 players per Premier League club. Exactly 15 players (11 starters, 4 bench).
              </div>

              <button id="btn-optimize-transfers" class="btn btn-fpl-green w-100 mt-2">
                <i class="bi bi-arrow-left-right me-1"></i> Run Transfer Assistant
              </button>
            </div>

            <!-- Transfer Recommendations Container on Pitch tab -->
            <div class="fpl-card">
              <h5 class="fpl-card-title mb-2">
                <i class="bi bi-lightbulb text-warning"></i> Transfer Insights
              </h5>
              <p class="text-muted small mb-3">Identifies poor fixtures or low form in your squad and recommends upgrades that fit your bank.</p>
              <div id="transfer-suggestions-container">
                <div class="text-muted small text-center py-3">
                  Click <strong>Run Transfer Assistant</strong> above to analyze your squad.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ====================================================================
           TAB 3: PLAYER SCOUT & RESEARCH
           ==================================================================== -->
      <div class="tab-pane fade" id="scout-tab-pane" role="tabpanel">
        <!-- Floating Comparison Bar -->
        <div id="comparison-floating-bar" class="p-3 mb-3 rounded d-flex justify-content-between align-items-center shadow" style="display: none !important; background: linear-gradient(90deg, #38003c, #161e30); border: 1px solid var(--pl-green);">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-bar-chart-steps text-success fs-5"></i>
            <span class="text-white fw-bold" id="comparison-selected-text">Comparing:</span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-fpl-green" onclick="FPLScout.openComparisonModal()">
              <i class="bi bi-eye"></i> View Comparison Chart
            </button>
            <button id="btn-clear-comparison" class="btn btn-sm btn-outline-light">
              Clear
            </button>
          </div>
        </div>

        <!-- Filter Controls Bar -->
        <div class="filter-bar">
          <div class="row g-2 align-items-center">
            <!-- Search -->
            <div class="col-md-3">
              <div class="input-group input-group-sm">
                <span class="input-group-text bg-dark border-secondary text-muted"><i class="bi bi-search"></i></span>
                <input type="text" id="scout-search" class="form-control form-control-dark" placeholder="Search player or club...">
              </div>
            </div>

            <!-- Position -->
            <div class="col-6 col-md-2">
              <select id="scout-position" class="form-select form-select-sm form-select-dark">
                <option value="ALL">All Positions</option>
                <option value="GKP">Goalkeepers (GKP)</option>
                <option value="DEF">Defenders (DEF)</option>
                <option value="MID">Midfielders (MID)</option>
                <option value="FWD">Forwards (FWD)</option>
              </select>
            </div>

            <!-- Team -->
            <div class="col-6 col-md-2">
              <select id="scout-team" class="form-select form-select-sm form-select-dark">
                <option value="ALL">All Clubs</option>
              </select>
            </div>

            <!-- Max Price Slider -->
            <div class="col-6 col-md-2">
              <div class="d-flex justify-content-between small text-muted">
                <span>Max Price:</span>
                <strong id="max-price-val" class="text-white">£16.0m</strong>
              </div>
              <input type="range" class="form-range" id="scout-max-price" min="4.0" max="16.0" step="0.5" value="16.0">
            </div>

            <!-- Sort By -->
            <div class="col-6 col-md-2">
              <select id="scout-sort-by" class="form-select form-select-sm form-select-dark">
                <option value="smart_buy_score-desc">Smart Buy Score (Desc)</option>
                <option value="form-desc">Recent Form (Desc)</option>
                <option value="total_points-desc">Total Points (Desc)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="xgi_per_90-desc">xGI / 90 (Desc)</option>
                <option value="ict_index-desc">ICT Index (Desc)</option>
                <option value="avg_fdr_3-asc">Next 3 FDR (Easiest)</option>
                <option value="selected_by_percent-desc">Ownership % (Desc)</option>
              </select>
            </div>

            <!-- Available Only Checkbox -->
            <div class="col-12 col-md-1 text-md-end">
              <div class="form-check form-switch small">
                <input class="form-check-input" type="checkbox" id="scout-available-only">
                <label class="form-check-label text-muted" for="scout-available-only">Fit</label>
              </div>
            </div>
          </div>
        </div>

        <!-- Scout Results Table -->
        <div class="fpl-card p-0 overflow-hidden">
          <div class="p-3 d-flex justify-content-between align-items-center border-bottom border-secondary">
            <span class="small text-muted" id="scout-count-display">Showing 0 players</span>
            <small class="text-muted">Click headers or use dropdown to sort</small>
          </div>

          <div class="table-responsive">
            <table class="table table-fpl table-hover mb-0">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Price</th>
                  <th title="Smart Buy Score: Combines Form, Fixture Ease, xGI, and Value">Smart Score</th>
                  <th>Form</th>
                  <th>Pts</th>
                  <th title="Expected Goal Involvement per 90">xGI/90</th>
                  <th title="Influence, Creativity, Threat Index">ICT</th>
                  <th title="Average Fixture Difficulty Rating over next 3 games">FDR 3</th>
                  <th>Next Match</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody id="scout-table-body">
                <!-- Rendered by scout.js -->
              </tbody>
            </table>
          </div>

          <div class="p-3 d-flex justify-content-center">
            <ul class="pagination pagination-sm mb-0" id="scout-pagination"></ul>
          </div>
        </div>
      </div>

      <!-- ====================================================================
           TAB 4: STRATEGY & FIXTURE DIFFICULTY (FDR)
           ==================================================================== -->
      <div class="tab-pane fade" id="strategy-tab-pane" role="tabpanel">
        <div class="row g-4">
          <!-- FDR Matrix Ticker -->
          <div class="col-lg-8">
            <div class="fpl-card">
              <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div>
                  <h5 class="fpl-card-title mb-1">
                    <i class="bi bi-calendar3-range text-success"></i> 5-Gameweek Fixture Heatmap (FDR)
                  </h5>
                  <small class="text-muted">Color-coded fixture difficulty: 1 (Very Easy, Dark Green) to 5 (Very Hard, Red).</small>
                </div>

                <div class="d-flex gap-2">
                  <input type="text" id="ticker-search" class="form-control form-control-sm form-control-dark" placeholder="Filter team..." style="width: 140px;">
                  <select id="ticker-sort-select" class="form-select form-select-sm form-select-dark" style="width: 160px;">
                    <option value="fdr3">Easiest Next 3</option>
                    <option value="fdr5">Easiest Next 5</option>
                    <option value="name">Alphabetical</option>
                  </select>
                </div>
              </div>

              <!-- FDR Table -->
              <div class="table-responsive">
                <table class="table table-dark table-fpl small align-middle">
                  <thead>
                    <tr>
                      <th>Club</th>
                      <th class="text-center" title="Average difficulty for next 3 fixtures">Avg 3</th>
                      <th class="text-center" title="Average difficulty for next 5 fixtures">Avg 5</th>
                      <th class="text-center">GW +1</th>
                      <th class="text-center">GW +2</th>
                      <th class="text-center">GW +3</th>
                      <th class="text-center">GW +4</th>
                      <th class="text-center">GW +5</th>
                    </tr>
                  </thead>
                  <tbody id="fdr-ticker-body">
                    <!-- Rendered by strategy.js -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Long-Term Chip Advisor -->
          <div class="col-lg-4">
            <div class="fpl-card h-100">
              <h5 class="fpl-card-title mb-3">
                <i class="bi bi-stars text-warning"></i> Chip Strategy Guide
              </h5>

              <div class="mb-3 p-3 rounded" style="background: rgba(255,255,255,0.03); border-left: 4px solid #00ff87;">
                <div class="fw-bold text-white mb-1"><i class="bi bi-shuffle text-success me-1"></i> Wildcard 1 & 2</div>
                <p class="small text-muted mb-0">
                  Best deployed before major fixture swings (typically GW 8-10) to offload players facing tough runs and stack up on teams entering green FDR runs.
                </p>
              </div>

              <div class="mb-3 p-3 rounded" style="background: rgba(255,255,255,0.03); border-left: 4px solid #04f5ff;">
                <div class="fw-bold text-white mb-1"><i class="bi bi-lightning text-info me-1"></i> Free Hit</div>
                <p class="small text-muted mb-0">
                  Save for Blank Gameweeks (when multiple clubs miss matches due to FA Cup) or large Double Gameweeks late in the season to maximize points without taking hits.
                </p>
              </div>

              <div class="mb-3 p-3 rounded" style="background: rgba(255,255,255,0.03); border-left: 4px solid #ffb703;">
                <div class="fw-bold text-white mb-1"><i class="bi bi-award text-warning me-1"></i> Triple Captain</div>
                <p class="small text-muted mb-0">
                  Optimal on Double Gameweeks where an elite asset (e.g. Haaland or Salah) plays two home matches with low FDR.
                </p>
              </div>

              <div class="p-3 rounded" style="background: rgba(255,255,255,0.03); border-left: 4px solid #e90052;">
                <div class="fw-bold text-white mb-1"><i class="bi bi-people text-danger me-1"></i> Bench Boost</div>
                <p class="small text-muted mb-0">
                  Combine with a late-season Wildcard to ensure all 15 squad members have double gameweek fixtures and guaranteed minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>

  <!-- ====================================================================
       MODALS
       ==================================================================== -->
  <!-- Player Detail Modal -->
  <div class="modal fade" id="playerDetailModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content modal-content-dark">
        <div class="modal-header modal-header-dark">
          <h5 class="modal-title font-brand text-white" id="player-modal-name">Player Details</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4" id="player-modal-body">
          <!-- Populated by scout.js -->
        </div>
        <div class="modal-footer modal-footer-dark">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Player Head-to-Head Comparison Modal -->
  <div class="modal fade" id="playerComparisonModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content modal-content-dark">
        <div class="modal-header modal-header-dark">
          <h5 class="modal-title font-brand text-white" id="comparison-modal-title">Head-to-Head Comparison</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4">
          <div class="row align-items-center">
            <div class="col-md-6 mb-3 mb-md-0">
              <div style="height: 320px; position: relative;">
                <canvas id="comparisonRadarCanvas"></canvas>
              </div>
            </div>
            <div class="col-md-6">
              <div id="comparison-metrics-table"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer modal-footer-dark">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Screenshot OCR Upload Modal -->
  <div class="modal fade" id="screenshotModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content modal-content-dark">
        <div class="modal-header modal-header-dark">
          <h5 class="modal-title font-brand text-white">
            <i class="bi bi-camera-fill text-success me-2"></i>Scan FPL Team Screenshot
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4">
          <!-- Hidden File Input -->
          <input type="file" id="screenshot-file-input" accept="image/*" style="display: none;">

          <!-- Dropzone -->
          <div id="screenshot-dropzone" class="screenshot-dropzone mb-3">
            <i class="bi bi-cloud-arrow-up fs-1 text-success mb-2 d-block"></i>
            <h6 class="fw-bold text-white mb-1">Click to browse, drag & drop, or paste (Ctrl + V)</h6>
            <small class="text-muted d-block mb-2">Upload a screenshot of your FPL squad from the official app or website</small>
            <button type="button" id="btn-browse-screenshot" class="btn btn-sm btn-fpl-outline">
              <i class="bi bi-folder2-open me-1"></i> Choose Screenshot File
            </button>
          </div>

          <!-- OCR Processing Box -->
          <div id="ocr-progress-box" style="display: none;" class="p-3 rounded bg-dark border border-secondary text-center mb-3">
            <div class="spinner-border text-success spinner-border-sm mb-2" role="status"></div>
            <div id="ocr-progress-text" class="small text-white fw-bold">Processing image...</div>
            <div class="progress mt-2" style="height: 6px; background: #1a2233;">
              <div id="ocr-progress-bar" class="progress-bar bg-success" style="width: 0%;"></div>
            </div>
          </div>

          <!-- Preview & Matched Players -->
          <div id="ocr-preview-container" style="display: none;">
            <div class="row align-items-start">
              <div class="col-md-4 mb-3">
                <div class="small text-muted mb-1">Uploaded Screenshot:</div>
                <img id="ocr-image-preview" src="" alt="Screenshot" class="img-fluid rounded border border-secondary shadow-sm" style="max-height: 220px; object-fit: contain; width: 100%; background: #000;">
              </div>
              <div class="col-md-8">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="small fw-bold text-white">Recognized Squad</span>
                  <span class="badge bg-success" id="ocr-matched-count">0 players detected</span>
                </div>
                <div id="ocr-matched-players-list"></div>

                <!-- Add player manually helper -->
                <div class="mt-2 pt-2 border-top border-secondary">
                  <small class="text-muted d-block mb-1">Missing a player? Type to search and add:</small>
                  <div class="input-group input-group-sm">
                    <input type="text" id="ocr-manual-search-input" class="form-control form-control-dark" placeholder="Search player name...">
                    <button type="button" id="btn-ocr-manual-add" class="btn btn-fpl-outline">
                      <i class="bi bi-plus"></i> Add
                    </button>
                  </div>
                  <div id="ocr-search-results-dropdown" class="list-group list-group-flush mt-1" style="max-height: 140px; overflow-y: auto; display: none;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer modal-footer-dark d-flex justify-content-between">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
          <button type="button" id="btn-confirm-scanned-squad" class="btn btn-fpl-green btn-sm">
            <i class="bi bi-check2-circle"></i> Load on Pitch & Get Advice
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Personalized Gameweek Advice Modal -->
  <div class="modal fade" id="adviceModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content modal-content-dark">
        <div class="modal-header modal-header-dark">
          <h5 class="modal-title font-brand text-white" id="advice-modal-title">
            <i class="bi bi-robot text-success me-2"></i>Personalized Gameweek Advice
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4" id="advice-modal-body">
          <!-- Populated by ocr_advisor.js -->
        </div>
        <div class="modal-footer modal-footer-dark">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Scripts: Bootstrap 5, Chart.js, Tesseract.js OCR, Modules -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
  <script src="assets/js/app.js"></script>
  <script src="assets/js/scout.js"></script>
  <script src="assets/js/pitch.js"></script>
  <script src="assets/js/strategy.js"></script>
  <script src="assets/js/ocr_advisor.js"></script>
</body>
</html>
