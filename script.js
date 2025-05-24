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
        
        // Maak de instance globaal beschikbaar voor onclick handlers
        window.emailChecker = this;
        
        // Initialize custom cursor
        this.initCustomCursor();
    }

    initCustomCursor() {
        const cursor = document.querySelector('.custom-cursor');
        const follower = document.querySelector('.cursor-follower');
        
        let mouseX = 0;
        let mouseY = 0;
        let followerX = 0;
        let followerY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        });

        // Smooth follower animation
        const animateFollower = () => {
            followerX += (mouseX - followerX) * 0.1;
            followerY += (mouseY - followerY) * 0.1;
            
            follower.style.left = followerX + 'px';
            follower.style.top = followerY + 'px';
            
            requestAnimationFrame(animateFollower);
        };
        animateFollower();

        // Hover effects
        const hoverElements = document.querySelectorAll('button, input, .benefit-item, .selector-header');
        
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(1.5)';
                follower.style.transform = 'scale(1.5)';
            });
            
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
                follower.style.transform = 'scale(1)';
            });
        });
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
            // Toon direct een lege resultatencontainer
            this.initializeResultsContainer(domain);
            
            // Check SPF en DMARC parallel en toon direct
            this.updateProgress(5, 'Controleren SPF en DMARC records...');
            
            const [spfResult, dmarcResult] = await Promise.all([
                this.checkSPFRecord(domain),
                this.checkDMARCRecord(domain)
            ]);
            
            // Toon SPF en DMARC resultaten direct
            this.displayInitialResults(domain, spfResult, dmarcResult);
            
            this.updateProgress(20, 'Controleren DKIM selectors...');
            
            // Start DKIM checks en update progressief
            await this.checkAllDKIMSelectorsProgressive(domain);
            
        } catch (error) {
            this.hideLoading();
            this.showError('Er is een fout opgetreden tijdens het controleren van email security records: ' + error.message);
        }
    }

    initializeResultsContainer(domain) {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = `
            <div class="summary">
                <h2>Email Security Check voor ${domain}</h2>
                <div id="spf-dmarc-container">
                    <p>Laden van SPF en DMARC records...</p>
                </div>
            </div>
            <div id="dkim-container">
                <div class="section-header">
                    <h3>DKIM Records</h3>
                </div>
                <div class="section-description">
                    DKIM records worden geladen...
                </div>
                <div id="dkim-results"></div>
            </div>
        `;
    }

    displayInitialResults(domain, spfResult, dmarcResult) {
        const spfDmarcContainer = document.getElementById('spf-dmarc-container');
        
        spfDmarcContainer.innerHTML = `
            <div class="security-overview">
                <div class="security-item">
                    <h3>SPF Record</h3>
                    <div class="security-status ${spfResult.found ? 'status-found' : 'status-not-found'}">
                        ${spfResult.found ? 'Gevonden' : 'Niet gevonden'}
                    </div>
                    ${spfResult.found ? `
                        <div class="record-details">
                            <div class="record-line">
                                <span class="record-text">${spfResult.record}</span>
                                <button class="copy-btn" onclick="window.emailChecker.copyToClipboard('${spfResult.record.replace(/'/g, "\\'")}')">Kopieer</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="security-item">
                    <h3>DMARC Record</h3>
                    <div class="security-status ${dmarcResult.found ? 'status-found' : 'status-not-found'}">
                        ${dmarcResult.found ? 'Gevonden' : 'Niet gevonden'}
                    </div>
                    ${dmarcResult.found ? `
                        <div class="record-details">
                            <div class="record-line">
                                <span class="record-text">${dmarcResult.record}</span>
                                <button class="copy-btn" onclick="window.emailChecker.copyToClipboard('${dmarcResult.record.replace(/'/g, "\\'")}')">Kopieer</button>
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
        
        // Update sectie beschrijving
        const sectionDescription = document.querySelector('#dkim-container .section-description');
        sectionDescription.textContent = 'Bezig met controleren van DKIM selectors...';
        
        for (let i = 0; i < this.commonSelectors.length; i++) {
            const selector = this.commonSelectors[i];
            
            // Update progress
            const progressPercentage = 20 + ((i / this.commonSelectors.length) * 75);
            this.updateProgress(progressPercentage, `Controleren DKIM selector: ${selector}`);
            
            try {
                const result = await this.checkDKIMRecord(domain, selector);
                if (result.found) {
                    dkimResults.push(result);
                    
                    // Voeg direct toe aan de resultaten
                    this.addDKIMResultToDOM(result, selector === 'selector1' || selector === 'selector2');
                }
            } catch (error) {
                console.warn(`Fout bij controleren van selector ${selector}:`, error);
            }
            
            // Kleine vertraging om UI responsive te houden
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Update sectie beschrijving
        sectionDescription.textContent = `${dkimResults.length} DKIM record(s) gevonden`;
        this.updateProgress(100, 'Controle voltooid');
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
                <div class="status found">Gevonden</div>
            </div>
            <div class="selector-details">
                <strong>Selector:</strong>
                <div class="record-line">
                    <span class="record-text">${result.selector}</span>
                    <button class="copy-btn" onclick="window.emailChecker.copyToClipboard('${result.selector}')">Kopieer</button>
                </div>
                <strong>DKIM Record:</strong>
                <div class="record-line">
                    <span class="record-text">${result.record}</span>
                    <button class="copy-btn" onclick="window.emailChecker.copyToClipboard('${result.record.replace(/'/g, "\\'")}')">Kopieer</button>
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
        this.updateProgress(0, 'Voorbereiden...');
    }

    updateProgress(percentage, text) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressText) progressText.textContent = text;
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
            // Visual feedback voor kopiëren
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = 'Gekopieerd!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Kopiëren mislukt:', err);
        });
    }
}

// Initialize the checker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EmailSecurityChecker();
});
