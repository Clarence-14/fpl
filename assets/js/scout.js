/**
 * FPL Scout & Research Engine
 * Filters, sorting, advanced metrics, player comparison radar charts.
 */

const FPLScout = {
  players: [],
  filteredPlayers: [],
  currentPage: 1,
  pageSize: 20,
  sortField: 'smart_buy_score',
  sortAsc: false,
  comparisonIds: [],
  comparisonChart: null,

  init(data) {
    if (!data || !data.players) return;
    this.players = data.players;
    this.setupFilters();
    this.applyFilters();
  },

  setupFilters() {
    const searchInput = document.getElementById('scout-search');
    const posFilter = document.getElementById('scout-position');
    const teamFilter = document.getElementById('scout-team');
    const maxPriceInput = document.getElementById('scout-max-price');
    const availableOnlyCheck = document.getElementById('scout-available-only');
    const sortBySelect = document.getElementById('scout-sort-by');

    // Populate team filter options if empty
    if (teamFilter && teamFilter.options.length <= 1 && FPLApp.data.teams) {
      FPLApp.data.teams.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name;
        teamFilter.appendChild(opt);
      });
    }

    const triggerFilter = () => {
      this.currentPage = 1;
      this.applyFilters();
    };

    if (searchInput) searchInput.addEventListener('input', triggerFilter);
    if (posFilter) posFilter.addEventListener('change', triggerFilter);
    if (teamFilter) teamFilter.addEventListener('change', triggerFilter);
    if (maxPriceInput) {
      maxPriceInput.addEventListener('input', (e) => {
        const valSpan = document.getElementById('max-price-val');
        if (valSpan) valSpan.textContent = `£${parseFloat(e.target.value).toFixed(1)}m`;
        triggerFilter();
      });
    }
    if (availableOnlyCheck) availableOnlyCheck.addEventListener('change', triggerFilter);
    if (sortBySelect) {
      sortBySelect.addEventListener('change', (e) => {
        const parts = e.target.value.split('-');
        this.sortField = parts[0];
        this.sortAsc = parts[1] === 'asc';
        this.applyFilters();
      });
    }

    // Comparison modal clear button
    const clearCompBtn = document.getElementById('btn-clear-comparison');
    if (clearCompBtn) {
      clearCompBtn.addEventListener('click', () => {
        this.comparisonIds = [];
        this.updateComparisonUI();
      });
    }
  },

  applyFilters() {
    const rawSearch = document.getElementById('scout-search')?.value || '';
    const normSearch = typeof FPLApp !== 'undefined' && FPLApp.normalizeWords 
      ? FPLApp.normalizeWords(rawSearch) 
      : rawSearch.toLowerCase().trim();
    const searchTokens = normSearch ? normSearch.split(' ').filter(Boolean) : [];

    const pos = document.getElementById('scout-position')?.value || 'ALL';
    const teamId = document.getElementById('scout-team')?.value || 'ALL';
    const maxPrice = parseFloat(document.getElementById('scout-max-price')?.value || '16.0');
    const availableOnly = document.getElementById('scout-available-only')?.checked || false;

    this.filteredPlayers = this.players.filter(p => {
      // Search with accent normalization and multi-token matching
      if (searchTokens.length > 0) {
        const normWeb = FPLApp.normalizeWords ? FPLApp.normalizeWords(p.web_name) : (p.web_name || '').toLowerCase();
        const normSecond = FPLApp.normalizeWords ? FPLApp.normalizeWords(p.second_name) : (p.second_name || '').toLowerCase();
        const normFirst = FPLApp.normalizeWords ? FPLApp.normalizeWords(p.first_name) : (p.first_name || '').toLowerCase();
        const normFull = FPLApp.normalizeWords ? FPLApp.normalizeWords((p.first_name || '') + ' ' + (p.second_name || '')) : '';
        const normTeam = FPLApp.normalizeWords ? FPLApp.normalizeWords(p.team_name || '') : (p.team_name || '').toLowerCase();
        const normTeamShort = FPLApp.normalizeWords ? FPLApp.normalizeWords(p.team_short || '') : (p.team_short || '').toLowerCase();
        const normPos = FPLApp.normalizeWords ? FPLApp.normalizeWords(p.position || '') : (p.position || '').toLowerCase();

        const haystack = `${normWeb} ${normSecond} ${normFirst} ${normFull} ${normTeam} ${normTeamShort} ${normPos}`;
        const allMatch = searchTokens.every(token => haystack.includes(token));
        if (!allMatch) return false;
      }
      // Position
      if (pos !== 'ALL' && p.position !== pos) return false;
      // Team
      if (teamId !== 'ALL' && p.team_id != teamId) return false;
      // Max Price
      if (p.price > maxPrice) return false;
      // Available Only
      if (availableOnly && p.status !== 'a') return false;

      return true;
    });

    // Sort
    this.filteredPlayers.sort((a, b) => {
      let valA = a[this.sortField];
      let valB = b[this.sortField];

      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    this.renderTable();
  },

  renderTable() {
    const tbody = document.getElementById('scout-table-body');
    const countEl = document.getElementById('scout-count-display');
    const paginationEl = document.getElementById('scout-pagination');
    if (!tbody) return;

    if (countEl) countEl.textContent = `Showing ${this.filteredPlayers.length} players`;

    const totalPages = Math.ceil(this.filteredPlayers.length / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const pagePlayers = this.filteredPlayers.slice(startIdx, startIdx + this.pageSize);

    if (pagePlayers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-5 text-muted">
            <i class="bi bi-search fs-2 mb-2 d-block"></i>
            No players match your search criteria.
          </td>
        </tr>
      `;
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    tbody.innerHTML = pagePlayers.map(p => {
      const opp = p.next_opponent;
      const fixtureBadge = opp 
        ? `<span class="fdr-badge fdr-${opp.difficulty}">${opp.opponent_name} (${opp.is_home ? 'H' : 'A'})</span>`
        : `<span class="badge bg-secondary">-</span>`;

      const isCompared = this.comparisonIds.includes(p.id);

      return `
        <tr>
          <td>
            <div class="player-identity-cell">
              <div>
                <div class="fw-bold text-white d-flex align-items-center gap-1">
                  ${p.web_name}
                  ${p.status !== 'a' ? `<span class="badge bg-danger p-1" title="${p.news}">!</span>` : ''}
                </div>
                <small class="text-muted">${p.team_short} · <span class="pos-tag pos-${p.position}">${p.position}</span></small>
              </div>
            </div>
          </td>
          <td class="fw-bold text-white">£${p.price.toFixed(1)}m</td>
          <td>
            <span class="smart-score-badge">${p.smart_buy_score}</span>
          </td>
          <td class="fw-bold ${p.form >= 6 ? 'text-success' : (p.form < 3 ? 'text-danger' : 'text-white')}">${p.form}</td>
          <td class="text-white">${p.total_points}</td>
          <td class="text-white">${p.xgi_per_90}</td>
          <td class="text-white">${p.ict_index}</td>
          <td class="text-white">${p.avg_fdr_3}</td>
          <td>${fixtureBadge}</td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-fpl-outline" title="Player Stats" onclick="FPLScout.openPlayerModal(${p.id})">
                <i class="bi bi-info-circle"></i>
              </button>
              <button class="btn ${isCompared ? 'btn-warning' : 'btn-fpl-outline'}" title="Compare Player" onclick="FPLScout.toggleComparison(${p.id})">
                <i class="bi bi-bar-chart-steps"></i>
              </button>
              <button class="btn btn-fpl-green" title="Add to Squad" onclick="FPLPitch.addPlayerToPitch(${p.id})">
                <i class="bi bi-plus"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Render Pagination
    if (paginationEl) {
      let pageHtml = '';
      if (totalPages > 1) {
        pageHtml += `
          <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link bg-dark text-white border-secondary" href="javascript:void(0)" onclick="FPLScout.changePage(${this.currentPage - 1})">Prev</a>
          </li>
        `;

        for (let i = 1; i <= Math.min(5, totalPages); i++) {
          pageHtml += `
            <li class="page-item ${this.currentPage === i ? 'active' : ''}">
              <a class="page-link ${this.currentPage === i ? 'bg-success border-success text-dark fw-bold' : 'bg-dark text-white border-secondary'}" href="javascript:void(0)" onclick="FPLScout.changePage(${i})">${i}</a>
            </li>
          `;
        }

        if (totalPages > 5) {
          pageHtml += `<li class="page-item disabled"><span class="page-link bg-dark text-muted border-secondary">...</span></li>`;
          pageHtml += `
            <li class="page-item ${this.currentPage === totalPages ? 'active' : ''}">
              <a class="page-link bg-dark text-white border-secondary" href="javascript:void(0)" onclick="FPLScout.changePage(${totalPages})">${totalPages}</a>
            </li>
          `;
        }

        pageHtml += `
          <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link bg-dark text-white border-secondary" href="javascript:void(0)" onclick="FPLScout.changePage(${this.currentPage + 1})">Next</a>
          </li>
        `;
      }
      paginationEl.innerHTML = pageHtml;
    }
  },

  changePage(page) {
    const totalPages = Math.ceil(this.filteredPlayers.length / this.pageSize) || 1;
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    this.renderTable();
  },

  // Toggle comparison state for a player (max 2 players)
  toggleComparison(id) {
    const index = this.comparisonIds.indexOf(id);
    if (index > -1) {
      this.comparisonIds.splice(index, 1);
    } else {
      if (this.comparisonIds.length >= 2) {
        this.comparisonIds.shift(); // remove first
      }
      this.comparisonIds.push(id);
    }
    this.updateComparisonUI();
    this.renderTable();

    if (this.comparisonIds.length === 2) {
      this.openComparisonModal();
    }
  },

  updateComparisonUI() {
    const bar = document.getElementById('comparison-floating-bar');
    const textEl = document.getElementById('comparison-selected-text');
    if (!bar) return;

    if (this.comparisonIds.length > 0) {
      bar.style.display = 'flex';
      const names = this.comparisonIds.map(id => {
        const p = this.players.find(x => x.id === id);
        return p ? p.web_name : '';
      }).join(' vs ');
      if (textEl) textEl.textContent = `Comparing (${this.comparisonIds.length}/2): ${names}`;
    } else {
      bar.style.display = 'none';
    }
  },

  // Open Player Detail Modal
  openPlayerModal(id) {
    const p = this.players.find(x => x.id === id);
    if (!p) return;

    const modalTitle = document.getElementById('player-modal-name');
    const modalBody = document.getElementById('player-modal-body');
    if (modalTitle) modalTitle.textContent = `${p.first_name} ${p.second_name} (${p.team_name})`;

    if (modalBody) {
      const opp = p.next_opponent;
      const fixtureBadge = opp 
        ? `<span class="fdr-badge fdr-${opp.difficulty}">${opp.opponent_name} (${opp.is_home ? 'H' : 'A'})</span>`
        : 'None scheduled';

      modalBody.innerHTML = `
        <div class="row">
          <div class="col-md-4 text-center mb-3">
            <div class="display-6 fw-bold text-white mb-1">£${p.price.toFixed(1)}m</div>
            <div class="pos-tag pos-${p.position} d-inline-block mb-3">${p.position}</div>
            
            <div class="p-3 rounded" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color);">
              <div class="small text-muted mb-1">Smart Buy Score</div>
              <div class="h3 fw-bold text-success">${p.smart_buy_score} / 100</div>
              <div class="small text-muted">Captaincy Score: <strong class="text-white">${p.captaincy_score}</strong></div>
            </div>

            ${p.news ? `<div class="alert alert-danger mt-3 p-2 small"><i class="bi bi-exclamation-triangle me-1"></i>${p.news}</div>` : ''}
          </div>

          <div class="col-md-8">
            <h6 class="text-muted text-uppercase small fw-bold">Performance & Research Metrics</h6>
            <div class="row g-2 mb-3">
              <div class="col-6 col-md-4">
                <div class="metric-pill">
                  <span class="label">Total Points</span>
                  <span class="value">${p.total_points}</span>
                </div>
              </div>
              <div class="col-6 col-md-4">
                <div class="metric-pill">
                  <span class="label">Form</span>
                  <span class="value ${p.form >= 6 ? 'text-success' : ''}">${p.form}</span>
                </div>
              </div>
              <div class="col-6 col-md-4">
                <div class="metric-pill">
                  <span class="label">xGI / 90</span>
                  <span class="value text-info">${p.xgi_per_90}</span>
                </div>
              </div>
              <div class="col-6 col-md-4">
                <div class="metric-pill">
                  <span class="label">ICT Index</span>
                  <span class="value">${p.ict_index}</span>
                </div>
              </div>
              <div class="col-6 col-md-4">
                <div class="metric-pill">
                  <span class="label">Selected %</span>
                  <span class="value">${p.selected_by_percent}%</span>
                </div>
              </div>
              <div class="col-6 col-md-4">
                <div class="metric-pill">
                  <span class="label">Next 3 FDR</span>
                  <span class="value">${p.avg_fdr_3}</span>
                </div>
              </div>
            </div>

            <h6 class="text-muted text-uppercase small fw-bold mt-3">Season Breakdown</h6>
            <div class="table-responsive">
              <table class="table table-sm table-dark table-borderless small">
                <tbody>
                  <tr>
                    <td class="text-muted">Goals / Assists:</td>
                    <td class="fw-bold">${p.goals_scored} G / ${p.assists} A</td>
                    <td class="text-muted">Expected Goals (xG):</td>
                    <td class="fw-bold">${p.expected_goals}</td>
                  </tr>
                  <tr>
                    <td class="text-muted">Clean Sheets:</td>
                    <td class="fw-bold">${p.clean_sheets}</td>
                    <td class="text-muted">Expected Assists (xA):</td>
                    <td class="fw-bold">${p.expected_assists}</td>
                  </tr>
                  <tr>
                    <td class="text-muted">Bonus Points:</td>
                    <td class="fw-bold">${p.bonus} (BPS: ${p.bps})</td>
                    <td class="text-muted">Minutes Played:</td>
                    <td class="fw-bold">${p.minutes}'</td>
                  </tr>
                  <tr>
                    <td class="text-muted">Next Opponent:</td>
                    <td colspan="3">${fixtureBadge}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }

    const modal = new bootstrap.Modal(document.getElementById('playerDetailModal'));
    modal.show();
  },

  // Head-to-Head Comparison Modal with Chart.js
  openComparisonModal() {
    if (this.comparisonIds.length !== 2) return;

    const p1 = this.players.find(x => x.id === this.comparisonIds[0]);
    const p2 = this.players.find(x => x.id === this.comparisonIds[1]);
    if (!p1 || !p2) return;

    const titleEl = document.getElementById('comparison-modal-title');
    if (titleEl) titleEl.textContent = `${p1.web_name} vs ${p2.web_name} Head-to-Head`;

    const summaryEl = document.getElementById('comparison-metrics-table');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <table class="table table-dark table-fpl small text-center mb-0">
          <thead>
            <tr>
              <th class="text-start">${p1.web_name} (${p1.team_short})</th>
              <th>Metric</th>
              <th class="text-end">${p2.web_name} (${p2.team_short})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-start fw-bold ${p1.price <= p2.price ? 'text-success' : ''}">£${p1.price}m</td>
              <td class="text-muted">Price</td>
              <td class="text-end fw-bold ${p2.price <= p1.price ? 'text-success' : ''}">£${p2.price}m</td>
            </tr>
            <tr>
              <td class="text-start fw-bold ${p1.smart_buy_score >= p2.smart_buy_score ? 'text-success' : ''}">${p1.smart_buy_score}</td>
              <td class="text-muted">Smart Buy Score</td>
              <td class="text-end fw-bold ${p2.smart_buy_score >= p1.smart_buy_score ? 'text-success' : ''}">${p2.smart_buy_score}</td>
            </tr>
            <tr>
              <td class="text-start fw-bold ${p1.form >= p2.form ? 'text-success' : ''}">${p1.form}</td>
              <td class="text-muted">Form</td>
              <td class="text-end fw-bold ${p2.form >= p1.form ? 'text-success' : ''}">${p2.form}</td>
            </tr>
            <tr>
              <td class="text-start fw-bold ${p1.xgi_per_90 >= p2.xgi_per_90 ? 'text-success' : ''}">${p1.xgi_per_90}</td>
              <td class="text-muted">xGI / 90</td>
              <td class="text-end fw-bold ${p2.xgi_per_90 >= p1.xgi_per_90 ? 'text-success' : ''}">${p2.xgi_per_90}</td>
            </tr>
            <tr>
              <td class="text-start fw-bold ${p1.ict_index >= p2.ict_index ? 'text-success' : ''}">${p1.ict_index}</td>
              <td class="text-muted">ICT Index</td>
              <td class="text-end fw-bold ${p2.ict_index >= p1.ict_index ? 'text-success' : ''}">${p2.ict_index}</td>
            </tr>
            <tr>
              <td class="text-start fw-bold ${p1.avg_fdr_3 <= p2.avg_fdr_3 ? 'text-success' : ''}">${p1.avg_fdr_3}</td>
              <td class="text-muted">Next 3 FDR</td>
              <td class="text-end fw-bold ${p2.avg_fdr_3 <= p1.avg_fdr_3 ? 'text-success' : ''}">${p2.avg_fdr_3}</td>
            </tr>
          </tbody>
        </table>
      `;
    }

    // Chart.js Radar
    const canvas = document.getElementById('comparisonRadarCanvas');
    if (canvas && typeof Chart !== 'undefined') {
      if (this.comparisonChart) {
        this.comparisonChart.destroy();
      }

      // Normalized metrics (0 to 100)
      const normalize = (val, max) => Math.min(100, Math.max(0, Math.round((val / max) * 100)));

      const p1Data = [
        normalize(p1.form, 10),
        normalize(p1.smart_buy_score, 100),
        normalize(p1.xgi_per_90, 1.0),
        normalize(p1.ict_index, 120),
        normalize(5.0 - p1.avg_fdr_3, 4.0), // Higher is easier
        normalize(p1.value_season, 10)
      ];

      const p2Data = [
        normalize(p2.form, 10),
        normalize(p2.smart_buy_score, 100),
        normalize(p2.xgi_per_90, 1.0),
        normalize(p2.ict_index, 120),
        normalize(5.0 - p2.avg_fdr_3, 4.0),
        normalize(p2.value_season, 10)
      ];

      this.comparisonChart = new Chart(canvas, {
        type: 'radar',
        data: {
          labels: ['Form', 'Smart Score', 'xGI / 90', 'ICT Index', 'Fixture Ease', 'Value / £'],
          datasets: [
            {
              label: p1.web_name,
              data: p1Data,
              backgroundColor: 'rgba(0, 255, 135, 0.25)',
              borderColor: '#00ff87',
              borderWidth: 2,
              pointBackgroundColor: '#00ff87'
            },
            {
              label: p2.web_name,
              data: p2Data,
              backgroundColor: 'rgba(4, 245, 255, 0.25)',
              borderColor: '#04f5ff',
              borderWidth: 2,
              pointBackgroundColor: '#04f5ff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              pointLabels: {
                color: '#cbd5e1',
                font: { size: 11, weight: '600' }
              },
              ticks: { display: false, max: 100, min: 0 }
            }
          },
          plugins: {
            legend: {
              labels: { color: '#ffffff', font: { weight: 'bold' } }
            }
          }
        }
      });
    }

    const modal = new bootstrap.Modal(document.getElementById('playerComparisonModal'));
    modal.show();
  }
};
