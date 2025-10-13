class EmailSecurityChecker {
    constructor() {
        this.commonSelectors = [
            // Microsoft 365 standaard selectors (hoogste prioriteit)
            'selector1', 'selector2',
            // Apple/iCloud selectors
            'sig1', 'sig2',
            // Google Workspace selectors
            'google', 'google1', 'google2',
            // Nederlandse providers
            'zivver', 'transip', 'transip1', 'transip2', 'hostnet', 'hostnet1', 'hostnet2',
            'antagonist', 'versio', 'versio1', 'versio2', 'mijndomein', 'directadmin',
            'da1', 'da2', 'cpanel', 'cp1', 'cp2', 'plesk', 'plesk1', 'plesk2',
            'vimexx', 'byte', 'yourhosting', 'siteground', 'greenhost', 'true',
            'neostrada', 'argeweb', 'hosting2go', 'combell', 'one', 'serverius',
            'leaseweb', 'nforcenetworks', 'nforce', 'hypernode',
            // Nederlandse overheid en instellingen
            'rijksoverheid', 'overheid', 'gemeente', 'provincie', 'ministerie',
            // Nederlandse bedrijven en organisaties
            'kpn', 'ziggo', 'odido', 'tmobile', 'vodafone', 'xs4all', 'planet',
            'quicknet', 'freedom', 'delta', 'caiway', 'online',
            // Nederlandse banken
            'ing', 'rabobank', 'abn', 'abnamro', 'sns', 'asn', 'regiobank',
            'knab', 'bunq', 'revolut', 'n26', 'triodos',
            // Nederlandse hosting specifiek
            'site', 'sitenl', 'hosting', 'hosting1', 'hosting2', 'webhosting',
            'shared', 'shared1', 'shared2', 'vps', 'vps1', 'vps2',
            'dedicated', 'cloud', 'cloud1', 'cloud2', 'server', 'server1', 'server2',
            'mail', 'mail1', 'mail2', 'mx', 'mx1', 'mx2', 'smtp', 'smtp1', 'smtp2',
            'pop', 'pop3', 'imap', 'imap1', 'imap2',
            // Everlytic (Nederlandse email marketing)
            'everlytickey1', 'everlytickey2', 'eversrv',
            // Global Micro (Nederlandse provider)
            'mxvault',
            // Algemene Nederlandse patronen
            'nl', 'nederland', 'dutch', 'default', 'standaard', 'email', 'e-mail',
            'post', 'postmaster', 'admin', 'beheer', 'beheerder', 'info', 'contact',
            'noreply', 'no-reply', 'nieuwsbrief', 'newsletter', 'marketing', 'promo',
            'service', 'support', 'factuur', 'facturen', 'invoice', 'order',
            'bestelling', 'klant', 'klanten', 'customer', 'webshop', 'shop', 'winkel',
            // MailChimp/Mandrill selectors
            'k1', 'k2', 'mandrill',
            // SendGrid selectors
            'sendgrid', 's1', 's2',
            // Amazon SES selectors
            'amazonses', 'ses', 'aws',
            // Postmark selectors
            'postmark', 'pm',
            // SparkPost selectors
            'sparkpost', 'sp',
            // Hetzner selectors
            'dkim',
            // Algemene selectors
            'key1', 'key2',
            // Provider-specifieke selectors
            'mailgun', 'constantcontact', 'campaignmonitor', 'aweber', 'getresponse',
            'mailerlite', 'sendinblue', 'convertkit', 'drip', 'activecampaign',
            // Outlook/Office365 selectors
            'outlook', 'office365', 'exchange', 'hosted',
            // Numerieke selectors
            'dkim1', 'dkim2', 'sel1', 'sel2', 'dk1', 'dk2',
            // Andere patronen
            'primary', 'secondary', 'main', 'backup', 'prod', 'production',
            // Email marketing platforms
            'klaviyo', 'hubspot', 'salesforce', 'pardot',
            // Security providers
            'proofpoint', 'mimecast', 'barracuda',
            // Additional common selectors
            'dkimChecking', 'test', 'beta', 'staging',
            // Year-based selectors (vaak gebruikt voor rotatie)
            '2023', '2024', '2025',
            // Month-based selectors
            'jan', 'feb', 'mar', 'apr', 'may', 'jun',
            'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
        ];

        this.dnsProviders = [
            'https://cloudflare-dns.com/dns-query',
            'https://dns.google/resolve',
            'https://1.1.1.1/dns-query'
        ];

        // Track highest progress value to avoid regressions on async updates
        this.maxProgress = 0;

        this.init();
    }

    init() {
        const checkButton = document.getElementById('checkButton');
        const domainInput = document.getElementById('domain');
        const themeToggle = document.getElementById('themeToggle');
        this.modal = document.getElementById('resultsModal');
        this.modalClose = document.getElementById('modalClose');
        this.modalResults = document.getElementById('modalResults');
        this.modalDomain = document.getElementById('modalDomain');
        this.modalCheck = document.getElementById('modalCheck');

        checkButton.addEventListener('click', () => this.checkEmailSecurity());
        domainInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkEmailSecurity();
            }
        });

        if (this.modalCheck) {
            this.modalCheck.addEventListener('click', () => {
                if (this.modalDomain && this.modalDomain.value) {
                    document.getElementById('domain').value = this.modalDomain.value;
                }
                this.checkEmailSecurity();
            });
        }
        if (this.modalDomain) {
            this.modalDomain.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (this.modalDomain && this.modalDomain.value) {
                        document.getElementById('domain').value = this.modalDomain.value;
                    }
                    this.checkEmailSecurity();
                }
            });
        }

        domainInput.focus();
        
        // Make instance globally available for inline onclick handlers
        window.emailChecker = this;
        
        // Initialize theme from persisted preference
        this.initTheme(themeToggle);

        // Modal close handlers
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => this.closeModal());
        }
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    nextFrame() {
        return new Promise(resolve => requestAnimationFrame(() => resolve()));
    }

    initTheme(themeToggle) {
        const saved = localStorage.getItem('theme');
        const isDark = saved === 'dark';
        document.body.classList.toggle('dark', isDark);
        if (themeToggle) themeToggle.textContent = isDark ? '☀️' : '🌙';
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const nowDark = !document.body.classList.contains('dark');
                document.body.classList.toggle('dark', nowDark);
                localStorage.setItem('theme', nowDark ? 'dark' : 'light');
                themeToggle.textContent = nowDark ? '☀️' : '🌙';
            });
        }
    }

    

    async checkEmailSecurity() {
        const domain = document.getElementById('domain').value.trim();
        if (!domain) {
            this.showError('Enter a valid domain');
            return;
        }

        if (!this.isValidDomain(domain)) {
            this.showError('Enter a valid domain (e.g., hannovanderdussen.nl)');
            return;
        }

        this.showLoading();
        this.resetProgress();

        try {
            // Show empty results container immediately in modal
            this.initializeResultsContainer(domain);
            await this.nextFrame();
            
            // Check SPF and DMARC in parallel and render immediately
            this.updateProgress(5, 'Checking SPF and DMARC records...');
            
            const [spfResult, dmarcResult] = await Promise.all([
                this.checkSPFRecord(domain),
                this.checkDMARCRecord(domain)
            ]);
            
            // Render SPF and DMARC results immediately
            this.displayInitialResults(domain, spfResult, dmarcResult);
            
            this.updateProgress(20, 'Checking DKIM selectors...');
            
            // Start DKIM checks and update progressively
            await this.checkAllDKIMSelectorsProgressive(domain);
            
        } catch (error) {
            this.hideLoading();
            this.showError('An error occurred while checking email security records: ' + error.message);
        }
    }

    initializeResultsContainer(domain) {
        if (this.modalResults) this.modalResults.innerHTML = `
            <div class="summary">
                <h2>Email Security Check for ${domain}</h2>
                <div id="spf-dmarc-container">
                    <p>Loading SPF and DMARC records...</p>
                </div>
            </div>
            <div id="dkim-container">
                <div class="section-header">
                    <h3>DKIM Records</h3>
                </div>
                <div class="section-description">
                    Loading DKIM records...
                </div>
                <div class="loading" style="display:block; margin: 8px 0 16px 0;">
                    <div class="spinner"></div>
                    <div class="progress-container">
                        <div class="progress-bar" id="progressFill"></div>
                    </div>
                    <div class="progress-text" id="progressText">Preparing...</div>
                    <div class="quote-text" id="quoteText"></div>
                </div>
                <div id="dkim-results"></div>
            </div>
        `;
        // Modal is opened in showLoading
    }

    displayInitialResults(domain, spfResult, dmarcResult) {
        const spfDmarcContainer = document.getElementById('spf-dmarc-container');
        
        spfDmarcContainer.innerHTML = `
            <div class="security-overview">
                <div class="security-item">
                    <h3>SPF Record</h3>
                    <div class="security-status ${spfResult.found ? 'status-found' : 'status-not-found'}">
                        ${spfResult.found ? 'Found' : 'Not found'}
                    </div>
                    ${spfResult.found ? `
                        <div class="record-details">
                            <div class="record-line">
                                <span class="record-text">${spfResult.record}</span>
                                <button class="copy-btn" onclick="window.emailChecker.copyToClipboard('${spfResult.record.replace(/'/g, "\\'")}')">Copy</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="security-item">
                    <h3>DMARC Record</h3>
                    <div class="security-status ${dmarcResult.found ? 'status-found' : 'status-not-found'}">
                        ${dmarcResult.found ? 'Found' : 'Not found'}
                    </div>
                    ${dmarcResult.found ? `
                        <div class="record-details">
                            <div class="record-line">
                                <span class="record-text">${dmarcResult.record}</span>
                                <button class="copy-btn" onclick="window.emailChecker.copyToClipboard('${dmarcResult.record.replace(/'/g, "\\'")}')">Copy</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async checkAllDKIMSelectorsProgressive(domain) {
        const dkimResults = [];
        const dkimResultsContainer = document.getElementById('dkim-results');
        
        // Update section description
        const sectionDescription = document.querySelector('#dkim-container .section-description');
        sectionDescription.textContent = 'Checking DKIM selectors...';
        
        for (let i = 0; i < this.commonSelectors.length; i++) {
            const selector = this.commonSelectors[i];
            
            // Update progress
            const progressPercentage = 20 + ((i / this.commonSelectors.length) * 75);
            this.updateProgress(progressPercentage, `Checking DKIM selector: ${selector}`);
            
            try {
                const result = await this.checkDKIMRecord(domain, selector);
                if (result.found) {
                    dkimResults.push(result);
                    
                    // Add to results immediately
                    this.addDKIMResultToDOM(result, selector === 'selector1' || selector === 'selector2');
                }
            } catch (error) {
                console.warn(`Error checking selector ${selector}:`, error);
            }
            
            // Small delay to keep UI responsive
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Update section description
        sectionDescription.textContent = `${dkimResults.length} DKIM record(s) found`;
        this.updateProgress(100, 'Check completed');
        this.hideLoading();
        
        return dkimResults;
    }

    addDKIMResultToDOM(result, isMicrosoft = false) {
        const dkimResultsContainer = document.getElementById('dkim-results');
        
        const resultElement = document.createElement('div');
        resultElement.className = `selector-result ${isMicrosoft ? 'microsoft-selector' : ''}`;
        
        resultElement.innerHTML = `
            <div class="selector-header" onclick="this.parentElement.classList.toggle('expanded')">
                <div class="selector-name">
                    ${result.selector}
                    ${isMicrosoft ? '<span class="microsoft-badge">Microsoft</span>' : ''}
                </div>
                <div class="status found">Found</div>
            </div>
            <div class="selector-details">
                <strong>Selector:</strong>
                <div class="record-line">
                    <span class="record-text">${result.selector}</span>
                    <button class="copy-btn" onclick="window.emailChecker.copyToClipboard('${result.selector}')">Copy</button>
                </div>
                <strong>DKIM Record:</strong>
                <div class="record-line">
                    <span class="record-text">${result.record}</span>
                    <button class="copy-btn" onclick="window.emailChecker.copyToClipboard('${result.record.replace(/'/g, "\\'")}')">Copy</button>
                </div>
            </div>
        `;
        
        dkimResultsContainer.appendChild(resultElement);
    }

    isValidDomain(domain) {
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
        return domainRegex.test(domain) && domain.includes('.');
    }

    showError(message) {
        if (this.modalResults) {
            this.modalResults.innerHTML = `<div class="error-message">${message}</div>`;
            this.openModal('Error');
            return;
        }
        const resultsContainer = document.getElementById('results');
        if (resultsContainer) resultsContainer.innerHTML = `<div class="error-message">${message}</div>`;
    }

    showLoading() {
        if (this.modalResults) {
            this.modalResults.innerHTML = `
                <div class="loading" style="display:block">
                    <div class="spinner"></div>
                    <div class="progress-container">
                        <div class="progress-bar" id="progressFill"></div>
                    </div>
                    <div class="progress-text" id="progressText">Preparing...</div>
                    <div class="quote-text" id="quoteText"></div>
                </div>
            `;
        }
        // keep modal controls in header in sync
        if (this.modalDomain) this.modalDomain.value = document.getElementById('domain').value || '';
        this.openModal('Checking...');
        this.startQuotes();
    }

    hideLoading() {
        this.stopQuotes();
        const scope = this.modalResults || document;
        const loader = scope.querySelector('.loading');
        if (loader) loader.style.display = 'none';
    }

    resetProgress() {
        this.maxProgress = 0;
        this.updateProgress(0, 'Preparing...');
    }

    updateProgress(percentage, text) {
        const scope = this.modalResults || document;
        const progressFill = scope.querySelector('#progressFill');
        const progressText = scope.querySelector('#progressText');
        const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
        const next = Math.max(this.maxProgress, clamped);
        this.maxProgress = next;
        if (progressFill) progressFill.style.width = next + '%';
        if (progressText && typeof text === 'string') progressText.textContent = text;
    }

    openModal(title) {
        const titleEl = document.getElementById('modalTitle');
        if (titleEl) titleEl.textContent = title || 'Results';
        if (this.modal) this.modal.classList.add('open');
        if (this.modal) this.modal.setAttribute('aria-hidden', 'false');
    }

    closeModal() {
        if (this.modal) this.modal.classList.remove('open');
        if (this.modal) this.modal.setAttribute('aria-hidden', 'true');
    }

    startQuotes() {
        const scope = this.modalResults || document;
        const el = scope.querySelector('#quoteText');
        if (!el) return;
        const quotes = [
            "Woah, that's fast, right?",
            "Warming up the DNS engines...",
            "Asking the internet politely...",
            "Compiling selector magic...",
            "Hold tight, packets in transit...",
            "Blink and you'll miss it!",
            "Summoning DKIM spirits...",
            "Fetching SPF goodness...",
            "DMARCing our territory..."
        ];
        let i = 0;
        el.textContent = quotes[i % quotes.length];
        this.quoteTimer = setInterval(() => {
            i += 1;
            el.textContent = quotes[i % quotes.length];
        }, 1800);
    }

    stopQuotes() {
        if (this.quoteTimer) {
            clearInterval(this.quoteTimer);
            this.quoteTimer = null;
        }
    }

    async checkSPFRecord(domain) {
        try {
            const response = await this.queryDNS(domain, 'TXT');
            const spfRecord = response.Answer?.find(record => 
                record.data.includes('v=spf1')
            );
            
            return {
                found: !!spfRecord,
                record: spfRecord ? spfRecord.data.replace(/"/g, '') : null
            };
        } catch (error) {
            console.warn('SPF check failed:', error);
            return { found: false, record: null };
        }
    }

    async checkDMARCRecord(domain) {
        try {
            const dmarcDomain = `_dmarc.${domain}`;
            const response = await this.queryDNS(dmarcDomain, 'TXT');
            const dmarcRecord = response.Answer?.find(record => 
                record.data.includes('v=DMARC1')
            );
            
            return {
                found: !!dmarcRecord,
                record: dmarcRecord ? dmarcRecord.data.replace(/"/g, '') : null
            };
        } catch (error) {
            console.warn('DMARC check failed:', error);
            return { found: false, record: null };
        }
    }

    async checkDKIMRecord(domain, selector) {
        try {
            const dkimDomain = `${selector}._domainkey.${domain}`;
            const response = await this.queryDNS(dkimDomain, 'TXT');
            
            if (response.Answer && response.Answer.length > 0) {
                const dkimRecord = response.Answer.find(record => 
                    record.data.includes('v=DKIM1') || record.data.includes('k=rsa') || record.data.includes('p=')
                );
                
                if (dkimRecord) {
                    return {
                        found: true,
                        selector: selector,
                        record: dkimRecord.data.replace(/"/g, ''),
                        domain: dkimDomain
                    };
                }
            }
            
            return { found: false, selector: selector };
        } catch (error) {
            return { found: false, selector: selector };
        }
    }

    async queryDNS(domain, type) {
        const errors = [];
        
        for (const provider of this.dnsProviders) {
            try {
                const url = `${provider}?name=${encodeURIComponent(domain)}&type=${type}`;
                const response = await fetch(url, {
                    headers: {
                        'Accept': 'application/dns-json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const data = await response.json();
                return data;
            } catch (error) {
                errors.push(`${provider}: ${error.message}`);
                continue;
            }
        }
        
        throw new Error(`Alle DNS providers faalden: ${errors.join(', ')}`);
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Visual feedback for copy
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    }
}

// Initialize the checker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EmailSecurityChecker();
});
