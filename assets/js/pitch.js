/**
 * FPL Interactive Pitch & Squad Builder
 * Handles squad formation, pitch rendering, player swap, budget tracking,
 * FPL Manager ID sync, and squad optimization.
 */

const FPLPitch = {
  squad: {
    starters: [], // 11 players
    bench: []     // 4 players
  },
  captainId: null,
  viceCaptainId: null,
  swapSelectedId: null,
  allPlayers: [],
  budget: 100.0,

  init(data) {
    if (!data || !data.players) return;
    this.allPlayers = data.players;
    this.setupPitchControls();

    // Check if user has a previously saved squad in localStorage
    const hasLoadedSaved = this.loadSquadFromStorage();
    if (!hasLoadedSaved) {
      // If no saved squad, pre-populate with top Smart Buy Score template squad
      this.autoPickSquad(false); // false = don't overwrite toast if first visit
    }
  },

  setupPitchControls() {
    const autoPickBtn = document.getElementById('btn-auto-pick');
    const clearBtn = document.getElementById('btn-clear-squad');
    const optimizeBtn = document.getElementById('btn-optimize-transfers');

    if (autoPickBtn) {
      autoPickBtn.addEventListener('click', () => this.autoPickSquad(true));
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.squad = { starters: [], bench: [] };
        this.captainId = null;
        this.viceCaptainId = null;
        this.clearStorage();
        this.renderPitch();
        this.updateBudgetUI();
        FPLApp.showToast('Squad cleared.', 'info');
      });
    }

    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', () => {
        if (typeof FPLStrategy !== 'undefined') {
          FPLStrategy.runTransferOptimizer(this.getAllSquadPlayers(), this.getRemainingBank());
        }
      });
    }
  },

  // Save squad state to localStorage
  saveSquadToStorage(managerData = null) {
    try {
      const dataToSave = {
        starters: this.squad.starters.map(p => p.id),
        bench: this.squad.bench.map(p => p.id),
        captainId: this.captainId,
        viceCaptainId: this.viceCaptainId,
        manager: managerData || JSON.parse(localStorage.getItem('fpl_manager_data') || 'null')
      };
      localStorage.setItem('fpl_user_squad', JSON.stringify(dataToSave));
      if (managerData) {
        localStorage.setItem('fpl_manager_data', JSON.stringify(managerData));
      }
    } catch (e) {
      console.warn('Could not save squad to localStorage:', e);
    }
  },

  // Load squad state from localStorage
  loadSquadFromStorage() {
    try {
      const saved = localStorage.getItem('fpl_user_squad');
      if (!saved) return false;

      const parsed = JSON.parse(saved);
      if (!parsed.starters || !Array.isArray(parsed.starters) || parsed.starters.length === 0) {
        return false;
      }

      const starters = parsed.starters.map(id => this.allPlayers.find(p => p.id === id)).filter(Boolean);
      const bench = (parsed.bench || []).map(id => this.allPlayers.find(p => p.id === id)).filter(Boolean);

      if (starters.length === 0) return false;

      this.squad.starters = starters;
      this.squad.bench = bench;
      this.captainId = parsed.captainId || starters[0]?.id;
      this.viceCaptainId = parsed.viceCaptainId || starters[1]?.id;

      this.renderPitch();
      this.updateBudgetUI();

      // Restore Manager profile banner if previously loaded
      if (parsed.manager) {
        const profBanner = document.getElementById('manager-profile-banner');
        if (profBanner) {
          profBanner.style.display = 'flex';
          document.getElementById('manager-team-name').textContent = parsed.manager.team_name || 'My Squad';
          document.getElementById('manager-owner-name').textContent = parsed.manager.player_name || 'Manager';
          document.getElementById('manager-overall-pts').textContent = parsed.manager.total_points || '-';
          document.getElementById('manager-overall-rank').textContent = parsed.manager.overall_rank ? parsed.manager.overall_rank.toLocaleString() : '-';
        }
      }

      FPLApp.showToast('Restored your saved squad!', 'info');
      return true;
    } catch (e) {
      console.warn('Could not restore squad from localStorage:', e);
      return false;
    }
  },

  // Clear localStorage
  clearStorage() {
    try {
      localStorage.removeItem('fpl_user_squad');
      localStorage.removeItem('fpl_manager_data');
      const profBanner = document.getElementById('manager-profile-banner');
      if (profBanner) profBanner.style.display = 'none';
    } catch (e) {
      console.warn(e);
    }
  },

  getAllSquadPlayers() {
    return [...this.squad.starters, ...this.squad.bench];
  },

  getSpentAmount() {
    const total = this.getAllSquadPlayers().reduce((acc, p) => acc + p.price, 0);
    return Math.round(total * 10) / 10;
  },

  getRemainingBank() {
    return Math.round((this.budget - this.getSpentAmount()) * 10) / 10;
  },

  // Auto-pick balanced squad based on highest Smart Buy Scores within £100m
  autoPickSquad() {
    const available = [...this.allPlayers].filter(p => p.status === 'a');
    available.sort((a, b) => b.smart_buy_score - a.smart_buy_score);

    const clubCount = {};
    const picked = [];

    const canPick = (p) => {
      const currentClubs = (clubCount[p.team_id] || 0);
      return currentClubs < 3;
    };

    const pickByPos = (pos, count, maxBudgetPerPlayer = 15) => {
      const list = [];
      for (const p of available) {
        if (list.length >= count) break;
        if (p.position === pos && canPick(p) && !picked.some(x => x.id === p.id)) {
          list.push(p);
          picked.push(p);
          clubCount[p.team_id] = (clubCount[p.team_id] || 0) + 1;
        }
      }
      return list;
    };

    const gkps = pickByPos('GKP', 2);
    const defs = pickByPos('DEF', 5);
    const mids = pickByPos('MID', 5);
    const fwds = pickByPos('FWD', 3);

    // Starters (1 GKP, 3 DEF, 4 MID, 3 FWD) = 11 players
    this.squad.starters = [
      gkps[0],
      defs[0], defs[1], defs[2],
      mids[0], mids[1], mids[2], mids[3],
      fwds[0], fwds[1], fwds[2]
    ].filter(Boolean);

    // Bench (1 GKP, 2 DEF, 1 MID) = 4 players
    this.squad.bench = [
      gkps[1],
      defs[3], defs[4],
      mids[4]
    ].filter(Boolean);

    // Set Captain & Vice Captain
    if (this.squad.starters.length > 0) {
      const sortedByCap = [...this.squad.starters].sort((a, b) => b.captaincy_score - a.captaincy_score);
      this.captainId = sortedByCap[0]?.id || null;
      this.viceCaptainId = sortedByCap[1]?.id || null;
    }

    this.renderPitch();
    this.updateBudgetUI();
    this.saveSquadToStorage();
    if (showToast) {
      FPLApp.showToast('Optimal high-SBS squad generated!', 'success');
    }
  },

  // Add a player from Scout or Recommendations
  addPlayerToPitch(playerId) {
    const player = this.allPlayers.find(p => p.id === playerId);
    if (!player) return;

    const all = this.getAllSquadPlayers();

    // 1. Check if already in squad
    if (all.some(p => p.id === player.id)) {
      FPLApp.showToast(`${player.web_name} is already in your squad!`, 'warning');
      return;
    }

    // 2. Check 15 player limit
    if (all.length >= 15) {
      FPLApp.showToast('Squad is full (15/15 players). Remove a player first.', 'warning');
      return;
    }

    // 3. Check club limit (max 3)
    const clubCount = all.filter(p => p.team_id === player.team_id).length;
    if (clubCount >= 3) {
      FPLApp.showToast(`Already have 3 players from ${player.team_name}!`, 'warning');
      return;
    }

    // 4. Check position quotas (2 GKP, 5 DEF, 5 MID, 3 FWD)
    const posLimits = { GKP: 2, DEF: 5, MID: 5, FWD: 3 };
    const currentInPos = all.filter(p => p.position === player.position).length;
    if (currentInPos >= posLimits[player.position]) {
      FPLApp.showToast(`Position quota full for ${player.position} (${currentInPos}/${posLimits[player.position]}).`, 'warning');
      return;
    }

    // 5. Check budget
    if (this.getRemainingBank() < player.price) {
      FPLApp.showToast(`Insufficient funds! Need £${player.price}m, but bank has £${this.getRemainingBank()}m.`, 'danger');
      return;
    }

    // Add to starters if starting XI < 11 and fits, else bench
    if (this.squad.starters.length < 11) {
      this.squad.starters.push(player);
    } else {
      this.squad.bench.push(player);
    }

    if (!this.captainId) this.captainId = player.id;

    this.renderPitch();
    this.updateBudgetUI();
    this.saveSquadToStorage();
    FPLApp.showToast(`Added ${player.web_name} to squad.`, 'success');
  },

  // Remove player from squad
  removePlayer(playerId) {
    this.squad.starters = this.squad.starters.filter(p => p.id !== playerId);
    this.squad.bench = this.squad.bench.filter(p => p.id !== playerId);

    if (this.captainId === playerId) this.captainId = this.squad.starters[0]?.id || null;
    if (this.viceCaptainId === playerId) this.viceCaptainId = this.squad.starters[1]?.id || null;

    this.renderPitch();
    this.updateBudgetUI();
    this.saveSquadToStorage();
    FPLApp.showToast('Player removed from squad.', 'info');
  },

  // Swap / Substitute two players
  handlePlayerClick(playerId) {
    if (!this.swapSelectedId) {
      this.swapSelectedId = playerId;
      this.renderPitch();
      FPLApp.showToast('Select another player to swap with, or click again to cancel.', 'info');
      return;
    }

    if (this.swapSelectedId === playerId) {
      this.swapSelectedId = null;
      this.renderPitch();
      return;
    }

    // Swap execution
    const p1Id = this.swapSelectedId;
    const p2Id = playerId;
    this.swapSelectedId = null;

    const p1StarterIdx = this.squad.starters.findIndex(p => p.id === p1Id);
    const p1BenchIdx = this.squad.bench.findIndex(p => p.id === p1Id);
    const p2StarterIdx = this.squad.starters.findIndex(p => p.id === p2Id);
    const p2BenchIdx = this.squad.bench.findIndex(p => p.id === p2Id);

    const p1 = this.allPlayers.find(p => p.id === p1Id);
    const p2 = this.allPlayers.find(p => p.id === p2Id);

    if (!p1 || !p2) return;

    // If one is starter and other is bench, ensure valid outfield formation
    if ((p1StarterIdx > -1 && p2BenchIdx > -1) || (p2StarterIdx > -1 && p1BenchIdx > -1)) {
      // If GKP, can only swap with GKP
      if ((p1.position === 'GKP' && p2.position !== 'GKP') || (p2.position === 'GKP' && p1.position !== 'GKP')) {
        FPLApp.showToast('Goalkeepers can only be substituted for another Goalkeeper!', 'warning');
        this.renderPitch();
        return;
      }
    }

    // Perform swap in arrays
    if (p1StarterIdx > -1 && p2StarterIdx > -1) {
      // Both starters
      const temp = this.squad.starters[p1StarterIdx];
      this.squad.starters[p1StarterIdx] = this.squad.starters[p2StarterIdx];
      this.squad.starters[p2StarterIdx] = temp;
    } else if (p1BenchIdx > -1 && p2BenchIdx > -1) {
      // Both bench
      const temp = this.squad.bench[p1BenchIdx];
      this.squad.bench[p1BenchIdx] = this.squad.bench[p2BenchIdx];
      this.squad.bench[p2BenchIdx] = temp;
    } else if (p1StarterIdx > -1 && p2BenchIdx > -1) {
      // p1 starter, p2 bench
      this.squad.starters[p1StarterIdx] = p2;
      this.squad.bench[p2BenchIdx] = p1;
    } else if (p2StarterIdx > -1 && p1BenchIdx > -1) {
      // p2 starter, p1 bench
      this.squad.starters[p2StarterIdx] = p1;
      this.squad.bench[p1BenchIdx] = p2;
    }

    this.renderPitch();
    this.saveSquadToStorage();
    FPLApp.showToast(`Swapped ${p1.web_name} with ${p2.web_name}.`, 'success');
  },

  // Set Captain or Vice-Captain
  setCaptain(playerId, isVice = false) {
    if (isVice) {
      if (this.captainId === playerId) this.captainId = this.viceCaptainId;
      this.viceCaptainId = playerId;
      FPLApp.showToast('Vice-Captain updated.', 'info');
    } else {
      if (this.viceCaptainId === playerId) this.viceCaptainId = this.captainId;
      this.captainId = playerId;
      FPLApp.showToast('Captain updated.', 'info');
    }
    this.renderPitch();
    this.saveSquadToStorage();
  },

  // Render Pitch UI
  renderPitch() {
    const gkRow = document.getElementById('pitch-gk-row');
    const defRow = document.getElementById('pitch-def-row');
    const midRow = document.getElementById('pitch-mid-row');
    const fwdRow = document.getElementById('pitch-fwd-row');
    const benchContainer = document.getElementById('pitch-bench-container');

    if (!gkRow || !defRow || !midRow || !fwdRow || !benchContainer) return;

    // Filter starters by position
    const gks = this.squad.starters.filter(p => p.position === 'GKP');
    const defs = this.squad.starters.filter(p => p.position === 'DEF');
    const mids = this.squad.starters.filter(p => p.position === 'MID');
    const fwds = this.squad.starters.filter(p => p.position === 'FWD');

    gkRow.innerHTML = gks.map(p => this.renderPlayerCard(p)).join('');
    defRow.innerHTML = defs.map(p => this.renderPlayerCard(p)).join('');
    midRow.innerHTML = mids.map(p => this.renderPlayerCard(p)).join('');
    fwdRow.innerHTML = fwds.map(p => this.renderPlayerCard(p)).join('');

    // Bench
    benchContainer.innerHTML = this.squad.bench.map((p, idx) => {
      return this.renderPlayerCard(p, true, idx + 1);
    }).join('');
  },

  // Render individual player card on the pitch or bench
  renderPlayerCard(player, isBench = false, benchOrder = null) {
    if (!player) return '';

    const isSelected = this.swapSelectedId === player.id;
    const isCap = this.captainId === player.id;
    const isVice = this.viceCaptainId === player.id;
    const opp = player.next_opponent;
    const fixtureText = opp ? `${opp.opponent_name} (${opp.is_home ? 'H' : 'A'})` : 'TBD';
    const fdrClass = opp ? `fdr-${opp.difficulty}` : 'fdr-3';

    let cardClasses = 'pitch-player';
    if (isSelected) cardClasses += ' border-warning shadow-lg bg-dark';
    if (isCap) cardClasses += ' captain-active';
    if (isVice) cardClasses += ' vice-active';

    return `
      <div class="${cardClasses}" style="${isSelected ? 'transform: scale(1.08); border: 2px solid #ffb703 !important;' : ''}">
        ${benchOrder ? `<span class="badge bg-dark position-absolute top-0 start-0 small" style="font-size: 0.6rem;">S${benchOrder}</span>` : ''}
        
        <div onclick="FPLPitch.handlePlayerClick(${player.id})">
          <div class="pitch-player-avatar-wrap">
            <img src="${player.photo}" alt="${player.web_name}" class="pitch-player-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="pitch-player-kit-fallback" style="display: none;">
              <span class="pos-tag pos-${player.position}" style="font-size: 0.6rem; padding: 2px 4px;">${player.position}</span>
            </div>
          </div>
          <div class="pitch-player-name" title="${player.first_name} ${player.second_name}">${player.web_name}</div>
          <div class="pitch-player-meta">
            <span>${player.team_short}</span>
            <span class="text-white fw-bold">£${player.price}m</span>
          </div>
          <div class="pitch-player-fix ${fdrClass}">${fixtureText}</div>
        </div>

        <div class="dropdown mt-1">
          <button class="btn btn-sm btn-link text-muted p-0 dropdown-toggle" data-bs-toggle="dropdown" style="font-size: 0.65rem; text-decoration: none;">
            Manage
          </button>
          <ul class="dropdown-menu dropdown-menu-dark small py-1" style="min-width: 110px;">
            <li><a class="dropdown-item py-1" href="javascript:void(0)" onclick="FPLPitch.handlePlayerClick(${player.id})"><i class="bi bi-arrow-left-right me-1"></i> Swap</a></li>
            ${!isBench ? `
              <li><a class="dropdown-item py-1" href="javascript:void(0)" onclick="FPLPitch.setCaptain(${player.id}, false)"><i class="bi bi-c-circle me-1 text-success"></i> Make (C)</a></li>
              <li><a class="dropdown-item py-1" href="javascript:void(0)" onclick="FPLPitch.setCaptain(${player.id}, true)"><i class="bi bi-v-circle me-1 text-info"></i> Make (V)</a></li>
            ` : ''}
            <li><a class="dropdown-item py-1" href="javascript:void(0)" onclick="FPLScout.openPlayerModal(${player.id})"><i class="bi bi-info-circle me-1"></i> Stats</a></li>
            <li><hr class="dropdown-divider my-1"></li>
            <li><a class="dropdown-item py-1 text-danger" href="javascript:void(0)" onclick="FPLPitch.removePlayer(${player.id})"><i class="bi bi-trash me-1"></i> Remove</a></li>
          </ul>
        </div>
      </div>
    `;
  },

  // Update Budget and Squad Summary UI
  updateBudgetUI() {
    const all = this.getAllSquadPlayers();
    const countEl = document.getElementById('squad-count-display');
    const spentEl = document.getElementById('squad-spent-display');
    const bankEl = document.getElementById('squad-bank-display');

    const spent = this.getSpentAmount();
    const bank = this.getRemainingBank();

    if (countEl) countEl.textContent = `${all.length}/15 Players`;
    if (spentEl) spentEl.textContent = `£${spent.toFixed(1)}m`;
    if (bankEl) {
      bankEl.textContent = `£${bank.toFixed(1)}m`;
      bankEl.className = `fw-bold ${bank < 0 ? 'text-danger' : 'text-success'}`;
    }
  },

  // Load Manager Team by FPL Manager ID
  async loadManagerTeam(teamId) {
    const spinner = document.getElementById('global-loading');
    if (spinner) spinner.style.display = 'flex';

    try {
      const response = await fetch(`api/get_manager.php?team_id=${teamId}`);
      if (!response.ok) {
        // If 404 or 405 (typical on static GitHub Pages where PHP cannot run)
        if (response.status === 404 || response.status === 405) {
          throw new Error('GITHUB_PAGES_STATIC_MODE');
        }
        let errMsg = 'Failed to fetch manager data';
        try {
          const errJson = await response.json();
          errMsg = errJson.error || errMsg;
        } catch (e) {}
        throw new Error(errMsg);
      }

      const res = await response.json();
      if (!res.success || !res.picks) {
        throw new Error('No team picks found for this manager ID.');
      }

      const starters = [];
      const bench = [];
      let cap = null;
      let vice = null;

      res.picks.forEach(pick => {
        const player = this.allPlayers.find(p => p.id === pick.element);
        if (!player) return;

        if (pick.is_captain) cap = player.id;
        if (pick.is_vice_captain) vice = player.id;

        // Position 1 to 11 are starters in FPL API, 12 to 15 are bench
        if (pick.position <= 11) {
          starters.push(player);
        } else {
          bench.push(player);
        }
      });

      this.squad.starters = starters;
      this.squad.bench = bench;
      this.captainId = cap || starters[0]?.id;
      this.viceCaptainId = vice || starters[1]?.id;

      this.renderPitch();
      this.updateBudgetUI();
      this.saveSquadToStorage(res.manager);

      const managerName = res.manager.player_name || 'Manager';
      const teamName = res.manager.team_name || 'Squad';
      FPLApp.showToast(`Loaded ${teamName} (${managerName})!`, 'success');

      // Update Manager Profile Banner
      const profBanner = document.getElementById('manager-profile-banner');
      if (profBanner) {
        profBanner.style.display = 'flex';
        document.getElementById('manager-team-name').textContent = teamName;
        document.getElementById('manager-owner-name').textContent = managerName;
        document.getElementById('manager-overall-pts').textContent = res.manager.total_points || '-';
        document.getElementById('manager-overall-rank').textContent = res.manager.overall_rank ? res.manager.overall_rank.toLocaleString() : '-';
      }
    } catch (err) {
      console.warn(err);
      if (err.message === 'GITHUB_PAGES_STATIC_MODE') {
        // Show informative modal explaining why and giving the solution
        this.showStaticModeManagerModal();
      } else {
        FPLApp.showToast(`Manager Load Error: ${err.message}`, 'danger');
      }
    } finally {
      if (spinner) spinner.style.display = 'none';
    }
  },

  // Modal explaining GitHub Pages static limitation & directing to Screenshot scanner
  showStaticModeManagerModal() {
    const modalHtml = `
      <div class="modal fade" id="staticModeModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content modal-content-dark">
            <div class="modal-header modal-header-dark">
              <h5 class="modal-title font-brand text-white">
                <i class="bi bi-info-circle text-warning me-2"></i>Loading on GitHub Pages
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4 text-white">
              <p>
                Because <strong>GitHub Pages is a static host</strong> (it doesn't have a backend PHP server), direct FPL Team ID loading is blocked by the Premier League's browser security (CORS) rules.
              </p>
              <div class="p-3 rounded bg-dark border border-secondary mb-3">
                <h6 class="fw-bold text-success mb-2"><i class="bi bi-camera-fill me-1"></i> Use the Screenshot Scanner Instead!</h6>
                <p class="small text-muted mb-2">
                  You can upload or paste a screenshot of your team from the FPL app or website. Our built-in OCR will automatically detect your players and give you custom advice.
                </p>
                <button class="btn btn-sm btn-fpl-green w-100" onclick="bootstrap.Modal.getInstance(document.getElementById('staticModeModal')).hide(); bootstrap.Modal.getOrCreateInstance(document.getElementById('screenshotModal')).show();">
                  <i class="bi bi-camera me-1"></i> Scan Squad Screenshot
                </button>
              </div>
              <small class="text-muted">
                <em>Note: If you host this on Vercel or locally in XAMPP, Team ID direct loading works automatically via the included PHP backend.</em>
              </small>
            </div>
            <div class="modal-footer modal-footer-dark">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing if any
    const existing = document.getElementById('staticModeModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('staticModeModal'));
    modal.show();
  }
};
