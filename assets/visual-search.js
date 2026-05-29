document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('[data-visual-search]');
  if (!container) return;

  const DEMO_PRODUCTS = [
    { sku: 'ENT-DIA-RING-59859184', title: 'Entwined Diamond Ring with Pavé Band', price: '₹ 48,500', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop&auto=format&q=80', url: '#', match: '94% Match' },
    { sku: 'HYD-007B-1',             title: 'Hyderabad Heritage Drop Earrings',      price: '₹ 32,200', image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=600&fit=crop&auto=format&q=80', url: '#', match: '91% Match' },
    { sku: 'DEL-554C',               title: 'Delhi Crescent Pearl Studs',            price: '₹ 28,900', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop&auto=format&q=80', url: '#', match: '88% Match' },
    { sku: 'TNA-007F-2',             title: 'Tanjore Floral Jhumka',                 price: '₹ 41,750', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop&auto=format&q=80', url: '#', match: '86% Match' },
    { sku: 'MH-417-1',               title: 'Mughal Heritage Diamond Drops',         price: '₹ 67,500', image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&h=600&fit=crop&auto=format&q=80', url: '#', match: '83% Match' },
    { sku: 'HYD-011E-2',             title: 'Hyderabad Polki Earrings',              price: '₹ 89,300', image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&h=600&fit=crop&auto=format&q=80', url: '#', match: '81% Match' },
    { sku: 'AHM-554B-1',             title: 'Ahmedabad Antique Chandbali',           price: '₹ 54,000', image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=600&fit=crop&auto=format&q=80', url: '#', match: '78% Match' },
    { sku: 'ST-1376',                title: 'Solitaire Diamond Studs',               price: '₹ 1,12,500', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop&auto=format&q=80', url: '#', match: '76% Match' },
    { sku: 'JP-RING-2240',           title: 'Jaipur Emerald Cocktail Ring',          price: '₹ 76,800', image: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&h=600&fit=crop&auto=format&q=80', url: '#', match: '74% Match' },
    { sku: 'KOL-NEK-118',            title: 'Kolkata Filigree Necklace',             price: '₹ 1,32,000', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&h=600&fit=crop&auto=format&q=80', url: '#', match: '72% Match' },
    { sku: 'BAN-BRAC-09',            title: 'Bangalore Twisted Gold Bangle',         price: '₹ 58,400', image: 'https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=600&h=600&fit=crop&auto=format&q=80', url: '#', match: '69% Match' },
    { sku: 'CHN-PEN-451',            title: 'Chennai Temple Pendant',                price: '₹ 38,750', image: 'https://images.unsplash.com/photo-1599643478517-c2c0c33c4a3a?w=600&h=600&fit=crop&auto=format&q=80', url: '#', match: '67% Match' },
  ];

  const UPLOAD_URL_ENDPOINT = container.dataset.uploadEndpoint || 'https://gq3rnf86w4.execute-api.ap-south-1.amazonaws.com/get-upload-url';
  const AI_SEARCH_ENDPOINT  = container.dataset.searchEndpoint || 'http://13.203.186.4:8000/search-by-url';
  const AI_TEST_IMAGE_URL   = 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcT0plpb03JNSm2H2m4eGMEBX40a1wPbALG1x79d9sYYh-QUV6EihMt2ZGX1yEIOOegwu6VcdLzlgb76Uk81fV5Aru90bg1cT_tJueCdJ9MyLz3FE1MyvnTJAAA';

  const MAX_FILE_BYTES      = 10 * 1024 * 1024;
  const ALLOWED_MIME_PREFIX = 'image/';
  const INIT_TIMEOUT_MS     = 15000;
  const UPLOAD_STALL_MS     = 30000;
  const AI_TIMEOUT_MS       = 65000;
  const COLD_START_HINT_MS  = 5000;
  const RETRY_BACKOFF_MS    = 1500;

  const fileInput       = container.querySelector('[data-vs-file-input]');
  const uploadText      = container.querySelector('[data-vs-upload-text]');
  const preview         = container.querySelector('[data-vs-preview]');
  const previewImg      = container.querySelector('[data-vs-preview-img]');
  const removeBtn       = container.querySelector('[data-vs-remove]');
  const searchBtn       = container.querySelector('[data-vs-search]');
  const loadingEl       = container.querySelector('[data-vs-loading]');
  const loadingMessage  = container.querySelector('[data-vs-loading-message]');
  const progressEl      = container.querySelector('[data-vs-progress]');
  const progressBar     = container.querySelector('[data-vs-progress-bar]');
  const errorEl         = container.querySelector('[data-vs-error]');
  const errorMessageEl  = container.querySelector('[data-vs-error-message]');
  const errorRetryBtn   = container.querySelector('[data-vs-error-retry]');
  const errorDismissBtn = container.querySelector('[data-vs-error-dismiss]');
  const resultsEl       = container.querySelector('[data-vs-results]');
  const grid            = container.querySelector('[data-vs-grid]');
  const slider          = container.querySelector('[data-vs-count]');
  const dropzone        = container.querySelector('[data-vs-dropzone]');

  let selectedFile           = null;
  let activeUploadController = null;
  let activeSearchController = null;
  let uploadPromise          = null;
  let uploadedBlueprint      = null;
  let uploadedMime           = null;
  let lastError              = null;
  let lastUploadError        = null;

  // ─── Generic helpers ───
  const combineSignals = (...signals) => {
    const filtered = signals.filter(Boolean);
    if (filtered.length === 0) return undefined;
    if (filtered.length === 1) return filtered[0];
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
      return AbortSignal.any(filtered);
    }
    const ctrl = new AbortController();
    for (const s of filtered) {
      if (s.aborted) { ctrl.abort(s.reason); break; }
      s.addEventListener('abort', () => ctrl.abort(s.reason), { once: true });
    }
    return ctrl.signal;
  };

  const timeoutSignal = (ms) => {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      return AbortSignal.timeout(ms);
    }
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(new DOMException('Timed out', 'TimeoutError')), ms);
    return ctrl.signal;
  };

  const withRetry = async (fn, { maxAttempts = 2, isRetryable, baseDelayMs = RETRY_BACKOFF_MS, signal } = {}) => {
    let lastErr;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(attempt);
      } catch (err) {
        lastErr = err;
        if (err.name === 'AbortError') throw err;
        if (attempt === maxAttempts) break;
        if (isRetryable && !isRetryable(err)) break;
        const delay = baseDelayMs * attempt;
        console.log(`[visual-search] retrying after ${delay}ms (attempt ${attempt + 1}/${maxAttempts}) due to:`, err.message);
        await new Promise((resolve) => {
          const t = setTimeout(resolve, delay);
          signal?.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
        });
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      }
    }
    throw lastErr;
  };

  // ─── Error UI helpers ───
  const showError = (message, { retry } = {}) => {
    lastError = { message, retry: retry || null };
    if (errorMessageEl) errorMessageEl.textContent = message;
    if (errorRetryBtn) errorRetryBtn.hidden = !retry;
    errorEl.hidden = false;
    console.warn('[visual-search] error shown:', message);
  };

  const hideError = () => {
    lastError = null;
    errorEl.hidden = true;
    if (errorRetryBtn) errorRetryBtn.hidden = true;
  };

  // ─── Classify errors into user-facing messages ───
  const classifyError = (err, stage) => {
    if (err instanceof TypeError && /fetch|network|load/i.test(err.message)) {
      return { message: 'Network problem. Please check your connection and try again.', retryable: true };
    }
    if (err.name === 'TimeoutError') {
      return { message: stage === 'ai' ? 'Search took too long. Please try again.' : 'Request timed out. Please try again.', retryable: true };
    }
    if (err.status === 429 || /\b429\b/.test(err.message || '')) {
      return { message: 'Too many requests. Please wait a moment and try again.', retryable: true };
    }
    if (err.status === 503 || /\b503\b/.test(err.message || '')) {
      return { message: 'Search service is temporarily unavailable. Please try again in a moment.', retryable: true };
    }
    if (err.status === 413 || /EntityTooLarge/i.test(err.message || '')) {
      return { message: 'Image too large. Please choose one under 10 MB.', retryable: false };
    }
    if (/SignatureDoesNotMatch/i.test(err.message || '')) {
      return { message: 'Upload signature was rejected. Please pick the image again.', retryable: false };
    }
    if (/RequestExpired|presigned|expired/i.test(err.message || '')) {
      return { message: "Upload link expired. We'll re-upload your image now.", retryable: true };
    }
    if (err.status >= 500) {
      return { message: 'Server error. Please try again.', retryable: true };
    }
    if (err.status >= 400) {
      return { message: stage === 'ai' ? 'Could not analyse this image. Please try another.' : 'Upload was rejected. Please try a different image.', retryable: false };
    }
    return { message: 'Something went wrong. Please try again.', retryable: true };
  };

  // ─── STEP 1: Initialize — fetch the upload blueprint from our Lambda ───
  const getUploadBlueprint = async (file, mimeType, signal) => {
    const params = new URLSearchParams({ filename: file.name, content_type: mimeType });
    const fetchSignal = combineSignals(signal, timeoutSignal(INIT_TIMEOUT_MS));
    const res = await fetch(`${UPLOAD_URL_ENDPOINT}?${params}`, { signal: fetchSignal });
    if (!res.ok) {
      const body = await res.text();
      const err = new Error(`Initialize HTTP ${res.status}: ${body.slice(0, 200)}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    if (!data.upload_url) {
      throw new Error(`Blueprint missing "upload_url". Got: ${Object.keys(data).join(', ')}`);
    }
    return {
      url: data.upload_url,
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      s3Key: data.s3_key ?? null,
      imageUrl: data.image_url ?? null,
    };
  };

  // ─── STEP 2: Upload — bare HTTP, blueprint-driven, with progress + abort + stall watchdog ───
  const uploadToCloud = (file, blueprint, onProgress, signal) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let stallTimer = null;
    let lastLoaded = 0;
    let lastProgressAt = Date.now();

    const cleanup = () => {
      if (stallTimer) { clearInterval(stallTimer); stallTimer = null; }
    };
    const failWith = (error) => { cleanup(); reject(error); };

    xhr.open(blueprint.method, blueprint.url);
    for (const [name, value] of Object.entries(blueprint.headers ?? {})) {
      xhr.setRequestHeader(name, value);
    }
    if (signal) {
      if (signal.aborted) {
        const err = new Error('Upload aborted');
        err.name = 'AbortError';
        return reject(err);
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      if (e.loaded > lastLoaded) {
        lastLoaded = e.loaded;
        lastProgressAt = Date.now();
      }
    };

    stallTimer = setInterval(() => {
      if (Date.now() - lastProgressAt > UPLOAD_STALL_MS) {
        xhr.abort();
        const err = new Error(`Upload stalled — no progress for ${UPLOAD_STALL_MS}ms`);
        err.name = 'TimeoutError';
        failWith(err);
      }
    }, 5000);

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      const body = xhr.responseText || '';
      const err = new Error(`Upload HTTP ${xhr.status}: ${body.slice(0, 200)}`);
      err.status = xhr.status;
      err.responseBody = body;
      reject(err);
    };
    xhr.onerror = () => failWith(new TypeError('Network error during upload'));
    xhr.onabort = () => {
      cleanup();
      const err = new Error('Upload aborted');
      err.name = 'AbortError';
      reject(err);
    };
    xhr.send(file);
  });

  // ─── STEP 3: Search — call AI pipeline with the uploaded image URL ───
  const searchByImage = async (imageUrl, category, topK, signal) => {
    const fetchSignal = combineSignals(signal, timeoutSignal(AI_TIMEOUT_MS));
    const res = await fetch(AI_SEARCH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, category, top_k: topK }),
      signal: fetchSignal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const err = new Error(`AI HTTP ${res.status}: ${body.slice(0, 200)}`);
      err.status = res.status;
      err.responseBody = body;
      throw err;
    }
    try {
      return await res.json();
    } catch {
      throw new Error('AI pipeline returned malformed JSON');
    }
  };

  // ─── UI helpers ───
  const setLoadingMessage = (text) => {
    if (loadingMessage) loadingMessage.textContent = text;
  };

  const setProgress = (percent) => {
    progressEl.hidden = false;
    progressBar.style.setProperty('--vs-progress', `${percent}%`);
  };

  const resetProgress = () => {
    progressEl.hidden = true;
    progressBar.style.setProperty('--vs-progress', '0%');
  };

  const updateSliderFill = () => {
    const min = Number(slider.min) || 0;
    const max = Number(slider.max) || 100;
    const val = Number(slider.value);
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--vs-slider-fill', `${pct}%`);
  };

  // ─── Background upload: STEPS 1 + 2 — runs the moment a file is picked ───
  const uploadInBackground = async (file, mimeType) => {
    activeUploadController = new AbortController();
    const { signal } = activeUploadController;

    loadingEl.hidden = false;
    resetProgress();
    setLoadingMessage('Preparing upload…');
    hideError();

    const isInitRetryable = (err) =>
      err instanceof TypeError ||
      err.name === 'TimeoutError' ||
      err.status === 429 ||
      err.status === 503 ||
      (err.status >= 500 && err.status < 600);

    const isUploadRetryable = (err) =>
      err instanceof TypeError ||
      err.name === 'TimeoutError' ||
      (err.status >= 500 && err.status < 600) ||
      /RequestExpired/i.test(err.message || '') ||
      /SignatureDoesNotMatch/i.test(err.message || '');

    try {
      console.log('[visual-search] ── STEP 1: initialize');
      const blueprint = await withRetry(
        () => getUploadBlueprint(file, mimeType, signal),
        { maxAttempts: 2, isRetryable: isInitRetryable, signal },
      );
      console.log('[visual-search] blueprint:', {
        url: blueprint.url.split('?')[0],
        method: blueprint.method,
        s3Key: blueprint.s3Key,
        imageUrl: blueprint.imageUrl,
      });
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

      console.log('[visual-search] ── STEP 2: upload');
      setLoadingMessage('Uploading 0%…');
      setProgress(0);

      let currentBlueprint = blueprint;
      await withRetry(
        async (attempt) => {
          if (attempt > 1 && /RequestExpired/i.test(lastUploadError?.message || '')) {
            console.log('[visual-search] presigned URL expired — re-fetching blueprint');
            currentBlueprint = await getUploadBlueprint(file, mimeType, signal);
          }
          try {
            await uploadToCloud(
              file,
              currentBlueprint,
              (pct) => {
                setProgress(pct);
                setLoadingMessage(`Uploading ${pct}%…`);
              },
              signal,
            );
          } catch (err) {
            lastUploadError = err;
            throw err;
          }
        },
        { maxAttempts: 2, isRetryable: isUploadRetryable, signal },
      );

      uploadedBlueprint = currentBlueprint;
      console.log('[visual-search] upload complete:', currentBlueprint.s3Key || currentBlueprint.url.split('?')[0]);
      return currentBlueprint;
    } catch (err) {
      uploadedBlueprint = null;
      if (err.name === 'AbortError') {
        console.log('[visual-search] upload aborted');
      } else {
        console.error('[visual-search] upload FAILED:', err);
        const { message, retryable } = classifyError(err, 'upload');
        showError(message, {
          retry: retryable && selectedFile
            ? () => {
                uploadPromise = uploadInBackground(selectedFile, uploadedMime || selectedFile.type);
              }
            : null,
        });
      }
      throw err;
    } finally {
      loadingEl.hidden = true;
      resetProgress();
      activeUploadController = null;
    }
  };

  // ─── Search click: STEP 3 only ───
  const handleSearch = async () => {
    if (!selectedFile) return;

    hideError();
    activeSearchController?.abort();
    activeSearchController = new AbortController();
    const { signal } = activeSearchController;

    loadingEl.hidden = false;
    searchBtn.disabled = true;

    let coldStartTimer = null;

    try {
      if (!uploadedBlueprint) {
        if (!uploadPromise) {
          showError('Please pick an image first.');
          return;
        }
        setLoadingMessage('Waiting for upload to finish…');
        try {
          await uploadPromise;
        } catch {
          return;
        }
        if (signal.aborted) return;
      }

      if (!uploadedBlueprint) return;

      console.log('[visual-search] ── STEP 3: search');
      setLoadingMessage('Analysing your image…');

      coldStartTimer = setTimeout(() => {
        setLoadingMessage('First search takes a moment while the AI warms up…');
      }, COLD_START_HINT_MS);

      const category = container.querySelector('[data-vs-category]')?.value || 'ring';
      const topK = Number(slider.value) || 10;

      const runSearch = async (imageUrl) => {
        const isAiRetryable = (err) =>
          err instanceof TypeError ||
          err.name === 'TimeoutError' ||
          err.status === 429 ||
          err.status === 503 ||
          (err.status >= 500 && err.status < 600);
        return withRetry(
          () => searchByImage(imageUrl, category, topK, signal),
          { maxAttempts: 2, isRetryable: isAiRetryable, signal },
        );
      };

      let aiData = null;
      try {
        aiData = await runSearch(uploadedBlueprint.imageUrl || AI_TEST_IMAGE_URL);
      } catch (err) {
        if (err.name === 'AbortError') return;

        const expired = /Expired|presigned|S3/i.test(err.responseBody || err.message || '');
        if (expired && uploadedBlueprint.imageUrl && selectedFile) {
          console.log('[visual-search] presigned-GET appears expired — re-uploading');
          setLoadingMessage('Refreshing image link…');
          try {
            uploadedBlueprint = null;
            uploadPromise = uploadInBackground(selectedFile, uploadedMime || selectedFile.type);
            await uploadPromise;
            if (uploadedBlueprint) {
              aiData = await runSearch(uploadedBlueprint.imageUrl || AI_TEST_IMAGE_URL);
            }
          } catch (retryErr) {
            if (retryErr.name !== 'AbortError') {
              const { message, retryable } = classifyError(retryErr, 'ai');
              showError(message, { retry: retryable ? () => handleSearch() : null });
              return;
            }
          }
        } else if (err instanceof TypeError && /fetch|mixed/i.test(err.message)) {
          console.warn('[visual-search] AI call blocked (mixed-content / CORS / network):', err.message);
        } else {
          console.warn('[visual-search] AI call failed:', err.message);
          const { message, retryable } = classifyError(err, 'ai');
          showError(message, { retry: retryable ? () => handleSearch() : null });
          return;
        }
      }

      console.log('[visual-search] AI response:', aiData);
      const aiSkus = aiData?.items?.[0]?.skus ?? null;

      if (aiSkus && aiSkus.length > 0) {
        console.log(`[visual-search] rendering ${aiSkus.length} AI matches`);
        renderAIResults(aiSkus);
      } else if (aiData) {
        showError('No similar items found. Try a different image.');
        renderResults(DEMO_PRODUCTS.slice(0, topK));
      } else {
        console.log('[visual-search] rendering demo fallback');
        renderResults(DEMO_PRODUCTS.slice(0, topK));
      }
    } finally {
      if (coldStartTimer) clearTimeout(coldStartTimer);
      loadingEl.hidden = true;
      searchBtn.disabled = !selectedFile;
      activeSearchController = null;
    }
  };

  // ─── File handling ───
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    hideError();

    if (!file.type || !file.type.startsWith(ALLOWED_MIME_PREFIX)) {
      showError('Please choose an image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      showError('Image too large. Maximum size is 10 MB.');
      return;
    }
    if (file.size === 0) {
      showError('This file appears to be empty. Please choose another.');
      return;
    }

    const mimeType = file.type;

    activeUploadController?.abort();
    activeSearchController?.abort();
    uploadedBlueprint = null;
    uploadedMime = mimeType;
    uploadPromise = null;

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      preview.hidden = false;
      uploadText.textContent = 'Change';
      searchBtn.disabled = false;
    };
    reader.onerror = () => {
      showError('Could not read this image file. Please pick another.', {
        retry: () => fileInput.click(),
      });
      selectedFile = null;
      searchBtn.disabled = true;
    };
    reader.readAsDataURL(file);

    uploadPromise = uploadInBackground(file, mimeType);
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    activeUploadController?.abort();
    activeSearchController?.abort();
    uploadedBlueprint = null;
    uploadedMime = null;
    uploadPromise = null;
    selectedFile = null;
    fileInput.value = '';
    previewImg.src = '';
    preview.hidden = true;
    uploadText.textContent = 'Upload';
    searchBtn.disabled = true;
    hideError();
  };

  // ─── Result rendering ───
  const escapeHtml = (str) => {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  function renderResults(products) {
    grid.innerHTML = '';
    for (const product of products) {
      const card = document.createElement('a');
      card.className = 'vs-card';
      card.href = product.url;
      const fallback = `https://picsum.photos/seed/${encodeURIComponent(product.sku)}/600/600`;
      card.innerHTML = `
        <div class="vs-card-image">
          <img src="${product.image}" alt="${escapeHtml(product.title)}" loading="lazy" width="600" height="600"
               onerror="this.onerror=null;this.src='${fallback}';">
        </div>
        <div class="vs-card-info">
          <p class="vs-card-title">${escapeHtml(product.title)}</p>
          <p class="vs-card-price">${escapeHtml(product.price)}</p>
          <p class="vs-card-sku">SKU: ${escapeHtml(product.sku)}</p>
          <span class="vs-card-match">${escapeHtml(product.match)}</span>
        </div>
      `;
      grid.appendChild(card);
    }
    setTimeout(() => resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  function renderAIResults(skus) {
    grid.innerHTML = '';
    skus.forEach((sku, idx) => {
      const card = document.createElement('a');
      card.className = 'vs-card';
      card.href = '#';
      const matchPct = Math.max(60, 100 - idx * 3);
      const imgUrl = `https://picsum.photos/seed/${encodeURIComponent(sku)}/600/600`;
      card.innerHTML = `
        <div class="vs-card-image">
          <img src="${imgUrl}" alt="${escapeHtml(sku)}" loading="lazy" width="600" height="600">
        </div>
        <div class="vs-card-info">
          <p class="vs-card-title">Visual Match</p>
          <p class="vs-card-sku">SKU: ${escapeHtml(sku)}</p>
          <span class="vs-card-match">${matchPct}% Match</span>
        </div>
      `;
      grid.appendChild(card);
    });
    setTimeout(() => resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  // ─── Bind events ───
  fileInput.addEventListener('change', handleFileSelect);
  removeBtn.addEventListener('click', handleRemove);
  searchBtn.addEventListener('click', handleSearch);
  slider.addEventListener('input', updateSliderFill);
  errorDismissBtn?.addEventListener('click', hideError);
  errorRetryBtn?.addEventListener('click', () => {
    const retry = lastError?.retry;
    hideError();
    if (typeof retry === 'function') retry();
  });

  for (const evt of ['dragenter', 'dragover']) {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });
  }
  for (const evt of ['dragleave', 'drop']) {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
    });
  }
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) processFile(file);
  });

  updateSliderFill();
});
