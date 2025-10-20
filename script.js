	// Landing hero interactions
	const gotoUploadBtn = document.getElementById('goto-upload');
	gotoUploadBtn?.addEventListener('click', () => {
		document.getElementById('drop-zone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	});
(function() {
	const inputEl = document.getElementById('header-input');
	const dropZone = document.getElementById('drop-zone');
	const fileInput = document.getElementById('file-input');
	const resultsEl = document.getElementById('results');
	const hopsTableBody = document.querySelector('#hops-table tbody');
	const fieldsTableBody = document.querySelector('#fields-table tbody');
	const summaryEl = document.getElementById('summary');
	const modal = document.getElementById('results-modal');
	const modeEmlBtn = document.getElementById('mode-eml');
	const modePasteBtn = document.getElementById('mode-paste');
	const hintText = document.getElementById('hint-text');
	const dropSquare = document.getElementById('drop-square');

	// Default theme: dark
	document.documentElement.setAttribute('data-theme', 'dark');

	function parseRawHeaders(raw) {
		// Unfold headers: join wrapped lines (RFC 5322 folding)
		const unfolded = raw.replace(/\r?\n[\t ]+/g, ' ');
		const lines = unfolded.split(/\r?\n/);
		const headers = [];
		let current = null;
		for (const line of lines) {
			if (!line.trim()) continue;
			const sep = line.indexOf(':');
			if (sep > -1) {
				const name = line.slice(0, sep).trim();
				const value = line.slice(sep + 1).trim();
				headers.push({ name, value });
				current = headers[headers.length - 1];
			} else if (current) {
				current.value += ' ' + line.trim();
			}
		}
		return headers;
	}

	function extractReceived(headers) {
		const received = headers.filter(h => /^(received)$/i.test(h.name));
		// RFC order: top-most is last hop; we want chronological
		return received.reverse();
	}

	function parseReceivedLine(value) {
		// Try capture from, by, with, id, for, and the trailing date
		// The date is usually after ';'
		let datePart = null;
		let main = value;
		const semiIdx = value.lastIndexOf(';');
		if (semiIdx !== -1) {
			datePart = value.slice(semiIdx + 1).trim();
			main = value.slice(0, semiIdx).trim();
		}
		const fromMatch = main.match(/\bfrom\s+([^;]+?)\s+(?=by\b|with\b|id\b|for\b|$)/i);
		const byMatch = main.match(/\bby\s+([^;]+?)\s+(?=with\b|id\b|for\b|$)/i);
		const withMatch = main.match(/\bwith\s+([^;]+?)\s+(?=id\b|for\b|$)/i);
		const idMatch = main.match(/\bid\s+([^;]+?)\s+(?=for\b|$)/i);
		const forMatch = main.match(/\bfor\s+([^;]+?)\s*$/i);
		return {
			from: fromMatch ? fromMatch[1].trim() : null,
			by: byMatch ? byMatch[1].trim() : null,
			with: withMatch ? withMatch[1].trim() : null,
			id: idMatch ? idMatch[1].trim() : null,
			for: forMatch ? forMatch[1].trim() : null,
			dateRaw: datePart,
		};
	}

	function parseDateToUtc(dateStr) {
		if (!dateStr) return { date: null, iso: null };
		// Many headers use formats like: Sun, 3 Jul 2011 08:21:06 -0700 (PDT)
		// Remove comments in parentheses to avoid parser confusion
		const cleaned = dateStr.replace(/\([^)]*\)/g, '').trim();
		const d = new Date(cleaned);
		if (isNaN(d.getTime())) return { date: null, iso: null };
		return { date: d, iso: d.toISOString() };
	}

	function computeHopDeltas(hops) {
		let prevTime = null;
		for (const hop of hops) {
			if (hop.time && prevTime) {
				hop.deltaMs = hop.time.getTime() - prevTime.getTime();
			} else {
				hop.deltaMs = null;
			}
			if (hop.time) prevTime = hop.time;
		}
		return hops;
	}

	function humanDelta(ms) {
		if (ms === null || ms === undefined) return '—';
		const sign = ms < 0 ? '-' : '';
		const abs = Math.abs(ms);
		const s = Math.floor(abs / 1000) % 60;
		const m = Math.floor(abs / (60 * 1000)) % 60;
		const h = Math.floor(abs / (60 * 60 * 1000));
		const parts = [];
		if (h) parts.push(`${h}u`);
		if (m || h) parts.push(`${m}m`);
		parts.push(`${s}s`);
		return sign + parts.join(' ');
	}

	function analyze(raw) {
		const headers = parseRawHeaders(raw);
		const receivedLines = extractReceived(headers).map(h => h.value);
		const hopsParsed = receivedLines.map(parseReceivedLine).map((r, idx) => {
			const { date, iso } = parseDateToUtc(r.dateRaw);
			return {
				index: idx + 1,
				from: r.from,
				by: r.by,
				with: r.with,
				id: r.id,
				for: r.for,
				dateRaw: r.dateRaw || '—',
				iso: iso,
				time: date,
			};
		});
		computeHopDeltas(hopsParsed);

		// Compute total span and largest delta
		const times = hopsParsed.map(h => h.time).filter(Boolean).map(d => d.getTime());
		const totalSpan = times.length ? Math.max(...times) - Math.min(...times) : null;
		let maxDelta = -Infinity; let maxIdx = -1;
		for (let i = 0; i < hopsParsed.length; i++) {
			const d = hopsParsed[i].deltaMs;
			if (d !== null && d > maxDelta) { maxDelta = d; maxIdx = i; }
		}

		return { headers, hops: hopsParsed, totalSpan, maxIdx, maxDelta };
	}

	function renderAnalysis(model) {
		resultsEl.hidden = false;
		// Summary (English)
		const total = model.totalSpan != null ? humanDelta(model.totalSpan) : '—';
		const maxLabel = model.maxDelta != null && model.maxDelta !== -Infinity ? humanDelta(model.maxDelta) : '—';
		summaryEl.innerHTML = `Total transit time: <strong>${total}</strong> · Largest delay: <strong>${maxLabel}</strong>${model.maxIdx>=0 && model.hops[model.maxIdx]?.by ? ` at <code>${escapeHtml(model.hops[model.maxIdx].by)}</code>` : ''}`;

		// Hops table
		hopsTableBody.innerHTML = '';
		model.hops.forEach((h, i) => {
			const tr = document.createElement('tr');
			if (i === model.maxIdx) tr.classList.add('highlight');
			const deltaClass = h.deltaMs != null && h.deltaMs > 60_000 ? 'delta-warn' : 'delta-ok';
			tr.innerHTML = `
				<td>${h.index}</td>
				<td>${escapeHtml(h.from || '—')}</td>
				<td>${escapeHtml(h.by || '—')}</td>
				<td>${escapeHtml(h.dateRaw)}${h.iso ? `<br><small>${h.iso}</small>` : ''}</td>
				<td class="${h.deltaMs!=null ? deltaClass : ''}">${h.deltaMs!=null ? humanDelta(h.deltaMs) : '—'}</td>
			`;
			hopsTableBody.appendChild(tr);
		});

		// Fields table: show a subset of key headers
		const wanted = ['From','To','Subject','Date','Message-Id','Return-Path','Reply-To','Delivered-To','Authentication-Results','Received-SPF'];
		const map = new Map();
		for (const h of model.headers) {
			const key = h.name.trim();
			if (wanted.some(w => w.toLowerCase() === key.toLowerCase())) {
				if (!map.has(key)) map.set(key, []);
				map.get(key).push(h.value);
			}
		}
		fieldsTableBody.innerHTML = '';
		for (const [k, values] of map) {
			const tr = document.createElement('tr');
			tr.innerHTML = `<td>${escapeHtml(k)}</td><td>${values.map(v => `<div>${escapeHtml(v)}</div>`).join('')}</td>`;
			fieldsTableBody.appendChild(tr);
		}

		// Authentication-Results focus (SPF/DKIM/DMARC)
		const authStatusEl = document.getElementById('auth-status');
		const authBadgesEl = document.getElementById('auth-badges');
		const authDetailsEl = document.getElementById('auth-details');
		const authHeaders = model.headers.filter(h => /^authentication-results$/i.test(h.name));
		if (authHeaders.length) {
			authStatusEl.hidden = false;
			const parsed = parseAuthResults(authHeaders.map(h => h.value));
			authBadgesEl.innerHTML = '';
			const addBadge = (label, status) => {
				const span = document.createElement('span');
				span.className = `badge ${status}`;
				span.textContent = `${label}: ${status.toUpperCase()}`;
				authBadgesEl.appendChild(span);
			};
			addBadge('SPF', parsed.spf.status);
			addBadge('DKIM', parsed.dkim.overall);
			addBadge('DMARC', parsed.dmarc.status);

			authDetailsEl.innerHTML = '';
		} else {
			authStatusEl.hidden = true;
		}
	}

	function parseAuthResults(values) {
		// Concatenate all auth-results values
		const text = values.join(' \n ');
		// SPF: spf=pass/fail/neutral
		const spfMatch = text.match(/spf=(pass|fail|neutral|softfail|none)/i);
		const spfStatus = spfMatch ? normalizeAuth(spfMatch[1]) : 'neutral';
		// DMARC: dmarc=pass/fail
		const dmarcMatch = text.match(/dmarc=(pass|fail|bestguesspass|none)/i);
		const dmarcStatus = dmarcMatch ? normalizeAuth(dmarcMatch[1]) : 'neutral';
		// DKIM: one or more dkim=pass/fail with domain
		const dkimRegex = /dkim=(pass|fail|neutral|none)(?:\s*\(([^)]*)\))?/ig;
		const signatures = [];
		let m;
		while ((m = dkimRegex.exec(text))) {
			const result = normalizeAuth(m[1]);
			const ctx = m[2] || '';
			const domainMatch = ctx.match(/header\.d=([^;\s)]+)/i);
			signatures.push({ domain: domainMatch ? domainMatch[1] : null, result });
		}
		const overallDkim = signatures.some(s => s.result === 'pass') ? 'pass' : (signatures.some(s => s.result === 'fail') ? 'fail' : 'neutral');
		return { spf: { status: spfStatus }, dmarc: { status: dmarcStatus }, dkim: { overall: overallDkim, signatures } };
	}

	function normalizeAuth(s) {
		s = String(s).toLowerCase();
		if (s === 'bestguesspass') return 'pass';
		if (s === 'softfail') return 'fail';
		return s;
	}

	function escapeHtml(s) {
		return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
	}

	function handleAnalyze() {
		const raw = inputEl.value.trim();
		if (!raw) { resultsEl.hidden = true; return; }
		const model = analyze(raw);
		renderAnalysis(model);
		openModal();
	}

	function handleFiles(files) {
		if (!files || !files.length) return;
		const file = files[0];
		const reader = new FileReader();
		reader.onload = () => {
			const text = String(reader.result || '');
			const headerBlock = extractHeadersFromEml(text) || text;
			inputEl.value = headerBlock;
			handleAnalyze();
		};
		reader.readAsText(file);
	}

	function extractHeadersFromEml(emlText) {
		// Headers end at first blank line (CRLF CRLF). Keep folding intact for parseRawHeaders to handle.
		const idx = emlText.search(/\r?\n\r?\n/);
		if (idx === -1) return null;
		return emlText.slice(0, idx).trimEnd();
	}

	function openModal() {
		if (!modal) return;
		modal.classList.add('show');
		modal.setAttribute('aria-hidden', 'false');
	}
	function closeModal() {
		if (!modal) return;
		modal.classList.remove('show');
		modal.setAttribute('aria-hidden', 'true');
	}

	// Events
	// Removed Analyze/Clear buttons; analyze automatically on file/paste
	fileInput.addEventListener('change', e => handleFiles(e.target.files));

	dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); dropSquare?.classList.add('dragover'); });
	dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); dropSquare?.classList.remove('dragover'); });
	dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dragover'); dropSquare?.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
	dropSquare?.addEventListener('click', () => fileInput.click());

	// Modal close handlers
	modal?.addEventListener('click', e => { const t = e.target; if (t && t.getAttribute && t.getAttribute('data-close') === 'modal') closeModal(); });
	const closeBtn = document.querySelector('.modal-close');
	closeBtn?.addEventListener('click', closeModal);

	// Mode switching
	function setMode(mode) {
		const isEml = mode === 'eml';
		modeEmlBtn.classList.toggle('active', isEml);
		modePasteBtn.classList.toggle('active', !isEml);
		uploadBtn.style.display = isEml ? '' : 'none';
		fileInput.disabled = !isEml;
		inputEl.hidden = isEml; // hide textarea in EML mode
		dropSquare.style.display = isEml ? 'flex' : 'none';
		hintText.textContent = isEml ? 'Default: drag & drop or upload a full .eml message.' : 'Paste full email headers below. You can still drop an .eml file.';
	}

	modeEmlBtn?.addEventListener('click', () => setMode('eml'));
	modePasteBtn?.addEventListener('click', () => setMode('paste'));
	setMode('eml');

	// Theme switch
	const themeToggle = document.getElementById('theme-toggle');
	function setTheme(mode) {
		document.documentElement.setAttribute('data-theme', mode);
	}
	function toggleTheme() {
		const current = document.documentElement.getAttribute('data-theme') || 'dark';
		setTheme(current === 'dark' ? 'light' : 'dark');
	}
	themeToggle?.addEventListener('click', toggleTheme);
	themeToggle?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTheme(); } });
})();


