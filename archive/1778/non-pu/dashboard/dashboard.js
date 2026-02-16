/**
 * NonPU Instant Dashboard — Logic
 * Handles navigation, data loading, shimmer states, UI updates,
 * and encrypted license key decryption from the desktop client.
 */

// ========== License Encryption Config ==========
const NONPU_CRYPTO = {
    // Secret salt — used to decrypt the encrypted key sent by the desktop client
    SALT: 'BNGF50678#RTY',
    // Algorithm: AES-CBC via Web Crypto API
    ALGO: 'AES-CBC',
    // localStorage key for the temporary decrypted license
    STORAGE_KEY: 'nonpu_extend_license_tmp'
};

/**
 * Derive a 256-bit AES key from the secret salt using PBKDF2.
 * The salt is hashed with SHA-256 to produce a stable derivation salt.
 */
async function deriveKey(salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(salt), 'PBKDF2', false, ['deriveKey']
    );
    const derivationSalt = await crypto.subtle.digest('SHA-256', enc.encode(salt));
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: new Uint8Array(derivationSalt), iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-CBC', length: 256 },
        false,
        ['decrypt']
    );
}

/**
 * Decrypt an encrypted license key.
 * Expected format: base64(iv:ciphertext) where iv is 16 bytes.
 */
async function decryptLicenseKey(encryptedB64) {
    try {
        const raw = atob(encryptedB64);
        const bytes = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
        // First 16 bytes = IV, rest = ciphertext
        const iv = bytes.slice(0, 16);
        const ciphertext = bytes.slice(16);
        const key = await deriveKey(NONPU_CRYPTO.SALT);
        const decrypted = await crypto.subtle.decrypt(
            { name: NONPU_CRYPTO.ALGO, iv: iv },
            key,
            ciphertext
        );
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error('Decryption failed:', e);
        return null;
    }
}

/**
 * Send a status callback to the NonPU Instant desktop application.
 * 1 = success, 0 = failure
 */
