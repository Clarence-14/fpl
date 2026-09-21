/**
 * FPL Screenshot OCR Scanner & Personalized Squad Advisor
 * Features:
 * - Canvas image pre-processing (upscaling, grayscale, contrast enhancement for text clarity)
 * - Multi-pass fuzzy & normalized substring matching (handles dots, hyphens, prefixes like B.Fernandes, Calvert-Lewin)
 * - Common player nickname / alias dictionary
 * - Manual player search & quick squad builder
 * - Generates immediate personalized tactical advice (Captain, Bench, Injuries, Transfers)
 */

const FPLAdvisor = {
  isProcessing: false,
  scannedPlayers: [],

  // Common FPL player aliases/nicknames to map accurately
  aliases: {
    'trent': 'alexander-arnold',
    'taa': 'alexander-arnold',
    'bruno': 'b.fernandes',
    'kdb': 'de bruyne',
    'debruyne': 'de bruyne',
    'gabriel': 'gabriel',
    'joao': 'joao pedro',
    'pedro': 'joao pedro',
    'porro': 'pedro porro',
    'luis': 'diaz',
    'dibu': 'e.martinez',
    'emi': 'e.martinez',
    'martinez': 'e.martinez',
    'smith-rowe': 'smith rowe',
    'esr': 'smith rowe',
    'vvd': 'van dijk',
    'vandijk': 'van dijk',
    'clw': 'calvert-lewin',
    'dcl': 'calvert-lewin'
  },

  init() {
    this.setupEventListeners();
  },

  setupEventListeners() {
    const dropzone = document.getElementById('screenshot-dropzone');
    const fileInput = document.getElementById('screenshot-file-input');
    const browseBtn = document.getElementById('btn-browse-screenshot');

    if (fileInput) {
      fileInput.addEventListener('click', (e) => e.stopPropagation());

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          this.processImage(file);
          fileInput.value = '';
        }
      });
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', (e) => {
        if (e.target !== browseBtn && !browseBtn?.contains(e.target)) {
          fileInput.click();
        }
      });

      if (browseBtn) {
        browseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fileInput.click();
        });
      }

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.processImage(e.dataTransfer.files[0]);
        }
      });
    }

    // Global paste listener (Ctrl + V)
    window.addEventListener('paste', (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData)?.items;
      if (!items) return;

      for (const item of items) {
        if (item.kind === 'file' && item.type.includes('image')) {
          const file = item.getAsFile();
          if (file) {
            const modalEl = document.getElementById('screenshotModal');
            if (modalEl) {
              const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.show();
            }
            this.processImage(file);
            break;
          }
        }
      }
    });

    // Confirm Scanned Squad Button
    const confirmBtn = document.getElementById('btn-confirm-scanned-squad');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.applyScannedSquad();
      });
    }

    // Manual Player Search in OCR Modal
    const searchInput = document.getElementById('ocr-manual-search-input');
    const searchBtn = document.getElementById('btn-ocr-manual-add');
    const dropdown = document.getElementById('ocr-search-results-dropdown');

    if (searchInput && dropdown) {
      const handleSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2 || !FPLApp.data || !FPLApp.data.players) {
          dropdown.style.display = 'none';
          return;
        }

        const matches = FPLApp.data.players.filter(p => 
          p.web_name.toLowerCase().includes(query) || 
          p.second_name.toLowerCase().includes(query) ||
          p.first_name.toLowerCase().includes(query)
        ).slice(0, 6);

        if (matches.length === 0) {
          dropdown.innerHTML = `<div class="p-2 text-muted small bg-dark">No player found matching "${query}"</div>`;
          dropdown.style.display = 'block';
          return;
        }

        dropdown.innerHTML = matches.map(p => `
          <a href="javascript:void(0)" class="list-group-item list-group-item-action bg-dark text-white border-secondary p-2 d-flex justify-content-between align-items-center" onclick="FPLAdvisor.addPlayerManually(${p.id})">
            <div>
              <strong>${p.web_name}</strong> <small class="text-muted">(${p.team_short} · ${p.position} · £${p.price}m)</small>
            </div>
            <span class="badge bg-success">+ Add</span>
          </a>
        `).join('');
        dropdown.style.display = 'block';
      };

      searchInput.addEventListener('input', handleSearch);
      if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    }
  },

  // Pre-process image on HTML5 Canvas: Grayscale & Contrast boost for text readability
  async preprocessImage(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Scale up if low resolution
          let width = img.width;
          let height = img.height;
          if (width < 1200) {
            const scale = Math.min(2.0, 1400 / width);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }

          canvas.width = width;
          canvas.height = height;

          ctx.drawImage(img, 0, 0, width, height);

          // Get image pixel data
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // Convert to grayscale and apply high contrast
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Grayscale luminance formula
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // Contrast enhancement: stretch values
            const factor = 1.35;
            let contrastGray = factor * (gray - 128) + 128;
            contrastGray = Math.max(0, Math.min(255, contrastGray));

            data[i] = contrastGray;
            data[i + 1] = contrastGray;
            data[i + 2] = contrastGray;
          }

          ctx.putImageData(imgData, 0, 0);
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', 0.95);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  // Process image using pre-processing and Tesseract.js OCR
  async processImage(file) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const progressBox = document.getElementById('ocr-progress-box');
    const progressBar = document.getElementById('ocr-progress-bar');
    const progressText = document.getElementById('ocr-progress-text');
    const previewContainer = document.getElementById('ocr-preview-container');
    const previewImg = document.getElementById('ocr-image-preview');

    if (progressBox) progressBox.style.display = 'block';
    if (previewContainer) previewContainer.style.display = 'block';

    // Show immediate raw preview
    const rawReader = new FileReader();
    rawReader.onload = (e) => {
      if (previewImg) previewImg.src = e.target.result;
    };
    rawReader.readAsDataURL(file);

    try {
      progressText.textContent = 'Enhancing image contrast & sharpening text...';
      progressBar.style.width = '15%';

      // 1. Preprocess image
      const processedBlob = await this.preprocessImage(file);

      progressText.textContent = 'Running OCR neural network...';
      progressBar.style.width = '35%';

      if (typeof Tesseract === 'undefined') {
        throw new Error('Tesseract OCR engine not loaded. Please check your internet connection or add players manually below.');
      }

      // 2. Run Tesseract recognition
      const ret = await Tesseract.recognize(processedBlob, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text' && m.progress) {
            const pct = 35 + Math.round(m.progress * 55);
            if (progressBar) progressBar.style.width = `${pct}%`;
            if (progressText) progressText.textContent = `Analyzing text: ${Math.round(m.progress * 100)}%`;
          }
        }
      });

      progressBar.style.width = '95%';
      progressText.textContent = 'Matching recognized players with Premier League database...';

      const recognizedText = ret?.data?.text || '';
      console.log('OCR Recognized Text:\n', recognizedText);

      // 3. Multi-pass player matching
      const matched = this.matchPlayersFromText(recognizedText);

      progressBar.style.width = '100%';
      if (progressBox) progressBox.style.display = 'none';

      this.scannedPlayers = matched;
      this.renderScannedResults(matched, recognizedText);

      if (matched.length > 0) {
        FPLApp.showToast(`Found ${matched.length} players from your screenshot!`, 'success');
      } else {
        FPLApp.showToast('Could not automatically identify names. Use the search box below to add your players.', 'warning');
      }

    } catch (err) {
      console.warn('OCR processing notice:', err);
      if (progressBox) progressBox.style.display = 'none';
      FPLApp.showToast(`OCR Notice: ${err.message}`, 'warning');
      this.renderScannedResults(this.scannedPlayers, '');
    } finally {
      this.isProcessing = false;
    }
  },

  // Multi-pass smart player matching algorithm
  matchPlayersFromText(rawText) {
    if (!FPLApp.data || !FPLApp.data.players) return [];

    const allPlayers = FPLApp.data.players;

    // Clean text: lowercase, replace punctuation with spaces
    const cleanedText = rawText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    // Continuous text without spaces for glued text e.g. "alexanderarnold", "bfernandes"
    const noSpacesText = cleanedText.replace(/\s+/g, '');
    // Array of words
    const words = cleanedText.split(/\s+/).filter(w => w.length >= 3);

    const matched = [];
    const matchedIds = new Set();

    // Helper: Normalize name (remove dots, hyphens, spaces)
    const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Pass 1: Check Alias dictionary
    for (const [alias, targetName] of Object.entries(this.aliases)) {
      if (words.includes(alias) || noSpacesText.includes(alias)) {
        const found = allPlayers.find(p => 
          normalize(p.web_name) === normalize(targetName) || 
          normalize(p.second_name) === normalize(targetName)
        );
        if (found && !matchedIds.has(found.id)) {
          matched.push(found);
          matchedIds.add(found.id);
        }
      }
    }

    // Pass 2: Substring matching for web_name and second_name
    allPlayers.forEach(p => {
      if (matchedIds.has(p.id)) return;

      const normWeb = normalize(p.web_name);
      const normSecond = normalize(p.second_name);
      const normFirst = normalize(p.first_name);

      // Only check if name is at least 3 characters
      if (normWeb.length >= 3 && noSpacesText.includes(normWeb)) {
        matched.push(p);
        matchedIds.add(p.id);
        return;
      }

      if (normSecond.length >= 4 && noSpacesText.includes(normSecond)) {
        matched.push(p);
        matchedIds.add(p.id);
        return;
      }

      // Exact word match
      if (words.includes(normWeb) || words.includes(normSecond)) {
        matched.push(p);
        matchedIds.add(p.id);
        return;
      }
    });

    // Pass 3: Fuzzy Levenshtein match for slightly misspelled OCR text
    if (matched.length < 15) {
      allPlayers.forEach(p => {
        if (matchedIds.has(p.id)) return;

        const target = normalize(p.web_name);
        if (target.length < 4) return;

        for (const w of words) {
          if (Math.abs(w.length - target.length) <= 1) {
            const dist = this.levenshtein(w, target);
            if (dist === 1) {
              matched.push(p);
              matchedIds.add(p.id);
              break;
            }
          }
        }
      });
    }

    return matched;
  },

  // Simple Levenshtein distance
  levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  },

  // Render matched players in the confirmation UI
  renderScannedResults(matched, rawText = '') {
    const listContainer = document.getElementById('ocr-matched-players-list');
    const countBadge = document.getElementById('ocr-matched-count');
    if (!listContainer) return;

    if (countBadge) countBadge.textContent = `${matched.length} players in list`;

    if (matched.length === 0) {
      listContainer.innerHTML = `
        <div class="alert alert-warning small p-2">
          <i class="bi bi-info-circle me-1"></i> No players identified yet. Upload a screenshot above, or search and add players below.
        </div>
      `;
      return;
    }

    listContainer.innerHTML = `
      <div class="row g-2 mb-2">
        ${matched.map(p => `
          <div class="col-6 col-sm-4 col-md-3">
            <div class="p-2 rounded bg-dark border border-secondary d-flex justify-content-between align-items-center">
              <div>
                <div class="fw-bold small text-truncate" style="max-width: 90px;" title="${p.web_name}">${p.web_name}</div>
                <small class="text-muted">${p.team_short} · ${p.position}</small>
              </div>
              <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-1" onclick="FPLAdvisor.removeScannedPlayer(${p.id})" title="Remove">
                <i class="bi bi-x-circle-fill"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // Add player manually from search
  addPlayerManually(id) {
    if (!FPLApp.data || !FPLApp.data.players) return;
    const player = FPLApp.data.players.find(p => p.id === id);
    if (!player) return;

    if (this.scannedPlayers.some(p => p.id === player.id)) {
      FPLApp.showToast(`${player.web_name} is already in your list.`, 'info');
      return;
    }

    if (this.scannedPlayers.length >= 15) {
      FPLApp.showToast('Squad already has 15 players.', 'warning');
      return;
    }

    this.scannedPlayers.push(player);
    this.renderScannedResults(this.scannedPlayers);

    const dropdown = document.getElementById('ocr-search-results-dropdown');
    const searchInput = document.getElementById('ocr-manual-search-input');
    if (dropdown) dropdown.style.display = 'none';
    if (searchInput) searchInput.value = '';

    FPLApp.showToast(`Added ${player.web_name}`, 'success');
  },

  removeScannedPlayer(id) {
    this.scannedPlayers = this.scannedPlayers.filter(p => p.id !== id);
    this.renderScannedResults(this.scannedPlayers, '');
  },

  // Apply the scanned squad to FPLPitch and generate the personalized advice
  applyScannedSquad() {
    if (this.scannedPlayers.length === 0) {
      FPLApp.showToast('Please upload a screenshot or add players before loading.', 'warning');
      return;
    }

    // Separate by positions
    const gks = this.scannedPlayers.filter(p => p.position === 'GKP');
    const defs = this.scannedPlayers.filter(p => p.position === 'DEF');
    const mids = this.scannedPlayers.filter(p => p.position === 'MID');
    const fwds = this.scannedPlayers.filter(p => p.position === 'FWD');

    // Build starters (1 GKP, up to 5 DEF, up to 5 MID, up to 3 FWD, max 11)
    const starters = [
      ...gks.slice(0, 1),
      ...defs.slice(0, 4),
      ...mids.slice(0, 4),
      ...fwds.slice(0, 2)
    ];

    // Bench: rest of players
    const bench = [
      ...gks.slice(1),
      ...defs.slice(4),
      ...mids.slice(4),
      ...fwds.slice(2)
    ];

    FPLPitch.squad.starters = starters;
    FPLPitch.squad.bench = bench;
    FPLPitch.renderPitch();
    FPLPitch.updateBudgetUI();
    FPLPitch.saveSquadToStorage();

    // Close screenshot modal
    const modalEl = document.getElementById('screenshotModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }

    // Switch to Pitch tab
    const pitchTabBtn = document.querySelector('button[data-bs-target="#pitch-tab-pane"]');
    if (pitchTabBtn) {
      bootstrap.Tab.getOrCreateInstance(pitchTabBtn).show();
    }

    FPLApp.showToast(`Loaded ${this.scannedPlayers.length} players onto your pitch!`, 'success');

    // Open Advice Modal
    this.generateAdviceReport(this.scannedPlayers);
  },

  // Generate Personalized Gameweek Advice Report
  generateAdviceReport(squad) {
    if (!squad || squad.length === 0) return;

    const modalTitle = document.getElementById('advice-modal-title');
    const modalBody = document.getElementById('advice-modal-body');
    if (!modalBody) return;

    if (modalTitle) modalTitle.innerHTML = `<i class="bi bi-robot text-success me-2"></i>Personalized Gameweek Advice Report`;

    // 1. Best Captain & Vice Captain
    const sortedForCap = [...squad].sort((a, b) => b.captaincy_score - a.captaincy_score);
    const topCap = sortedForCap[0];
    const viceCap = sortedForCap[1];

    // 2. Health & Availability Alerts
    const healthAlerts = squad.filter(p => p.status !== 'a');

    // 3. Fixture Traps (Players facing FDR 4 or 5)
    const fixtureTraps = squad.filter(p => p.next_opponent && p.next_opponent.difficulty >= 4);

    // 4. Transfer Priority (Lowest SBS or injured player with tough run)
    const sellTarget = [...squad].sort((a, b) => a.smart_buy_score - b.smart_buy_score)[0];
    let buyTarget = null;
    if (sellTarget) {
      const affordable = FPLApp.data.players.filter(p => 
        p.position === sellTarget.position &&
        p.id !== sellTarget.id &&
        !squad.some(sp => sp.id === p.id) &&
        p.price <= (sellTarget.price + FPLPitch.getRemainingBank()) &&
        p.status === 'a'
      );
      affordable.sort((a, b) => b.smart_buy_score - a.smart_buy_score);
      buyTarget = affordable[0];
    }

    modalBody.innerHTML = `
      <div class="row g-3">
        <!-- 1. CAPTAINCY ADVICE -->
        <div class="col-12">
          <div class="advice-card-highlight">
            <h6 class="fw-bold text-white mb-2"><i class="bi bi-c-circle-fill text-success me-1"></i> Recommended Captaincy</h6>
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <strong class="text-success fs-5">${topCap ? topCap.web_name : 'N/A'}</strong> 
                <span class="text-muted">(${topCap?.team_short})</span> — Captaincy Score: <strong class="text-white">${topCap?.captaincy_score}</strong>
                <div class="small text-muted">Next Match: ${topCap?.next_opponent ? `${topCap.next_opponent.opponent_name} (${topCap.next_opponent.is_home ? 'H' : 'A'})` : 'TBD'}</div>
              </div>
              <div class="text-end">
                <span class="badge bg-info text-dark">Vice-Captain: ${viceCap ? viceCap.web_name : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. SQUAD HEALTH ALERTS -->
        <div class="col-md-6">
          <div class="p-3 rounded bg-dark border border-secondary h-100">
            <h6 class="fw-bold text-white mb-2"><i class="bi bi-bandaid text-danger me-1"></i> Health & Availability</h6>
            ${healthAlerts.length > 0 ? `
              <ul class="list-unstyled small mb-0">
                ${healthAlerts.map(p => `
                  <li class="mb-2 pb-1 border-bottom border-secondary">
                    <div class="d-flex justify-content-between">
                      <strong class="text-danger">${p.web_name}</strong>
                      <span class="badge bg-danger">${p.news || 'Unavailable'}</span>
                    </div>
                  </li>
                `).join('')}
              </ul>
            ` : `
              <p class="small text-success mb-0"><i class="bi bi-check-circle me-1"></i> All players are currently fit with no reported injuries or suspensions.</p>
            `}
          </div>
        </div>

        <!-- 3. FIXTURE TRAP ALERTS -->
        <div class="col-md-6">
          <div class="p-3 rounded bg-dark border border-secondary h-100">
            <h6 class="fw-bold text-white mb-2"><i class="bi bi-exclamation-triangle text-warning me-1"></i> Tough Fixtures This GW</h6>
            ${fixtureTraps.length > 0 ? `
              <div class="small text-muted mb-2">Players facing FDR 4 or 5 opponents:</div>
              <div class="d-flex flex-wrap gap-1">
                ${fixtureTraps.map(p => `
                  <span class="badge bg-danger-subtle text-danger border border-danger">
                    ${p.web_name} (vs ${p.next_opponent.opponent_name})
                  </span>
                `).join('')}
              </div>
            ` : `
              <p class="small text-success mb-0"><i class="bi bi-check-circle me-1"></i> None of your players face difficulty 4 or 5 fixtures this round!</p>
            `}
          </div>
        </div>

        <!-- 4. TOP TRANSFER ADVICE -->
        <div class="col-12">
          <div class="p-3 rounded bg-dark border border-secondary">
            <h6 class="fw-bold text-white mb-2"><i class="bi bi-arrow-left-right text-primary me-1"></i> Priority Transfer Recommendation</h6>
            ${sellTarget && buyTarget ? `
              <div class="row align-items-center small">
                <div class="col-md-5">
                  <div class="p-2 rounded bg-danger-subtle text-white border border-danger">
                    <span class="badge bg-danger">SELL</span> <strong>${sellTarget.web_name}</strong> (${sellTarget.team_short})
                    <div class="text-white-50">SBS: ${sellTarget.smart_buy_score} · Form: ${sellTarget.form}</div>
                  </div>
                </div>
                <div class="col-md-2 text-center my-1 text-success fs-5">
                  <i class="bi bi-arrow-right-circle"></i>
                </div>
                <div class="col-md-5">
                  <div class="p-2 rounded bg-success-subtle text-white border border-success">
                    <span class="badge bg-success text-dark">BUY</span> <strong>${buyTarget.web_name}</strong> (${buyTarget.team_short})
                    <div class="text-white-50">SBS: ${buyTarget.smart_buy_score} · Form: ${buyTarget.form}</div>
                  </div>
                </div>
              </div>
              <div class="mt-2 text-end">
                <button class="btn btn-sm btn-fpl-green py-1" onclick="FPLStrategy.applyTransfer(${sellTarget.id}, ${buyTarget.id}); bootstrap.Modal.getInstance(document.getElementById('adviceModal')).hide();">
                  <i class="bi bi-check-circle"></i> Execute This Transfer
                </button>
              </div>
            ` : `
              <p class="small text-muted mb-0">No immediate high-urgency transfers required.</p>
            `}
          </div>
        </div>
      </div>
    `;

    const adviceModal = new bootstrap.Modal(document.getElementById('adviceModal'));
    adviceModal.show();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  FPLAdvisor.init();
});
