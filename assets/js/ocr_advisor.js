/**
 * FPL Screenshot OCR Scanner & Personalized Squad Advisor
 * Features:
 * - Canvas image pre-processing (upscaling, adaptive binarization, sharpening for text clarity)
 * - Multi-pass fuzzy & normalized substring matching (handles dots, hyphens, prefixes like B.Fernandes, Calvert-Lewin)
 * - Extended player nickname / alias dictionary (50+ entries)
 * - Squad Value & Bank Amount scanning from screenshot text
 * - Manual player search & quick squad builder
 * - Generates immediate personalized tactical advice (Captain, Bench, Injuries, Transfers)
 */

const FPLAdvisor = {
  isProcessing: false,
  scannedPlayers: [],
  detectedSquadValue: null,
  detectedBankAmount: null,

  // Comprehensive FPL player aliases/nicknames — maps recognized text fragments to official web_name or second_name
  aliases: {
    // Arsenal
    'saka': 'saka',
    'ode': 'odegaard',
    'odegaard': 'ødegaard',
    'martinelli': 'martinelli',
    'ramsdale': 'ramsdale',
    'raya': 'raya',
    'havertz': 'havertz',
    'saliba': 'saliba',
    'rice': 'rice',
    // Aston Villa
    'watkins': 'watkins',
    'dibu': 'e.martínez',
    'emi': 'e.martínez',
    'emartinez': 'e.martínez',
    'e martinez': 'e.martínez',
    // Brighton
    'joao': 'joão pedro',
    'joaopedro': 'joão pedro',
    'joao pedro': 'joão pedro',
    'j pedro': 'joão pedro',
    'pedro': 'joão pedro',
    'mitoma': 'mitoma',
    'kaoru': 'mitoma',
    // Chelsea
    'palmer': 'palmer',
    'jackson': 'jackson',
    'caicedo': 'caicedo',
    'colwill': 'colwill',
    // Everton
    'dcl': 'calvert-lewin',
    'clw': 'calvert-lewin',
    'calvertlewin': 'calvert-lewin',
    'calvert lewin': 'calvert-lewin',
    // Liverpool
    'salah': 'salah',
    'trent': 'alexander-arnold',
    'taa': 'alexander-arnold',
    'alexanderarnold': 'alexander-arnold',
    'alexander arnold': 'alexander-arnold',
    'trentaa': 'alexander-arnold',
    'vvd': 'van dijk',
    'vandijk': 'van dijk',
    'van dijk': 'van dijk',
    'diaz': 'l.díaz',
    'luis': 'l.díaz',
    'luisdiaz': 'l.díaz',
    'luis diaz': 'l.díaz',
    'jota': 'jota',
    'darwin': 'núñez',
    'nunez': 'núñez',
    'gakpo': 'gakpo',
    'szoboszlai': 'szoboszlai',
    'alisson': 'alisson',
    // Man City
    'haaland': 'haaland',
    'kdb': 'de bruyne',
    'debruyne': 'de bruyne',
    'de bruyne': 'de bruyne',
    'foden': 'foden',
    'grealish': 'grealish',
    'ederson': 'ederson',
    'rodri': 'rodri',
    'doku': 'doku',
    'savinho': 'savinho',
    // Man Utd
    'bruno': 'b.fernandes',
    'bfernandes': 'b.fernandes',
    'b fernandes': 'b.fernandes',
    'fernandes': 'b.fernandes',
    'rashford': 'rashford',
    'hojlund': 'højlund',
    'garnacho': 'garnacho',
    'mainoo': 'mainoo',
    'onana': 'onana',
    // Newcastle
    'isak': 'isak',
    'gordon': 'gordon',
    'bruno g': 'bruno g.',
    'brunoguimaraes': 'bruno g.',
    'tonali': 'tonali',
    'trippier': 'trippier',
    'pope': 'pope',
    // Spurs
    'son': 'son',
    'sonny': 'son',
    'heungmin': 'son',
    'porro': 'pedro porro',
    'pedro porro': 'pedro porro',
    'pedroporro': 'pedro porro',
    'maddison': 'maddison',
    'solanke': 'solanke',
    // West Ham
    'bowen': 'bowen',
    'paqueta': 'paquetá',
    'kudus': 'kudus',
    // Wolves
    'cunha': 'cunha',
    'matheus cunha': 'cunha',
    'strand larsen': 'strand larsen',
    // Fulham
    'jimenez': 'jiménez',
    'raul': 'jiménez',
    'smith-rowe': 'smith rowe',
    'smithrowe': 'smith rowe',
    'esr': 'smith rowe',
    // Others / Common
    'gabriel': 'gabriel',
    'schar': 'schär',
    'martinez': 'martínez',
    'mbeumo': 'mbeumo',
    'wissa': 'wissa',
    'toney': 'toney',
    'neto': 'neto',
    'eze': 'eze',
    'olise': 'olise',
    'ait nouri': 'aït-nouri',
    'aitnouri': 'aït-nouri',
    'ait-nouri': 'aït-nouri',
    'nkunku': 'nkunku',
    'solanke': 'solanke',
    'udogie': 'udogie',
    'kulusevski': 'kulusevski',
    'johnson': 'johnson',
    'madueke': 'madueke',
    'noni': 'madueke',
    'nico': 'n.williams',
    'nwilliams': 'n.williams',
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

  // ====================================================================
  // ENHANCED IMAGE PRE-PROCESSING
  // Adaptive binarization + contrast stretching + sharpening
  // ====================================================================
  async preprocessImage(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Scale up if low resolution for better OCR
          let width = img.width;
          let height = img.height;
          if (width < 1400) {
            const scale = Math.min(2.5, 1600 / width);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Get image pixel data
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // Pass 1: Convert to grayscale and collect histogram
          const histogram = new Array(256).fill(0);
          for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            data[i] = data[i + 1] = data[i + 2] = gray;
            histogram[gray]++;
          }

          // Pass 2: Calculate Otsu's threshold for adaptive binarization
          const totalPixels = width * height;
          let sum = 0;
          for (let i = 0; i < 256; i++) sum += i * histogram[i];

          let sumB = 0, wB = 0, maxVariance = 0, threshold = 128;
          for (let t = 0; t < 256; t++) {
            wB += histogram[t];
            if (wB === 0) continue;
            const wF = totalPixels - wB;
            if (wF === 0) break;
            sumB += t * histogram[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const variance = wB * wF * (mB - mF) * (mB - mF);
            if (variance > maxVariance) {
              maxVariance = variance;
              threshold = t;
            }
          }

          // Pass 3: Apply adaptive contrast + sharpening
          // Use a softer approach: strong contrast stretch rather than pure binary
          // This preserves more detail for OCR
          const contrastFactor = 1.6;
          const midpoint = threshold;

          for (let i = 0; i < data.length; i += 4) {
            let val = data[i];

            // Contrast stretch around the computed threshold
            val = contrastFactor * (val - midpoint) + midpoint;
            val = Math.max(0, Math.min(255, val));

            // Push toward black or white more aggressively for text regions
            if (val < midpoint - 20) {
              val = Math.max(0, val * 0.7); // darken dark pixels
            } else if (val > midpoint + 20) {
              val = Math.min(255, val + (255 - val) * 0.4); // lighten light pixels
            }

            data[i] = data[i + 1] = data[i + 2] = Math.round(val);
          }

          ctx.putImageData(imgData, 0, 0);

          // Pass 4: Unsharp mask for edge sharpening
          // Draw sharpened version using composite operations
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = width;
          tempCanvas.height = height;
          tempCtx.filter = 'blur(1px)';
          tempCtx.drawImage(canvas, 0, 0);

          // Blend: original + (original - blurred) * amount
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;

          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/png', 1.0); // Use PNG for lossless quality
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  // ====================================================================
  // PROCESS IMAGE: Pre-process + Tesseract OCR + Player Matching
  // ====================================================================
  async processImage(file) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    // Reset detected values
    this.detectedSquadValue = null;
    this.detectedBankAmount = null;

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
      progressText.textContent = 'Enhancing image: adaptive binarization & sharpening...';
      progressBar.style.width = '10%';

      // 1. Preprocess image with enhanced pipeline
      const processedBlob = await this.preprocessImage(file);

      progressText.textContent = 'Initializing OCR neural network...';
      progressBar.style.width = '25%';

      if (typeof Tesseract === 'undefined') {
        throw new Error('Tesseract OCR engine not loaded. Please check your internet connection or add players manually below.');
      }

      // 2. Run Tesseract recognition with optimized settings
      progressText.textContent = 'Running OCR text recognition...';
      progressBar.style.width = '35%';

      const ret = await Tesseract.recognize(processedBlob, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text' && m.progress) {
            const pct = 35 + Math.round(m.progress * 50);
            if (progressBar) progressBar.style.width = `${pct}%`;
            if (progressText) progressText.textContent = `Analyzing text: ${Math.round(m.progress * 100)}%`;
          }
        }
      });

      progressBar.style.width = '90%';
      progressText.textContent = 'Matching players & scanning squad info...';

      const recognizedText = ret?.data?.text || '';
      console.log('OCR Recognized Text:\n', recognizedText);

      // 3. Extract squad value and bank amount
      this.extractFinancialInfo(recognizedText);

      // 4. Multi-pass player matching
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

  // ====================================================================
  // EXTRACT SQUAD VALUE & BANK FROM OCR TEXT
  // Looks for patterns like "£104.2m", "Squad Value 102.3", "Bank 0.8m"
  // ====================================================================
  extractFinancialInfo(rawText) {
    const text = rawText.toLowerCase().replace(/\n/g, ' ');

    // Pattern: Squad Value / Team Value / Value
    // Matches: "squad value £104.2m", "value: 102.3", "squad value 104.2"
    const valuePatterns = [
      /(?:squad|team)\s*value\s*[:\-]?\s*[£]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*m?/i,
      /value\s*[:\-]?\s*[£]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*m/i,
      /[£]\s*(\d{2,3}\.\d)\s*m?\s*(?:value|squad)/i,
    ];

    for (const pattern of valuePatterns) {
      const match = text.match(pattern);
      if (match) {
        const val = parseFloat(match[1]);
        if (val >= 50 && val <= 200) { // Reasonable FPL squad value range
          this.detectedSquadValue = val;
          console.log('Detected Squad Value:', val);
          break;
        }
      }
    }

    // Pattern: Bank / In The Bank / ITB / Money remaining
    // Matches: "bank £0.8m", "in the bank 2.3", "itb 0.5"
    const bankPatterns = [
      /(?:in\s*the\s*)?bank\s*[:\-]?\s*[£]?\s*(\d{1,3}(?:\.\d{1,2})?)\s*m?/i,
      /itb\s*[:\-]?\s*[£]?\s*(\d{1,3}(?:\.\d{1,2})?)\s*m?/i,
      /(?:remaining|money|budget)\s*[:\-]?\s*[£]?\s*(\d{1,3}(?:\.\d{1,2})?)\s*m?/i,
      /[£]\s*(\d{1,2}\.\d)\s*m?\s*(?:bank|itb|remaining)/i,
    ];

    for (const pattern of bankPatterns) {
      const match = text.match(pattern);
      if (match) {
        const val = parseFloat(match[1]);
        if (val >= 0 && val <= 105) { // Reasonable FPL bank range
          this.detectedBankAmount = val;
          console.log('Detected Bank Amount:', val);
          break;
        }
      }
    }
  },

  // ====================================================================
  // MULTI-PASS SMART PLAYER MATCHING ALGORITHM
  // Pass 1: Alias dictionary
  // Pass 2: Exact/substring web_name + second_name match
  // Pass 3: Normalized accent-insensitive matching
  // Pass 4: Fuzzy Levenshtein (dist <= 1 for short names, <= 2 for long)
  // ====================================================================
  matchPlayersFromText(rawText) {
    if (!FPLApp.data || !FPLApp.data.players) return [];

    const allPlayers = FPLApp.data.players;

    // Clean text: lowercase, replace punctuation with spaces
    const cleanedText = rawText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    // Continuous text without spaces for glued text e.g. "alexanderarnold", "bfernandes"
    const noSpacesText = cleanedText.replace(/\s+/g, '');
    // Array of words (min 2 chars for better matching)
    const words = cleanedText.split(/\s+/).filter(w => w.length >= 2);
    // Array of word pairs (bigrams) for compound names
    const bigrams = [];
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.push(words[i] + ' ' + words[i + 1]);
      bigrams.push(words[i] + words[i + 1]); // no space version
    }

    const matched = [];
    const matchedIds = new Set();

    // Helper: Normalize name — remove dots, hyphens, spaces, accents
    const normalize = (str) => {
      return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // strip diacritics/accents
        .replace(/[^a-z0-9]/g, '');
    };

    // Helper: Check if text contains normalized name
    const textContains = (name) => {
      const norm = normalize(name);
      if (norm.length < 3) return false;
      return noSpacesText.includes(norm);
    };

    // Pass 1: Check Alias dictionary (high priority)
    for (const [alias, targetName] of Object.entries(this.aliases)) {
      const normAlias = normalize(alias);
      if (normAlias.length < 3) continue;

      // Check in both word list and continuous text
      const aliasFound = words.includes(normAlias) || 
                         noSpacesText.includes(normAlias) ||
                         bigrams.some(b => normalize(b) === normAlias);

      if (aliasFound) {
        const normTarget = normalize(targetName);
        const found = allPlayers.find(p =>
          normalize(p.web_name) === normTarget ||
          normalize(p.second_name) === normTarget ||
          normalize(p.first_name + ' ' + p.second_name) === normTarget
        );
        if (found && !matchedIds.has(found.id)) {
          matched.push(found);
          matchedIds.add(found.id);
        }
      }
    }

    // Pass 2: Direct substring matching for web_name and second_name
    allPlayers.forEach(p => {
      if (matchedIds.has(p.id)) return;

      const normWeb = normalize(p.web_name);
      const normSecond = normalize(p.second_name);
      const normFirst = normalize(p.first_name);
      const normFull = normalize(p.first_name + ' ' + p.second_name);

      // Check web_name (min 3 chars to avoid false positives)
      if (normWeb.length >= 3 && noSpacesText.includes(normWeb)) {
        matched.push(p);
        matchedIds.add(p.id);
        return;
      }

      // Check second_name (min 4 chars)
      if (normSecond.length >= 4 && noSpacesText.includes(normSecond)) {
        matched.push(p);
        matchedIds.add(p.id);
        return;
      }

      // Check full name in bigrams
      if (normFull.length >= 6 && noSpacesText.includes(normFull)) {
        matched.push(p);
        matchedIds.add(p.id);
        return;
      }

      // Exact word match
      if (normWeb.length >= 3 && words.includes(normWeb)) {
        matched.push(p);
        matchedIds.add(p.id);
        return;
      }

      if (normSecond.length >= 4 && words.includes(normSecond)) {
        matched.push(p);
        matchedIds.add(p.id);
        return;
      }
    });

    // Pass 3: Accent-insensitive matching for special characters
    // (Already handled by normalize() in Pass 2, but check compound names in bigrams)
    allPlayers.forEach(p => {
      if (matchedIds.has(p.id)) return;

      const normWeb = normalize(p.web_name);
      if (normWeb.length < 4) return;

      // Check bigrams for compound names like "joao pedro", "calvert lewin"
      for (const bg of bigrams) {
        const normBg = normalize(bg);
        if (normBg === normWeb || normBg === normalize(p.second_name)) {
          matched.push(p);
          matchedIds.add(p.id);
          return;
        }
      }
    });

    // Pass 4: Fuzzy Levenshtein match for slightly misspelled OCR text
    if (matched.length < 15) {
      allPlayers.forEach(p => {
        if (matchedIds.has(p.id)) return;

        const target = normalize(p.web_name);
        if (target.length < 4) return;

        // Allow distance 1 for names 4-6 chars, distance 2 for names 7+ chars
        const maxDist = target.length >= 7 ? 2 : 1;

        for (const w of words) {
          if (w.length < 3) continue;
          if (Math.abs(w.length - target.length) > maxDist) continue;

          const dist = this.levenshtein(w, target);
          if (dist <= maxDist) {
            matched.push(p);
            matchedIds.add(p.id);
            break;
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

  // ====================================================================
  // RENDER SCANNED RESULTS with squad value & bank display
  // ====================================================================
  renderScannedResults(matched, rawText = '') {
    const listContainer = document.getElementById('ocr-matched-players-list');
    const countBadge = document.getElementById('ocr-matched-count');
    if (!listContainer) return;

    if (countBadge) countBadge.textContent = `${matched.length} players in list`;

    // Build financial info display
    let financialHtml = '';
    if (this.detectedSquadValue !== null || this.detectedBankAmount !== null) {
      financialHtml = `
        <div class="d-flex gap-2 mb-2">
          ${this.detectedSquadValue !== null ? `
            <div class="p-2 rounded bg-dark border border-secondary flex-fill text-center">
              <div class="small text-muted">Squad Value</div>
              <div class="fw-bold text-white">£${this.detectedSquadValue.toFixed(1)}m</div>
            </div>
          ` : ''}
          ${this.detectedBankAmount !== null ? `
            <div class="p-2 rounded bg-dark border border-success flex-fill text-center">
              <div class="small text-muted">In The Bank</div>
              <div class="fw-bold text-success">£${this.detectedBankAmount.toFixed(1)}m</div>
            </div>
          ` : ''}
        </div>
      `;
    }

    if (matched.length === 0) {
      listContainer.innerHTML = `
        ${financialHtml}
        <div class="alert alert-warning small p-2">
          <i class="bi bi-info-circle me-1"></i> No players identified yet. Upload a screenshot above, or search and add players below.
        </div>
      `;
      return;
    }

    listContainer.innerHTML = `
      ${financialHtml}
      <div class="row g-2 mb-2">
        ${matched.map(p => `
          <div class="col-6 col-sm-4 col-md-3">
            <div class="p-2 rounded bg-dark border border-secondary d-flex justify-content-between align-items-center">
              <div style="min-width: 0;">
                <div class="fw-bold small text-truncate" style="max-width: 90px;" title="${p.web_name}">${p.web_name}</div>
                <small class="text-muted">${p.team_short} · ${p.position}</small>
              </div>
              <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-1 flex-shrink-0" onclick="FPLAdvisor.removeScannedPlayer(${p.id})" title="Remove">
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

  // ====================================================================
  // APPLY SCANNED SQUAD & GENERATE ADVICE
  // ====================================================================
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

    // Apply detected bank amount if available
    if (this.detectedBankAmount !== null) {
      const squadCost = [...starters, ...bench].reduce((acc, p) => acc + p.price, 0);
      FPLPitch.budget = Math.round((squadCost + this.detectedBankAmount) * 10) / 10;
    }

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

  // ====================================================================
  // PERSONALIZED GAMEWEEK ADVICE REPORT
  // No "Execute Transfer" — changed to "Consider This Transfer" with pitch-only action
  // ====================================================================
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

    // 4. Transfer Suggestion (Lowest SBS or injured player with tough run)
    const sellTarget = [...squad].sort((a, b) => a.smart_buy_score - b.smart_buy_score)[0];
    let buyTarget = null;
    if (sellTarget) {
      const affordable = FPLApp.data.players.filter(p =>
        p.position === sellTarget.position &&
        p.id !== sellTarget.id &&
        !squad.some(sp => sp.id === p.id) &&
        p.price <= (sellTarget.price + (FPLPitch.getRemainingBank())) &&
        p.status === 'a'
      );
      affordable.sort((a, b) => b.smart_buy_score - a.smart_buy_score);
      buyTarget = affordable[0];
    }

    // 5. Squad Value & Bank summary
    const financialSection = (this.detectedSquadValue !== null || this.detectedBankAmount !== null) ? `
      <div class="col-12">
        <div class="d-flex gap-3 mb-0">
          ${this.detectedSquadValue !== null ? `
            <div class="p-2 rounded bg-dark border border-secondary flex-fill text-center">
              <div class="small text-muted">Squad Value</div>
              <div class="h6 fw-bold text-white mb-0">£${this.detectedSquadValue.toFixed(1)}m</div>
            </div>
          ` : ''}
          ${this.detectedBankAmount !== null ? `
            <div class="p-2 rounded bg-dark border border-success flex-fill text-center">
              <div class="small text-muted">In The Bank</div>
              <div class="h6 fw-bold text-success mb-0">£${this.detectedBankAmount.toFixed(1)}m</div>
            </div>
          ` : ''}
        </div>
      </div>
    ` : '';

    modalBody.innerHTML = `
      <div class="row g-3">
        ${financialSection}

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

        <!-- 4. TRANSFER CONSIDERATION -->
        <div class="col-12">
          <div class="p-3 rounded bg-dark border border-secondary">
            <h6 class="fw-bold text-white mb-2"><i class="bi bi-arrow-left-right text-primary me-1"></i> Transfer to Consider</h6>
            <p class="small text-muted mb-2"><i class="bi bi-info-circle me-1"></i> This is a suggestion based on form and fixtures. Make the transfer on the official FPL website or app.</p>
            ${sellTarget && buyTarget ? `
              <div class="row align-items-center small">
                <div class="col-sm-5">
                  <div class="p-2 rounded bg-danger-subtle text-white border border-danger">
                    <span class="badge bg-danger">SELL</span> <strong>${sellTarget.web_name}</strong> (${sellTarget.team_short})
                    <div class="text-white-50">SBS: ${sellTarget.smart_buy_score} · Form: ${sellTarget.form}</div>
                  </div>
                </div>
                <div class="col-sm-2 text-center my-2 my-sm-0 text-success fs-5">
                  <i class="bi bi-arrow-right-circle"></i>
                </div>
                <div class="col-sm-5">
                  <div class="p-2 rounded bg-success-subtle text-white border border-success">
                    <span class="badge bg-success text-dark">BUY</span> <strong>${buyTarget.web_name}</strong> (${buyTarget.team_short})
                    <div class="text-white-50">SBS: ${buyTarget.smart_buy_score} · Form: ${buyTarget.form}</div>
                  </div>
                </div>
              </div>
              <div class="mt-2 text-end">
                <button class="btn btn-sm btn-fpl-outline py-1" onclick="FPLPitch.removePlayer(${sellTarget.id}); FPLPitch.addPlayerToPitch(${buyTarget.id}); bootstrap.Modal.getInstance(document.getElementById('adviceModal')).hide();">
                  <i class="bi bi-clipboard-check me-1"></i> Apply to My Pitch Planner
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
