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
            'zivver',
            'transip', 'transip1', 'transip2',
            'hostnet', 'hostnet1', 'hostnet2',
            'antagonist',
            'versio', 'versio1', 'versio2',
            'mijndomein',
            'directadmin', 'da1', 'da2',
            'cpanel', 'cp1', 'cp2',
            'plesk', 'plesk1', 'plesk2',
            'vimexx',
            'byte',
            'yourhosting',
            'siteground',
            'greenhost',
            'true',
            'neostrada',
            'argeweb',
            'hosting2go',
            'combell',
            'one',
            'serverius',
            'leaseweb',
            'nforcenetworks',
            'nforce',
            'hypernode',
            
            // Nederlandse overheid en instellingen
            'rijksoverheid',
            'overheid',
            'gemeente',
            'provincie',
            'ministerie',
            
            // Nederlandse bedrijven en organisaties
            'kpn',
            'ziggo',
            'odido',
            'tmobile',
            'vodafone',
            'xs4all',
            'planet',
            'quicknet',
            'freedom',
            'delta',
            'caiway',
            'online',
            
            // Nederlandse banken
            'ing',
            'rabobank',
            'abn', 'abnamro',
            'sns',
            'asn',
            'regiobank',
            'knab',
            'bunq',
            'revolut',
            'n26',
            'triodos',
            
            // Nederlandse hosting specifiek
            'site', 'sitenl',
            'hosting', 'hosting1', 'hosting2',
            'webhosting',
            'shared', 'shared1', 'shared2',
            'vps', 'vps1', 'vps2',
            'dedicated',
            'cloud', 'cloud1', 'cloud2',
            'server', 'server1', 'server2',
            'mail', 'mail1', 'mail2',
            'mx', 'mx1', 'mx2',
            'smtp', 'smtp1', 'smtp2',
            'pop', 'pop3',
            'imap', 'imap1', 'imap2',
            
            // Everlytic (Nederlandse email marketing)
            'everlytickey1', 'everlytickey2', 'eversrv',
            
            // Global Micro (Nederlandse provider)
            'mxvault',
            
            // Algemene Nederlandse patronen
            'nl', 'nederland', 'dutch',
            'default', 'standaard',
            'email', 'e-mail',
            'post', 'postmaster',
            'admin', 'beheer', 'beheerder',
            'info', 'contact',
            'noreply', 'no-reply',
            'nieuwsbrief', 'newsletter',
            'marketing', 'promo',
            'service', 'support',
            'factuur', 'facturen', 'invoice',
            'order', 'bestelling',
            'klant', 'klanten', 'customer',
            'webshop', 'shop', 'winkel',
            
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

        this.currentProgress = 0;
        this.totalChecks = 0;
        this.currentlyTesting = [];
        this.currentTestingIndex = 0;
        this.init();
    }

    init() {
        const checkButton = document.getElementById('checkButton');
        const domainInput = document.getElementById('domain');

        checkButton.addEventListener('click', () => this.checkEmailSecurity());

        domainInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkEmailSecurity();
            }
        });

        domainInput.focus();
    }

    async checkEmailSecurity() {
        const domain = document.getElementById('domain').value.trim();

        if (!domain) {
            this.showError('Voer een geldig domein in');
            return;
        }

        if (!this.isValidDomain(domain)) {
            this.showError('Voer een geldig domein in (bijvoorbeeld: hannovanderdussen.nl)');
            return;
        }

        this.showLoading();
        this.resetProgress();

        try {
            this.totalChecks = this.commonSelectors.length + 2;
            
            // Check SPF en DMARC eerst
            this.updateProgress(5, 'Controleren SPF record...');
            const spfResult = await this.checkSPFRecord(domain);
            
            this.updateProgress(10, 'Controleren DMARC record...');
            const dmarcResult = await this.checkDMARCRecord(domain);
            
            this.updateProgress(15, 'Controleren DKIM selectors...');
            const dkimResults = await this.checkAllDKIMSelectors(domain);

            this.displayResults(domain, dkimResults, spfResult, dmarcResult);
        } catch (error) {
            this.hideLoading();
            this.showError('Er is een fout opgetreden tijdens het controleren van email security records: ' + error.message);
        }
    }

    isValidDomain(domain) {
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
        return domainRegex.test(domain) && domain.includes('.');
    }

    showError(message) {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = `<div class="error-message">${message}</div>`;
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('results').innerHTML = '';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    resetProgress() {
        this.currentProgress = 0;
        this.currentlyTesting = [];
        this.currentTestingIndex = 0;
        this.updateProgress(0, 'Voorbereiden...');
        this.updateCurrentlyTesting();
    }

    updateProgress(percentage, text) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressText) progressText.textContent = text;
    }

    updateCurrentlyTesting() {
        const currentlyTestingElement = document.getElementById('currentlyTesting');
        if (currentlyTestingElement) {
            if (this.currentlyTesting.length === 0) {
                currentlyTestingElement.innerHTML = '<div class="testing-item">Wachten op volgende batch...</div>';
            } else {
                const visibleItems = this.getVisibleTestingItems();
                const testingHTML = visibleItems.map(item => 
                    `<div class="testing-item">Testen: ${item}</div>`
                ).join('');
                currentlyTestingElement.innerHTML = testingHTML;
                
                if (this.currentlyTesting.length > 3) {
                    this.startSmoothAutoScroll();
                }
            }
        }
    }

    getVisibleTestingItems() {
        if (this.currentlyTesting.length <= 3) {
            return this.currentlyTesting;
        }
        
        const items = [];
        for (let i = 0; i < 3; i++) {
            const index = (this.currentTestingIndex + i) % this.currentlyTesting.length;
            items.push(this.currentlyTesting[index]);
        }
        return items;
    }

    startSmoothAutoScroll() {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
        }
        
        this.scrollInterval = setInterval(() => {
            this.currentTestingIndex = (this.currentTestingIndex + 1) % this.currentlyTesting.length;
            this.smoothScrollToNext();
        }, 300);
    }

    smoothScrollToNext() {
        const currentlyTestingElement = document.getElementById('currentlyTesting');
        if (currentlyTestingElement) {
            const visibleItems = this.getVisibleTestingItems();
            const testingHTML = visibleItems.map(item => 
                `<div class="testing-item">Testen: ${item}</div>`
            ).join('');
            
            currentlyTestingElement.innerHTML = testingHTML;
        }
    }

    stopAutoScroll() {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
    }

    async checkSPFRecord(domain) {
        this.currentlyTesting = [`SPF record voor ${domain}`];
        this.updateCurrentlyTesting();

        // Probeer alle DNS providers
        for (const provider of this.dnsProviders) {
            try {
                const response = await fetch(`${provider}?name=${domain}&type=TXT`, {
                    headers: {
                        'Accept': 'application/dns-json'
                    },
                    signal: AbortSignal.timeout(8000)
                });

                if (!response.ok) {
                    console.log(`Provider ${provider} returned status ${response.status}`);
                    continue;
                }

                const data = await response.json();
                console.log(`SPF check for ${domain} via ${provider}:`, data);

                if (data.Answer && data.Answer.length > 0) {
                    // Zoek naar SPF record in alle TXT records
                    for (const record of data.Answer) {
                        if (record.type === 16) { // TXT record
                            const recordData = record.data.replace(/"/g, '').toLowerCase();
                            if (recordData.startsWith('v=spf1')) {
                                return {
                                    found: true,
                                    record: record.data.replace(/"/g, ''),
                                    domain: domain,
                                    provider: provider
                                };
                            }
                        }
                    }
                }
            } catch (error) {
                console.log(`SPF check failed for provider ${provider}:`, error.message);
                continue;
            }
        }

        return {
            found: false,
            record: null,
            domain: domain
        };
    }

    async checkDMARCRecord(domain) {
        const dmarcDomain = `_dmarc.${domain}`;
        this.currentlyTesting = [`DMARC record voor ${dmarcDomain}`];
        this.updateCurrentlyTesting();

        // Probeer alle DNS providers
        for (const provider of this.dnsProviders) {
            try {
                const response = await fetch(`${provider}?name=${dmarcDomain}&type=TXT`, {
                    headers: {
                        'Accept': 'application/dns-json'
                    },
                    signal: AbortSignal.timeout(8000)
                });

                if (!response.ok) {
                    console.log(`Provider ${provider} returned status ${response.status}`);
                    continue;
                }

                const data = await response.json();
                console.log(`DMARC check for ${dmarcDomain} via ${provider}:`, data);

                if (data.Answer && data.Answer.length > 0) {
                    // Zoek naar DMARC record in alle TXT records
                    for (const record of data.Answer) {
                        if (record.type === 16) { // TXT record
                            const recordData = record.data.replace(/"/g, '').toLowerCase();
                            if (recordData.startsWith('v=dmarc1')) {
                                return {
                                    found: true,
                                    record: record.data.replace(/"/g, ''),
                                    domain: dmarcDomain,
                                    provider: provider
                                };
                            }
                        }
                    }
                }
            } catch (error) {
                console.log(`DMARC check failed for provider ${provider}:`, error.message);
                continue;
            }
        }

        return {
            found: false,
            record: null,
            domain: dmarcDomain
        };
    }

    async checkAllDKIMSelectors(domain) {
        const results = [];
        const batchSize = 5;

        for (let i = 0; i < this.commonSelectors.length; i += batchSize) {
            const batch = this.commonSelectors.slice(i, i + batchSize);
            
            this.currentlyTesting = batch.map(selector => `${selector}._domainkey.${domain}`);
            this.currentTestingIndex = 0;
            this.updateCurrentlyTesting();
            
            const batchPromises = batch.map(selector => this.checkDKIMSelector(domain, selector));

            try {
                const batchResults = await Promise.allSettled(batchPromises);
                const processedResults = batchResults.map((result, index) => {
                    if (result.status === 'fulfilled') {
                        return result.value;
                    } else {
                        return {
                            selector: batch[index],
                            found: false,
                            record: null,
                            fullRecord: `${batch[index]}._domainkey.${domain}`,
                            error: result.reason.message,
                            isPrimary: batch[index] === 'selector1' || batch[index] === 'selector2'
                        };
                    }
                });

                results.push(...processedResults);

                // Progress update voor DKIM (15% tot 95%)
                const dkimProgress = 15 + ((i + batchSize) / this.commonSelectors.length) * 80;
                this.updateProgress(
                    Math.min(dkimProgress, 95),
                    `Controleren: ${Math.min(i + batchSize, this.commonSelectors.length)}/${this.commonSelectors.length} DKIM selectors`
                );

                if (i + batchSize < this.commonSelectors.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                console.error('Batch error:', error);
            }
        }

        return results;
    }

    async checkDKIMSelector(domain, selector) {
        const dkimRecord = `${selector}._domainkey.${domain}`;

        for (const provider of this.dnsProviders) {
            try {
                const response = await fetch(`${provider}?name=${dkimRecord}&type=TXT`, {
                    headers: {
                        'Accept': 'application/dns-json'
                    },
                    signal: AbortSignal.timeout(3000)
                });

                if (!response.ok) {
                    continue;
                }

                const data = await response.json();

                if (data.Answer && data.Answer.length > 0) {
                    const txtRecord = data.Answer.find(record => record.type === 16);
                    if (txtRecord) {
                        const recordData = txtRecord.data.replace(/"/g, '');
                        
                        if (this.isValidDKIMRecord(recordData)) {
                            return {
                                selector,
                                found: true,
                                record: recordData,
                                fullRecord: dkimRecord,
                                isPrimary: selector === 'selector1' || selector === 'selector2',
                                provider: provider
                            };
                        }
                    }
                }

                return {
                    selector,
                    found: false,
                    record: null,
                    fullRecord: dkimRecord,
                    isPrimary: selector === 'selector1' || selector === 'selector2'
                };

            } catch (error) {
                console.log(`Provider ${provider} failed for ${selector}:`, error.message);
                continue;
            }
        }

        throw new Error(`Alle DNS providers faalden voor selector ${selector}`);
    }

    isValidDKIMRecord(record) {
        return record.includes('v=DKIM1') || 
               record.includes('k=rsa') || 
               record.includes('k=ed25519') || 
               (record.includes('p=') && record.length > 50);
    }

    copyToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = button.textContent;
            button.textContent = 'Gekopieerd!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Kopiëren mislukt:', err);
            button.textContent = 'Fout!';
            setTimeout(() => {
                button.textContent = 'Kopieer';
            }, 2000);
        });
    }

    displayResults(domain, dkimResults, spfResult, dmarcResult) {
        this.hideLoading();
        this.stopAutoScroll();
        this.updateProgress(100, 'Voltooid!');
        
        const resultsContainer = document.getElementById('results');
        
        const foundDKIMSelectors = dkimResults.filter(result => result.found);
        const primarySelectors = dkimResults.filter(result => result.isPrimary);
        const primaryFound = primarySelectors.filter(result => result.found);

        let html = this.createSummaryHTML(domain, foundDKIMSelectors, spfResult, dmarcResult, primaryFound);

        // SPF Section
        html += this.createSPFSectionHTML(spfResult);

        // DMARC Section
        html += this.createDMARCSectionHTML(dmarcResult);

        // Microsoft 365 DKIM selectors
        if (primarySelectors.length > 0) {
            html += this.createMicrosoftSectionHTML(primarySelectors);
        }

        // Andere gevonden DKIM selectors
        const otherFoundSelectors = foundDKIMSelectors.filter(result => !result.isPrimary);
        if (otherFoundSelectors.length > 0) {
            html += this.createOtherFoundSectionHTML(otherFoundSelectors);
        }

        resultsContainer.innerHTML = html;
        this.addToggleHandlers();
        this.addCopyHandlers();
    }

    createSummaryHTML(domain, foundDKIMSelectors, spfResult, dmarcResult, primaryFound) {
        const spfStatus = spfResult.found ? '✅ SPF record gevonden' : '❌ Geen SPF record gevonden';
        const dmarcStatus = dmarcResult.found ? '✅ DMARC record gevonden' : '❌ Geen DMARC record gevonden';
        const dkimStatus = foundDKIMSelectors.length > 0 ? `✅ ${foundDKIMSelectors.length} DKIM records gevonden` : '❌ Geen DKIM records gevonden';

        return `
            <div class="summary">
                <h2>Email Security Resultaten voor ${domain}</h2>
                <div class="security-overview">
                    <div class="security-item">${spfStatus}</div>
                    <div class="security-item">${dmarcStatus}</div>
                    <div class="security-item">${dkimStatus}</div>
                </div>
            </div>
        `;
    }

    createSPFSectionHTML(spfResult) {
        const statusClass = spfResult.found ? 'found' : 'not-found';
        const statusText = spfResult.found ? 'Gevonden' : 'Niet gevonden';

        return `
            <div class="section-header">
                <h3>🛡️ SPF (Sender Policy Framework)</h3>
            </div>
            <div class="section-description">
                SPF specificeert welke mail servers geautoriseerd zijn om e-mail te verzenden namens jouw domein.
            </div>
            <div class="selector-result">
                <div class="selector-header" ${spfResult.found ? `onclick="toggleDetails('spf')"` : ''}>
                    <div class="selector-name">SPF Record</div>
                    <span class="status ${statusClass}">${statusText}</span>
                </div>
                ${spfResult.found ? `
                    <div class="selector-details" id="spf-details" style="display: none;">
                        <strong>DNS Record:</strong>
                        <div class="record-line">
                            <span class="record-text">${spfResult.domain}</span>
                            <button class="copy-btn" onclick="copyToClipboard('${spfResult.domain}', this)">Kopieer</button>
                        </div>
                        
                        <strong>SPF Record:</strong>
                        <div class="record-line">
                            <span class="record-text">${spfResult.record}</span>
                            <button class="copy-btn" onclick="copyToClipboard('${spfResult.record}', this)">Kopieer</button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    createDMARCSectionHTML(dmarcResult) {
        const statusClass = dmarcResult.found ? 'found' : 'not-found';
        const statusText = dmarcResult.found ? 'Gevonden' : 'Niet gevonden';

        return `
            <div class="section-header">
                <h3>📧 DMARC (Domain-based Message Authentication)</h3>
            </div>
            <div class="section-description">
                DMARC combineert SPF en DKIM om e-mail authenticatie te verbeteren en phishing tegen te gaan.
            </div>
            <div class="selector-result">
                <div class="selector-header" ${dmarcResult.found ? `onclick="toggleDetails('dmarc')"` : ''}>
                    <div class="selector-name">DMARC Record</div>
                    <span class="status ${statusClass}">${statusText}</span>
                </div>
                ${dmarcResult.found ? `
                    <div class="selector-details" id="dmarc-details" style="display: none;">
                        <strong>DNS Record:</strong>
                        <div class="record-line">
                            <span class="record-text">${dmarcResult.domain}</span>
                            <button class="copy-btn" onclick="copyToClipboard('${dmarcResult.domain}', this)">Kopieer</button>
                        </div>
                        
                        <strong>DMARC Record:</strong>
                        <div class="record-line">
                            <span class="record-text">${dmarcResult.record}</span>
                            <button class="copy-btn" onclick="copyToClipboard('${dmarcResult.record}', this)">Kopieer</button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    createMicrosoftSectionHTML(primarySelectors) {
        let html = `
            <div class="section-header">
                <h3>🏢 Microsoft 365 DKIM Selectors</h3>
            </div>
            <div class="section-description">
                Microsoft 365 gebruikt standaard twee selectors (selector1 en selector2) voor DKIM-ondertekening.
            </div>
        `;

        primarySelectors.forEach(result => {
            const statusClass = result.found ? 'found' : 'not-found';
            const statusText = result.found ? 'Gevonden' : 'Niet gevonden';
            
            html += `
                <div class="selector-result microsoft-selector">
                    <div class="selector-header" onclick="toggleDetails('${result.selector}')">
                        <div class="selector-name">
                            ${result.selector}
                            <span class="microsoft-badge">Microsoft 365</span>
                        </div>
                        <span class="status ${statusClass}">${statusText}</span>
                    </div>
                    ${result.found ? `
                        <div class="selector-details" id="${result.selector}-details" style="display: none;">
                            <strong>DNS Record:</strong>
                            <div class="record-line">
                                <span class="record-text">${result.fullRecord}</span>
                                <button class="copy-btn" onclick="copyToClipboard('${result.fullRecord}', this)">Kopieer</button>
                            </div>
                            
                            <strong>DKIM Record:</strong>
                            <div class="record-line">
                                <span class="record-text">${result.record}</span>
                                <button class="copy-btn" onclick="copyToClipboard('${result.record}', this)">Kopieer</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        return html;
    }

    createOtherFoundSectionHTML(otherFoundSelectors) {
        let html = `
            <div class="section-header">
                <h3>✅ Andere Gevonden DKIM Selectors</h3>
            </div>
            <div class="section-description">
                Deze DKIM selectors zijn gevonden en hebben geldige DKIM records.
            </div>
        `;

        otherFoundSelectors.forEach(result => {
            html += `
                <div class="selector-result">
                    <div class="selector-header" onclick="toggleDetails('${result.selector}')">
                        <div class="selector-name">${result.selector}</div>
                        <span class="status found">Gevonden</span>
                    </div>
                    <div class="selector-details" id="${result.selector}-details" style="display: none;">
                        <strong>DNS Record:</strong>
                        <div class="record-line">
                            <span class="record-text">${result.fullRecord}</span>
                            <button class="copy-btn" onclick="copyToClipboard('${result.fullRecord}', this)">Kopieer</button>
                        </div>
                        
                        <strong>DKIM Record:</strong>
                        <div class="record-line">
                            <span class="record-text">${result.record}</span>
                            <button class="copy-btn" onclick="copyToClipboard('${result.record}', this)">Kopieer</button>
                        </div>
                    </div>
                </div>
            `;
        });

        return html;
    }

    addToggleHandlers() {
        window.toggleDetails = function(selector) {
            const details = document.getElementById(selector + '-details');
            if (details) {
                details.style.display = details.style.display === 'none' ? 'block' : 'none';
            }
        };
    }

    addCopyHandlers() {
        window.copyToClipboard = (text, button) => {
            this.copyToClipboard(text, button);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EmailSecurityChecker();
});
