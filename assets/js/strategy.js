/**
 * FPL Strategy & Transfer Optimization Engine
 * FDR Ticker, Transfer Recommender, Chip Strategy Guide
 */

const FPLStrategy = {
  fdrData: [],
  allPlayers: [],
  tickerSort: 'fdr3',

  init(data) {
    if (!data) return;
    this.fdrData = data.fdr_ticker || [];
    this.allPlayers = data.players || [];

    this.setupEventListeners();
    this.renderFDRTicker();
  },

  setupEventListeners() {
    const tickerSortSelect = document.getElementById('ticker-sort-select');
    if (tickerSortSelect) {
      tickerSortSelect.addEventListener('change', (e) => {
        this.tickerSort = e.target.value;
        this.renderFDRTicker();
      });
    }

    const tickerSearch = document.getElementById('ticker-search');
    if (tickerSearch) {
      tickerSearch.addEventListener('input', () => {
        this.renderFDRTicker();
      });
    }
  },

  // Render 5-Gameweek FDR Heatmap Matrix
  renderFDRTicker() {
    const tbody = document.getElementById('fdr-ticker-body');
    if (!tbody) return;

    let list = [...this.fdrData];
    const search = (document.getElementById('ticker-search')?.value || '').toLowerCase().trim();

    if (search) {
      list = list.filter(t => t.team_name.toLowerCase().includes(search) || t.short_name.toLowerCase().includes(search));
    }

    // Sort
    list.sort((a, b) => {
      if (this.tickerSort === 'fdr3') return a.avg_fdr_3 - b.avg_fdr_3;
      if (this.tickerSort === 'fdr5') return a.avg_fdr_5 - b.avg_fdr_5;
      if (this.tickerSort === 'name') return a.team_name.localeCompare(b.team_name);
      return 0;
    });

    tbody.innerHTML = list.map(t => {
      const fixBadges = (t.next_fixtures || []).slice(0, 5).map(f => {
        const venue = f.is_home ? 'H' : 'A';
        return `
          <td class="text-center p-1">
            <span class="fdr-badge fdr-${f.difficulty} w-100 py-1" title="GW${f.event}: vs ${f.opponent_name} (${venue}) - Diff ${f.difficulty}">
              ${f.opponent_name} (${venue})
            </span>
          </td>
        `;
      }).join('');

      return `
        <tr>
          <td class="fw-bold text-white">
            ${t.team_name} <small class="text-muted">(${t.short_name})</small>
          </td>
          <td class="text-center fw-bold ${t.avg_fdr_3 <= 2.7 ? 'text-success' : (t.avg_fdr_3 >= 3.7 ? 'text-danger' : 'text-white')}">
            ${t.avg_fdr_3}
          </td>
          <td class="text-center text-muted">
            ${t.avg_fdr_5}
          </td>
          ${fixBadges}
        </tr>
      `;
    }).join('');
  },

  // Transfer Optimization Algorithm
  runTransferOptimizer(squadPlayers, bank) {
    const container = document.getElementById('transfer-suggestions-container');
    if (!container) return;

    if (!squadPlayers || squadPlayers.length === 0) {
      container.innerHTML = `
        <div class="alert alert-warning">
          <i class="bi bi-info-circle me-1"></i> Please add players to your squad or click <strong>Auto-Pick</strong> before running the transfer assistant.
        </div>
      `;
      return;
    }

    // 1. Identify Sell Candidates (High FDR >= 3.6, or Form < 3.0, or Injury)
    const sellCandidates = squadPlayers.filter(p => {
      return p.status !== 'a' || p.avg_fdr_3 >= 3.6 || p.form < 3.0;
    });

    // Sort sell candidates by urgency (injured first, then lowest Smart Buy Score)
    sellCandidates.sort((a, b) => {
      if (a.status !== 'a' && b.status === 'a') return -1;
      if (b.status !== 'a' && a.status === 'a') return 1;
      return a.smart_buy_score - b.smart_buy_score;
    });

    if (sellCandidates.length === 0) {
      container.innerHTML = `
        <div class="alert alert-success text-center py-4">
          <i class="bi bi-shield-check fs-2 d-block mb-2 text-success"></i>
          <h5 class="fw-bold">Your squad is in prime condition!</h5>
          <p class="mb-0 text-muted">No high-urgency transfer problems detected. All players have favorable fixtures or high form.</p>
        </div>
      `;
      return;
    }

    // For each sell candidate, find top replacement
    const suggestions = [];

    sellCandidates.forEach(sellPlayer => {
      const maxAffordable = Math.round((sellPlayer.price + bank) * 10) / 10;

      // Find replacement in same position
      const candidates = this.allPlayers.filter(p => {
        if (p.position !== sellPlayer.position) return false;
        if (p.id === sellPlayer.id) return false;
        if (squadPlayers.some(sp => sp.id === p.id)) return false; // Not already in squad
        if (p.price > maxAffordable) return false;
        if (p.status !== 'a') return false; // Must be fit
        if (p.smart_buy_score <= sellPlayer.smart_buy_score) return false; // Must be an upgrade
        return true;
      });

      // Sort by Smart Buy Score descending
      candidates.sort((a, b) => b.smart_buy_score - a.smart_buy_score);

      if (candidates.length > 0) {
        suggestions.push({
          sell: sellPlayer,
          buy: candidates[0],
          alternatives: candidates.slice(1, 3),
          budgetSaved: Math.round((sellPlayer.price - candidates[0].price) * 10) / 10
        });
      }
    });

    if (suggestions.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info">
          Identified candidates to sell, but no affordable upgrades fit within your remaining bank (£${bank.toFixed(1)}m). Consider freeing up budget first.
        </div>
      `;
      return;
    }

    container.innerHTML = suggestions.slice(0, 4).map(s => {
      const sellOpp = s.sell.next_opponent;
      const buyOpp = s.buy.next_opponent;

      return `
        <div class="fpl-card mb-3 p-3">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge bg-primary text-uppercase">${s.sell.position} Transfer Recommendation</span>
            <span class="badge ${s.budgetSaved >= 0 ? 'bg-success' : 'bg-warning text-dark'}">
              ${s.budgetSaved >= 0 ? `Saves +£${s.budgetSaved}m` : `Costs £${Math.abs(s.budgetSaved)}m`}
            </span>
          </div>

          <div class="row align-items-center">
            <!-- SELL COLUMN -->
            <div class="col-md-5">
              <div class="p-3 rounded border border-danger bg-danger-subtle text-dark">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <span class="badge bg-danger text-white mb-1">SELL</span>
                    <h5 class="fw-bold mb-0 text-white">${s.sell.web_name}</h5>
                    <small class="text-white-50">${s.sell.team_short} · £${s.sell.price}m</small>
                  </div>
                  <div class="text-end">
                    <span class="badge bg-dark text-white">SBS: ${s.sell.smart_buy_score}</span>
                  </div>
                </div>

                <div class="small mt-2 pt-2 border-top border-secondary text-white">
                  ${s.sell.status !== 'a' ? `<div class="text-warning fw-bold"><i class="bi bi-bandaid"></i> ${s.sell.news}</div>` : ''}
                  <div>Next 3 FDR: <strong>${s.sell.avg_fdr_3}</strong> (Tough run)</div>
                  <div>Recent Form: <strong>${s.sell.form}</strong></div>
                </div>
              </div>
            </div>

            <!-- ARROW -->
            <div class="col-md-2 text-center my-2 my-md-0">
              <div class="display-6 text-success"><i class="bi bi-arrow-right-circle-fill"></i></div>
            </div>

            <!-- BUY COLUMN -->
            <div class="col-md-5">
              <div class="p-3 rounded border border-success bg-success-subtle text-dark">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <span class="badge bg-success text-dark fw-bold mb-1">BUY</span>
                    <h5 class="fw-bold mb-0 text-white">${s.buy.web_name}</h5>
                    <small class="text-white-50">${s.buy.team_short} · £${s.buy.price}m</small>
                  </div>
                  <div class="text-end">
                    <span class="badge bg-dark text-success fw-bold">SBS: ${s.buy.smart_buy_score}</span>
                  </div>
                </div>

                <div class="small mt-2 pt-2 border-top border-secondary text-white">
                  <div>Next 3 FDR: <strong class="text-success">${s.buy.avg_fdr_3}</strong> (Favorable)</div>
                  <div>Recent Form: <strong class="text-success">${s.buy.form}</strong> · xGI/90: <strong>${s.buy.xgi_per_90}</strong></div>
                </div>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-secondary">
            <small class="text-muted">
              Alternative options: ${s.alternatives.map(a => `<a href="javascript:void(0)" onclick="FPLScout.openPlayerModal(${a.id})" class="text-info">${a.web_name} (£${a.price}m)</a>`).join(', ') || 'None'}
            </small>
            <button class="btn btn-sm btn-fpl-green" onclick="FPLStrategy.applyTransfer(${s.sell.id}, ${s.buy.id})">
              <i class="bi bi-check2-circle"></i> Apply Transfer
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  // Apply transfer directly to squad
  applyTransfer(sellId, buyId) {
    const buyPlayer = this.allPlayers.find(p => p.id === buyId);
    if (!buyPlayer) return;

    // Remove sell player
    FPLPitch.removePlayer(sellId);

    // Add buy player
    FPLPitch.addPlayerToPitch(buyId);

    FPLApp.showToast(`Transfer completed! Brought in ${buyPlayer.web_name}.`, 'success');

    // Switch view to pitch tab
    const pitchTabBtn = document.querySelector('button[data-bs-target="#pitch-tab-pane"]');
    if (pitchTabBtn) {
      bootstrap.Tab.getOrCreateInstance(pitchTabBtn).show();
    }
  }
};
