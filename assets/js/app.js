/**
 * FPL Intelligence Suite - Main Application Controller
 */

const FPLApp = {
  data: null,
  countdownInterval: null,

  // Initialize
  async init() {
    this.setupEventListeners();
    await this.loadData();
  },

  // Setup Global Event Listeners
  setupEventListeners() {
    // Refresh Data Button
    const refreshBtn = document.getElementById('btn-refresh-data');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadData(true);
      });
    }

    // Manager Load Form
    const managerForm = document.getElementById('form-load-manager');
    if (managerForm) {
      managerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const teamId = document.getElementById('input-team-id').value.trim();
        if (teamId) {
          FPLPitch.loadManagerTeam(teamId);
        }
      });
    }

    // Auto-collapse mobile navbar when a tab is selected
    const navButtons = document.querySelectorAll('#fpl-main-tabs .nav-link');
    const navbarCollapse = document.getElementById('navbarFPLContent');
    if (navbarCollapse) {
      navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.innerWidth < 992) {
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) bsCollapse.hide();
          }
        });
      });
    }
  },

  // Load Data from PHP Backend with Static Fallback for GitHub Pages
  async loadData(forceRefresh = false) {
    const spinner = document.getElementById('global-loading');
    const refreshIcon = document.querySelector('#btn-refresh-data i');
    if (refreshIcon) refreshIcon.classList.add('spin-animation');
    if (spinner) spinner.style.display = 'flex';

    try {
      let json = null;

      // 1. Try PHP API endpoint first
      try {
        const url = `api/get_data.php${forceRefresh ? '?force_refresh=1' : ''}`;
        const response = await fetch(url);
        if (response.ok) {
          json = await response.json();
        }
      } catch (e) {
        console.warn('PHP API endpoint unreachable, attempting static fallback...', e);
      }

      // 2. If PHP API failed (e.g. on GitHub Pages), load static data/fpl_data.json
      if (!json || (!json.success && !json.players)) {
        console.log('Loading static data/fpl_data.json...');
        const staticRes = await fetch('data/fpl_data.json');
        if (!staticRes.ok) {
          throw new Error(`Failed to load static data (${staticRes.status})`);
        }
        json = await staticRes.json();
      }

      if (!json.success && json.error) {
        throw new Error(json.error);
      }

      this.data = json;
      this.renderDashboard();
      
      // Initialize sub-modules
      if (typeof FPLScout !== 'undefined') FPLScout.init(this.data);
      if (typeof FPLPitch !== 'undefined') FPLPitch.init(this.data);
      if (typeof FPLStrategy !== 'undefined') FPLStrategy.init(this.data);

      this.showToast(forceRefresh ? 'Fresh FPL data fetched from server!' : 'FPL intelligence updated.', 'success');
    } catch (err) {
      console.error('Failed to load FPL data:', err);
      this.showToast(`Error loading live data: ${err.message}`, 'danger');
    } finally {
      if (spinner) spinner.style.display = 'none';
      if (refreshIcon) refreshIcon.classList.remove('spin-animation');
    }
  },

  // Render Dashboard / Command Center
  renderDashboard() {
    if (!this.data) return;

    // Gameweek info
    const currentGW = this.data.current_gameweek || 1;
    const nextGW = this.data.next_gameweek || currentGW + 1;
    const nextGwObj = this.data.gameweeks.find(g => g.id === nextGW) || this.data.gameweeks[0];

    document.getElementById('current-gw-display').textContent = `Gameweek ${currentGW}`;
    document.getElementById('next-gw-title').textContent = `GW ${nextGW} Deadline`;

    // Start Countdown
    if (nextGwObj && nextGwObj.deadline_time) {
      this.startCountdown(new Date(nextGwObj.deadline_time));
    }

    // Last updated stamp
    const stamp = document.getElementById('last-updated-stamp');
    if (stamp) stamp.textContent = `Updated: ${this.data.last_updated} (${this.data.cached ? 'Cached' : 'Live'})`;

    // Render Captain Matrix on Dashboard
    this.renderCaptainMatrix();

    // Render Top Differentials
    this.renderDifferentials();

    // Render Market Movers
    this.renderMarketMovers();
  },

  // Gameweek Deadline Countdown
  startCountdown(deadlineDate) {
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = deadlineDate.getTime() - now;

      const countdownEl = document.getElementById('gw-countdown');
      if (!countdownEl) return;

      if (distance < 0) {
        countdownEl.textContent = 'DEADLINE PASSED';
        clearInterval(this.countdownInterval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    updateTimer();
    this.countdownInterval = setInterval(updateTimer, 1000);
  },

  // Render Captaincy Matrix
  renderCaptainMatrix() {
    const container = document.getElementById('captain-recommendations-container');
    if (!container || !this.data.captains) return;

    container.innerHTML = this.data.captains.map((p, idx) => {
      const opp = p.next_opponent;
      const fixtureText = opp ? `${opp.opponent_name} (${opp.is_home ? 'H' : 'A'})` : 'TBD';
      const fdrClass = opp ? `fdr-${opp.difficulty}` : 'fdr-3';

      return `
        <div class="col-md-6 col-lg-4 mb-3">
          <div class="fpl-card fpl-card-interactive h-100">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div class="d-flex align-items-center gap-2">
                <div class="captain-rank-pill">#${idx + 1}</div>
                <div>
                  <h6 class="mb-0 fw-bold">${p.web_name}</h6>
                  <small class="text-muted">${p.team_short} · ${p.position} · £${p.price}m</small>
                </div>
              </div>
              <span class="smart-score-badge">${p.captaincy_score} PTS</span>
            </div>

            <div class="d-flex align-items-center justify-content-between p-2 rounded mb-3" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color);">
              <span class="text-muted small">Next Fixture:</span>
              <span class="fdr-badge ${fdrClass}">${fixtureText}</span>
            </div>

            <div class="small text-muted mb-2">Algorithm Breakdown:</div>
            
            <div class="mb-2">
              <div class="d-flex justify-content-between small mb-1">
                <span>Form (${p.form})</span>
                <span class="text-white">${Math.round((p.form / 10) * 35)}%</span>
              </div>
              <div class="progress" style="height: 5px; background: #1f293d;">
                <div class="progress-bar bg-success" style="width: ${Math.min(100, (p.form / 10) * 100)}%"></div>
              </div>
            </div>

            <div class="mb-2">
              <div class="d-flex justify-content-between small mb-1">
                <span>xGI/90 (${p.xgi_per_90})</span>
                <span class="text-white">${Math.round((p.xgi_per_90 / 0.9) * 25)}%</span>
              </div>
              <div class="progress" style="height: 5px; background: #1f293d;">
                <div class="progress-bar bg-info" style="width: ${Math.min(100, (p.xgi_per_90 / 0.8) * 100)}%"></div>
              </div>
            </div>

            <div class="mt-3 pt-2 border-top border-secondary d-flex justify-content-between align-items-center">
              <button class="btn btn-sm btn-fpl-outline" onclick="FPLScout.openPlayerModal(${p.id})">
                <i class="bi bi-bar-chart"></i> Stats
              </button>
              <button class="btn btn-sm btn-fpl-green" onclick="FPLPitch.addPlayerToPitch(${p.id})">
                <i class="bi bi-plus-circle"></i> Pick
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // Render Differentials
  renderDifferentials() {
    const container = document.getElementById('differentials-container');
    if (!container || !this.data.differentials) return;

    container.innerHTML = this.data.differentials.map(p => {
      const opp = p.next_opponent;
      const fixtureText = opp ? `${opp.opponent_name} (${opp.is_home ? 'H' : 'A'})` : 'TBD';
      const fdrClass = opp ? `fdr-${opp.difficulty}` : 'fdr-3';

      return `
        <div class="col-md-6 col-lg-3 mb-3">
          <div class="fpl-card fpl-card-interactive h-100 p-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge bg-secondary">${p.position}</span>
              <span class="badge bg-warning text-dark">${p.selected_by_percent}% Owned</span>
            </div>
            <h6 class="fw-bold mb-1">${p.web_name}</h6>
            <div class="text-muted small mb-2">${p.team_short} · £${p.price}m</div>
            
            <div class="d-flex justify-content-between small text-muted my-2 py-1 border-top border-bottom border-secondary">
              <span>Form: <strong class="text-white">${p.form}</strong></span>
              <span>SBS: <strong class="text-success">${p.smart_buy_score}</strong></span>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="fdr-badge ${fdrClass}">${fixtureText}</span>
              <button class="btn btn-sm btn-fpl-outline py-1 px-2" onclick="FPLPitch.addPlayerToPitch(${p.id})">
                + Add
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // Render Market Movers (Transfers in/out)
  renderMarketMovers() {
    const inContainer = document.getElementById('transfers-in-container');
    const outContainer = document.getElementById('transfers-out-container');

    if (inContainer && this.data.top_transfers_in) {
      inContainer.innerHTML = this.data.top_transfers_in.map(p => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary">
          <div>
            <div class="fw-bold">${p.web_name} <small class="text-muted">(${p.team_short})</small></div>
            <small class="text-muted">£${p.price}m · Form: ${p.form}</small>
          </div>
          <div class="text-end">
            <span class="text-success fw-bold">+${(p.transfers_in_event).toLocaleString()}</span>
            <div><span class="badge bg-success-subtle text-success">Rise Likely</span></div>
          </div>
        </div>
      `).join('');
    }

    if (outContainer && this.data.top_transfers_out) {
      outContainer.innerHTML = this.data.top_transfers_out.map(p => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary">
          <div>
            <div class="fw-bold">${p.web_name} <small class="text-muted">(${p.team_short})</small></div>
            <small class="text-muted">£${p.price}m · ${p.news || 'Fit'}</small>
          </div>
          <div class="text-end">
            <span class="text-danger fw-bold">-${(p.transfers_out_event).toLocaleString()}</span>
            <div><span class="badge bg-danger-subtle text-danger">Drop Likely</span></div>
          </div>
        </div>
      `).join('');
    }
  },

  // Toast Notification
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type === 'danger' ? 'danger' : (type === 'success' ? 'dark border-success' : 'primary')} border-0 show mb-2`;
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${type === 'success' ? 'bi-check-circle-fill text-success me-2' : (type === 'danger' ? 'bi-exclamation-triangle-fill me-2' : 'bi-info-circle me-2')}"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    container.appendChild(toastEl);
    setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 400);
    }, 4500);
  },

  // Universal string normalizer for search and OCR matching
  normalizeText(str) {
    if (!str) return '';
    return str
      .toString()
      .replace(/ß|ẞ/g, 'ss')
      .replace(/æ|Æ/g, 'ae')
      .replace(/œ|Œ/g, 'oe')
      .replace(/ø|Ø/g, 'o')
      .replace(/ð|Ð/g, 'd')
      .replace(/þ|Þ/g, 'th')
      .replace(/đ|Đ/g, 'd')
      .replace(/ł|Ł/g, 'l')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  },

  normalizeWords(str) {
    if (!str) return '';
    return str
      .toString()
      .replace(/ß|ẞ/g, 'ss')
      .replace(/æ|Æ/g, 'ae')
      .replace(/œ|Œ/g, 'oe')
      .replace(/ø|Ø/g, 'o')
      .replace(/ð|Ð/g, 'd')
      .replace(/þ|Þ/g, 'th')
      .replace(/đ|Đ/g, 'd')
      .replace(/ł|Ł/g, 'l')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  FPLApp.init();
});