function sendAppCallback(status) {
    try {
        // Attempt to open the custom protocol URL — the desktop app listens for this
        const callbackUrl = 'nonpu://callback?status=' + (status ? '1' : '0');
        const frame = document.createElement('iframe');
        frame.style.display = 'none';
        frame.src = callbackUrl;
        document.body.appendChild(frame);
        setTimeout(() => frame.remove(), 3000);
    } catch (e) {
        console.warn('App callback failed:', e);
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    // ========== DOM References ==========
    const loadingBar     = document.getElementById('loadingBar');
    const sidebar        = document.getElementById('sidebar');
    const sidebarToggle  = document.getElementById('sidebarToggle');
    const pageTitle      = document.getElementById('pageTitle');
    const navItems       = document.querySelectorAll('.dash-nav-item[data-nav]');
    const pages          = document.querySelectorAll('.dash-page');

    // ========== Loading Bar ==========
    function showLoading() { loadingBar.classList.add('active'); }
    function hideLoading() { loadingBar.classList.remove('active'); }

    showLoading();

    // ==================================================================
    // CRITICAL: Capture URL params (enc / key) IMMEDIATELY — before any
    // auth check or redirect. This ensures the encrypted license key is
    // never lost even if the user needs to be sent to the login page.
    // ==================================================================
    NonPUAuth.captureURLParams();

    // ========== Sidebar Toggle ==========
    // On mobile, start collapsed
    let sidebarOpen = window.innerWidth > 768;
    if (!sidebarOpen) sidebar.classList.add('collapsed');

    // Add overlay for mobile
    const overlay = document.createElement('div');
    overlay.className = 'dash-sidebar-overlay';
    document.body.appendChild(overlay);

    sidebarToggle.addEventListener('click', function () {
        sidebarOpen = !sidebarOpen;
        sidebar.classList.toggle('collapsed', !sidebarOpen);
        overlay.classList.toggle('visible', sidebarOpen && window.innerWidth <= 768);
    });

    overlay.addEventListener('click', function () {
        sidebarOpen = false;
        sidebar.classList.add('collapsed');
        overlay.classList.remove('visible');
    });

    // ========== Navigation ==========
    const PAGE_TITLES = {
        dashboard: 'Dashboard',
        licenses: 'Licenses',
        devices: 'Devices',
        account: 'Account'
    };

    function switchPage(name) {
        // Update nav items
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.nav === name);
        });

        // Show/hide pages
        pages.forEach(page => {
            page.style.display = page.id === 'page-' + name ? '' : 'none';
        });

        // Title
        pageTitle.textContent = PAGE_TITLES[name] || 'Dashboard';

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            sidebarOpen = false;
            sidebar.classList.add('collapsed');
            overlay.classList.remove('visible');
        }
    }

    // Expose globally for inline onclick handlers
    window.switchPage = switchPage;

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const nav = this.dataset.nav;
            if (nav) switchPage(nav);
        });
    });

    // ========== Wait for Supabase CDN, then Initialize ==========
    try {
        await NonPUAuth.waitForSupabase(10000);
        NonPUAuth.initSupabase();
    } catch (err) {
        console.warn('Supabase CDN timeout:', err.message);
        // Cannot proceed without Supabase — send to login
        hideLoading();
        window.location.href = '../';
        return;
    }

    // ========== Auth Check ==========
    let user = null;
    try {
        const result = await NonPUAuth.getCurrentUser();
        user = result && result.data ? result.data : result;
    } catch (err) {
        console.warn('Auth check failed:', err.message);
    }

    if (!user) {
        // Not signed in — redirect to login page.
        // The enc/key are already safely stored in localStorage
        // by captureURLParams() above, so they will survive this redirect.
        hideLoading();
        window.location.href = '../';
        return;
    }

    // ========== Populate User Info ==========
    const userEmail   = user.email || '';
    const userInitial = userEmail.charAt(0).toUpperCase();

    document.getElementById('userEmail').textContent   = userEmail;
    document.getElementById('accountEmail').textContent = userEmail;
    document.getElementById('createdAt').textContent    = user.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '—';

    // ========== Entity Data (from Supabase, with localStorage fallback) ==========
    let entityData = {};
    try {
        const { data: dbEntity, error: dbError } = await NonPUAuth.getEntityAccount();
        if (dbEntity && !dbError) {
            // Map DB column names → camelCase keys used by the dashboard
            entityData = {
                entityType:                    dbEntity.entity_type,
                entityName:                    dbEntity.entity_name,
                legalEntityName:               dbEntity.legal_entity_name,
                entityLogo:                    dbEntity.entity_logo,
                entityOriginLocation:          dbEntity.entity_origin_location,
                entityCountry:                 dbEntity.entity_country,
                entityOriginLocationAndCountry: dbEntity.entity_origin_location_and_country,
                entityEmails:                  dbEntity.entity_emails,
                companyRegistrationNumber:     dbEntity.company_registration_number,
                website:                       dbEntity.website,
                corporateDetails:              dbEntity.corporate_details,
                nonprofitDetails:              dbEntity.nonprofit_details
            };
            // Sync to localStorage so it stays fresh
            localStorage.setItem('nonpu_pending_entity', JSON.stringify(entityData));
        } else {
            // DB miss — fall back to localStorage (first-time signup before DB write finishes)
            entityData = JSON.parse(localStorage.getItem('nonpu_pending_entity') || '{}');

            // If we have localStorage data but no DB row, try to create it now
            if (entityData.entityName) {
                NonPUAuth.createEntityAccount(entityData).then(function(res) {
                    if (res.error) console.warn('Deferred entity save failed:', res.error);
                    else console.log('Deferred entity saved to DB');
                }).catch(function(err) {
                    console.warn('Deferred entity save error:', err);
                });
            }
        }
    } catch (entityErr) {
        console.warn('Entity fetch failed, using localStorage:', entityErr);
        entityData = JSON.parse(localStorage.getItem('nonpu_pending_entity') || '{}');
    }

    const entityName = entityData.entityName || userEmail.split('@')[0];
    const entityType = formatEntityType(entityData.entityType);
    const location   = buildLocation(entityData);

    // Dashboard hero
    document.getElementById('heroEntityName').textContent = entityName;
    document.getElementById('heroEntityType').textContent = entityType;
    document.getElementById('heroLocation').textContent   = location;

    // User name in titlebar
    document.getElementById('userName').textContent = entityName;

    // Account page
    if (entityData.entityName) {
        document.getElementById('entityType').textContent = entityType;
        document.getElementById('entityName').textContent = entityData.entityName;
        document.getElementById('legalName').textContent  = entityData.legalEntityName || entityData.entityName;
        document.getElementById('accountLocation').textContent = location;
    }

    // Badge card (Account sidebar)
    document.getElementById('badgeEntityName').textContent = entityName;
    document.getElementById('badgeEntityType').textContent = entityType;

    // Entity logo (if we have one in the pending data)
    if (entityData.entityLogo) {
        setEntityLogo(entityData.entityLogo);
    }

    // ========== Pending License ==========
    const pendingKey = typeof NonPUAuth !== 'undefined' ? NonPUAuth.getPendingLicenseKey() : null;
    if (pendingKey) {
        document.getElementById('pendingBanner').style.display = 'flex';
        document.getElementById('pendingBannerKey').textContent = pendingKey;
    }

    // ========== Load Licenses (remove shimmer) ==========
    loadLicenses(pendingKey);

    // ========== Encrypted License Key from Desktop Client ==========
    // Check localStorage first (saved by captureURLParams before auth redirect),
    // then fall back to URL param (direct visit while already signed in)
    const encryptedParam = localStorage.getItem('nonpu_pending_enc')
        || new URLSearchParams(window.location.search).get('enc');

    if (encryptedParam) {
        // Desktop client sent an encrypted license key — decrypt it
        try {
            const decryptedKey = await decryptLicenseKey(encryptedParam);

            if (decryptedKey && decryptedKey.startsWith('NP-')) {
                // Valid license key — store temporarily, never show to user
                localStorage.setItem(NONPU_CRYPTO.STORAGE_KEY, decryptedKey);

                // Clear the pending enc — it's been consumed
                localStorage.removeItem('nonpu_pending_enc');

                // Clean the URL (remove enc param)
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, '', cleanUrl);

                // Check if this key already exists in the database
                switchPage('licenses');
                await routeLicenseKey(decryptedKey);
            } else {
                // Decryption produced invalid data
                localStorage.removeItem('nonpu_pending_enc');
                switchPage('licenses');
                document.getElementById('extendInvalidCard').style.display = '';
                sendAppCallback(0);
            }
        } catch (e) {
            console.error('License decryption error:', e);
            localStorage.removeItem('nonpu_pending_enc');
            switchPage('licenses');
            document.getElementById('extendInvalidCard').style.display = '';
            sendAppCallback(0);
        }
    } else {
        // Check if there's a stored temp license (user may have refreshed)
        const storedTempKey = localStorage.getItem(NONPU_CRYPTO.STORAGE_KEY);
        if (storedTempKey) {
            await routeLicenseKey(storedTempKey);
        }
    }

    /**
     * Route to the correct card based on whether the license key exists in DB.
     * - Key EXISTS → Extend License (extend expiration)
     * - Key does NOT exist → Activate New License (new DB entry)
     */
    async function routeLicenseKey(licenseKey) {
        try {
            const { data: existingLicense } = await NonPUAuth.getLicenseByKey(licenseKey);

            if (existingLicense) {
                // KEY EXISTS → show Extend card
                document.getElementById('extendLicenseCard').style.display = '';
                document.getElementById('newLicenseCard').style.display = 'none';

                // Show current expiry if available
                const expiryEl = document.getElementById('extendCurrentExpiry');
                if (expiryEl && existingLicense.expiration_date) {
                    const expDate = new Date(existingLicense.expiration_date);
                    expiryEl.textContent = 'Current expiry: ' + expDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                    expiryEl.style.display = '';
                }
            } else {
                // KEY DOES NOT EXIST → show New License / Activate card
                document.getElementById('newLicenseCard').style.display = '';
                document.getElementById('extendLicenseCard').style.display = 'none';
            }
        } catch (e) {
            console.warn('DB check failed, defaulting to new license flow:', e);
            // If DB check fails, default to new license
            document.getElementById('newLicenseCard').style.display = '';
            document.getElementById('extendLicenseCard').style.display = 'none';
        }
    }

    // ========== Extend License (Free Promotion) ==========
    const extendPayBtn = document.getElementById('extendPayBtn');
    if (extendPayBtn) {
        extendPayBtn.addEventListener('click', async function () {
            const extendError = document.getElementById('extendError');
            extendError.style.display = 'none';

            const tempKey = localStorage.getItem(NONPU_CRYPTO.STORAGE_KEY);
            if (!tempKey) {
                extendError.style.display = 'flex';
                document.getElementById('extendErrorText').textContent = 'No license key found. Please initiate from the NonPU Instant application.';
                return;
            }

            showLoading();
            extendPayBtn.disabled = true;
            extendPayBtn.innerHTML = '<span>Activating...</span>';

            try {
                // Extend the expiration by 1 year from current expiry (or from now)
                const { data: license } = await NonPUAuth.getLicenseByKey(tempKey);
                let newExpiry = new Date();
                if (license && license.expiration_date) {
                    const currentExpiry = new Date(license.expiration_date);
                    // If current expiry is in the future, extend from there; otherwise from now
                    newExpiry = currentExpiry > new Date() ? currentExpiry : new Date();
                }
                newExpiry.setFullYear(newExpiry.getFullYear() + 1);

                // Update expiration in database (claims unclaimed seed keys)
                const activateResult = await NonPUAuth.activateLicense(tempKey, {
                    entityName: entityData.entityName || '',
                    legalEntityName: entityData.legalEntityName || '',
                    entityType: entityData.entityType || ''
                });
                if (activateResult.error) {
                    throw new Error(activateResult.error.message || activateResult.error || 'License activation failed');
                }

                // Create payment record (free promotion — $0)
                await NonPUAuth.createPaymentRecord(tempKey, 0, 'free_promotion');

                // Clean up temp storage
                localStorage.removeItem(NONPU_CRYPTO.STORAGE_KEY);

                // Show success
                document.getElementById('extendPaymentForm').style.display = 'none';
                document.getElementById('extendSuccess').style.display = '';

                // Send success callback to desktop app
                sendAppCallback(1);
                hideLoading();
            } catch (error) {
                hideLoading();
                extendPayBtn.disabled = false;
                extendPayBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    Extend \u2014 Free
                `;
                extendError.style.display = 'flex';
                document.getElementById('extendErrorText').textContent = error.message || 'Activation failed. Please try again.';
                sendAppCallback(0);
            }
        });
    }

    // ========== New License / Activate (Free Promotion) ==========
    const newLicensePayBtn = document.getElementById('newLicensePayBtn');
    if (newLicensePayBtn) {
        newLicensePayBtn.addEventListener('click', async function () {
            const newError = document.getElementById('newLicenseError');
            newError.style.display = 'none';

            const tempKey = localStorage.getItem(NONPU_CRYPTO.STORAGE_KEY);
            if (!tempKey) {
                newError.style.display = 'flex';
                document.getElementById('newLicenseErrorText').textContent = 'No license key found. Please initiate from the NonPU Instant application.';
                return;
            }

            showLoading();
            newLicensePayBtn.disabled = true;
            newLicensePayBtn.innerHTML = '<span>Activating...</span>';

            try {
                // 1. Register key in license_key_registry
                await NonPUAuth.markKeyAssigned(tempKey);

                // 2. Create new license entry in database
                await NonPUAuth.addPendingLicense(tempKey);

                // 3. Activate it immediately (free promotion — no Stripe)
                //    This also claims unclaimed seed keys (user_id = null → current user)
                const activateResult = await NonPUAuth.activateLicense(tempKey, {
                    entityName: entityData.entityName || '',
                    legalEntityName: entityData.legalEntityName || '',
                    entityType: entityData.entityType || '',
                    entityOriginLocationAndCountry: entityData.entityOriginLocationAndCountry || (buildLocation(entityData) !== '\u2014' ? buildLocation(entityData) : ''),
                    entityEmail: entityData.entityEmails || {},
                    companyRegistrationNumber: entityData.companyRegistrationNumber || null,
                    website: entityData.website || null
                });
                if (activateResult.error) {
                    throw new Error(activateResult.error.message || activateResult.error || 'License activation failed');
                }

                // 4. Also save entity account if not already saved
                try {
                    const existingEntity = await NonPUAuth.getEntityAccount();
                    if (!existingEntity.data) {
                        await NonPUAuth.createEntityAccount(entityData);
                    }
                } catch (eErr) {
                    console.warn('Entity save skipped:', eErr);
                }

                // 5. Create payment record (free promotion — $0)
                await NonPUAuth.createPaymentRecord(tempKey, 0, 'free_promotion');

                // Clean up temp storage
                localStorage.removeItem(NONPU_CRYPTO.STORAGE_KEY);

                // Show success
                document.getElementById('newLicensePaymentForm').style.display = 'none';
                document.getElementById('newLicenseSuccess').style.display = '';

                // Send success callback to desktop app
                sendAppCallback(1);
                hideLoading();
            } catch (error) {
                hideLoading();
                newLicensePayBtn.disabled = false;
                newLicensePayBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    Activate \u2014 Free
                `;
                newError.style.display = 'flex';
                document.getElementById('newLicenseErrorText').textContent = error.message || 'Activation failed. Please try again.';
                sendAppCallback(0);
            }
        });
    }

    // ========== Done ==========
    hideLoading();

    // ========================================================
    //  HELPER FUNCTIONS
    // ========================================================

    function formatEntityType(type) {
        if (!type) return '—';
        return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    function buildLocation(data) {
        const parts = [];
        if (data.entityOriginLocation) parts.push(data.entityOriginLocation);
        if (data.entityCountry)        parts.push(data.entityCountry);
        return parts.length > 0 ? parts.join(', ') : '—';
    }

    function setEntityLogo(src) {
        const heroLogo  = document.getElementById('heroEntityLogo');
        const badgeLogo = document.getElementById('badgeEntityLogo');
        const watermark = document.getElementById('heroWatermark');
        if (heroLogo)  heroLogo.src  = src;
        if (badgeLogo) badgeLogo.src = src;
        if (watermark)  watermark.src = src;
    }

    function loadLicenses(pendingKey) {
        const shimmer    = document.getElementById('licenseShimmer');
        const container  = document.getElementById('licensesContainer');
        const emptyState = document.getElementById('emptyState');

        // Hide shimmer
        if (shimmer) shimmer.style.display = 'none';

        const licenses = [];

        if (pendingKey) {
            licenses.push({
                key: pendingKey,
                status: 'pending',
                type: 'Standard License',
                expiresAt: null,
                activatedAt: null
            });
        }

        // Update metrics
        document.getElementById('metricLicenses').textContent = licenses.length;
        document.getElementById('metricActive').textContent   = licenses.filter(l => l.status === 'active').length;

        if (licenses.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        licenses.forEach(license => {
            const card = document.createElement('div');
            card.className = 'dash-license-card';
            card.innerHTML = `
                <div class="dash-license-top">
                    <span class="dash-license-key">${escapeHtml(license.key)}</span>
                    <span class="dash-license-status ${license.status}">
                        ${license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                    </span>
                </div>
                <div class="dash-license-details">
                    <div>
                        <span class="dash-license-detail-label">Type: </span>
                        <span class="dash-license-detail-value">${escapeHtml(license.type)}</span>
                    </div>
                    <div>
                        <span class="dash-license-detail-label">Expires: </span>
                        <span class="dash-license-detail-value">${license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'Not activated'}</span>
                    </div>
                </div>
                ${license.status === 'pending' ? `
                    <div class="dash-license-actions">
                        <button class="dash-license-btn dash-license-btn-primary" onclick="activatePendingLicense()">Activate \u2014 Free</button>
                        <button class="dash-license-btn dash-license-btn-secondary" onclick="removePendingLicense()">Remove</button>
                    </div>
                ` : ''}
            `;
            container.insertBefore(card, emptyState);
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});

// ========== Global Actions ==========

function activatePendingLicense() {
    // Navigate to the Licenses tab where extension can happen
    const navItems = document.querySelectorAll('.dash-nav-item[data-nav]');
    navItems.forEach(item => item.classList.toggle('active', item.dataset.nav === 'licenses'));
    document.querySelectorAll('.dash-page').forEach(page => {
        page.style.display = page.id === 'page-licenses' ? '' : 'none';
    });
    document.getElementById('pageTitle').textContent = 'Licenses';
}

function removePendingLicense() {
    if (confirm('Are you sure you want to remove this pending license? You can add it again later.')) {
        localStorage.removeItem('nonpu_pending_license_key');
        window.location.reload();
    }
}

async function handleSignOut() {
    try {
        await NonPUAuth.signOut();
    } catch (e) {
        console.warn('Sign out error:', e);
    }
    window.location.href = '../';
}
