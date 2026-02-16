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
 * Decrypt an encrypted license key from the NonPU Instant C desktop client.
 *
 * C client encryption (payment.c):
 *   1. Key derivation: PBKDF2-HMAC-SHA256, 100 000 iterations
 *      - password = ENCRYPTION_SALT ("BNGF50678#RTY")
 *      - salt     = same string zero-padded to 16 bytes
 *      - output   = 32-byte AES key
 *   2. Random 16-byte IV
 *   3. AES-256-CBC with manual PKCS7 padding
 *   4. Output = base64url( IV‖ciphertext )   (+ → -, / → _)
 */
async function decryptLicenseKey(encryptedB64) {
    try {
        // 1. Undo URL-safe base64: restore standard chars
        let b64 = encryptedB64
            .replace(/ /g, '+')     // spaces from URL transport
            .replace(/-/g, '+')     // URL-safe minus  → +
            .replace(/_/g, '/');    // URL-safe underscore → /
        while (b64.length % 4 !== 0) b64 += '=';

        console.log('[NonPU] Decrypting, b64 length:', b64.length);

        // 2. Decode base64 → raw bytes
        const raw = atob(b64);
        const bytes = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
        console.log('[NonPU] Raw bytes:', bytes.length, '(expect 48 for a 22-char key)');

        if (bytes.length < 32) {
            console.error('[NonPU] Data too short — need at least IV(16) + 1 block(16)');
            return null;
        }

        // 3. Split: first 16 bytes = IV, rest = ciphertext
        const iv = bytes.slice(0, 16);
        const ciphertext = bytes.slice(16);

        // 4. Derive the AES-256 key exactly as the C client does:
        //    PBKDF2( password = "BNGF50678#RTY",
        //            salt     = "BNGF50678#RTY" + 3 zero-bytes  → 16 bytes,
        //            iters    = 100 000,
        //            hash     = SHA-256,
        //            dkLen    = 32 )
        const enc = new TextEncoder();
        const passwordBytes = enc.encode(NONPU_CRYPTO.SALT);      // 13 bytes

        // Build the 16-byte salt: salt string bytes + zero-padding
        const saltPadded = new Uint8Array(16);                     // all zeros
        saltPadded.set(passwordBytes);                             // copy 13 bytes, last 3 stay 0x00

        // Import password as PBKDF2 key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw', passwordBytes, 'PBKDF2', false, ['deriveKey']
        );

        // Derive the 256-bit AES key
        const aesKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltPadded,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-CBC', length: 256 },
            false,
            ['decrypt']
        );

        console.log('[NonPU] PBKDF2 key derived (salt-padded-16, 100k iters)');

        // 5. Decrypt AES-256-CBC
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv: iv },
            aesKey,
            ciphertext
        );

        const result = new TextDecoder().decode(decrypted);
        console.log('[NonPU] Decrypted successfully:', result.substring(0, 7) + '...');

        if (!result.startsWith('NP-')) {
            console.warn('[NonPU] Decrypted value does not start with NP-:', result.substring(0, 20));
        }

        return result;
    } catch (e) {
        console.error('[NonPU] Decryption failed:', e.message || e);
        console.error('[NonPU] Input (first 60 chars):', encryptedB64 ? encryptedB64.substring(0, 60) : 'null');
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
        console.log('[NonPU] Encrypted param found, length:', encryptedParam.length);
        try {
            const decryptedKey = await decryptLicenseKey(encryptedParam);

            if (decryptedKey && decryptedKey.startsWith('NP-')) {
                console.log('[NonPU] Valid key decrypted:', decryptedKey.substring(0, 7) + '...');
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
                console.error('[NonPU] Decryption result invalid:', decryptedKey ? ('got: ' + decryptedKey.substring(0, 20)) : 'null');
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

    // ========== Activation Overlay Helpers ==========
    function showActivationOverlay(title, sub, mode) {
        var ol = document.getElementById('activationOverlay');
        document.getElementById('activationTitle').textContent = title || 'Activating License';
        document.getElementById('activationSub').textContent   = sub || 'Verifying your license key and setting up your account…';
        document.getElementById('activationSpinner').style.display = '';
        document.getElementById('activationSteps').style.display   = '';
        document.getElementById('activationSuccess').style.display = 'none';
        // Store mode so success knows which image to show
        ol.dataset.mode = mode || 'extend';
        // Reset all steps
        ['step-verify','step-register','step-activate','step-done'].forEach(function(id) {
            var el = document.getElementById(id);
            el.classList.remove('done');
            el.querySelector('.nonpu-step-icon').classList.remove('nonpu-step-active','nonpu-step-done');
        });
        // Start first step
        var first = document.getElementById('step-verify');
        first.querySelector('.nonpu-step-icon').classList.add('nonpu-step-active');
        ol.classList.add('visible');
    }
    function advanceStep(stepId) {
        var el = document.getElementById(stepId);
        el.classList.add('done');
        el.querySelector('.nonpu-step-icon').classList.remove('nonpu-step-active');
        el.querySelector('.nonpu-step-icon').classList.add('nonpu-step-done');
        // Activate next sibling step
        var next = el.nextElementSibling;
        if (next && next.classList.contains('nonpu-step')) {
            next.querySelector('.nonpu-step-icon').classList.add('nonpu-step-active');
        }
    }
    function showActivationSuccess() {
        var ol = document.getElementById('activationOverlay');
        var mode = ol.dataset.mode || 'extend';
        var img = document.getElementById('activationSuccessImg');
        var highlight = document.getElementById('activationSuccessHighlight');

        // Set the correct mockup image and highlight text
        if (mode === 'new') {
            img.src = '../../assets/nonpu_model_sd_card_b ig.png';
            img.alt = 'NonPU Micro SD';
            highlight.textContent = 'Your NonPU Instant license is now active.';
            document.querySelector('.nonpu-activation-success-title').textContent = 'License Activated';
        } else {
            img.src = '../../assets/nonpu_license_dummy.png';
            img.alt = 'License';
            highlight.textContent = 'Your subscription has been extended by 1 year.';
            document.querySelector('.nonpu-activation-success-title').textContent = 'License Extended';
        }

        document.getElementById('activationSpinner').style.display = 'none';
        document.getElementById('activationSteps').style.display   = 'none';
        document.getElementById('activationSuccess').style.display = '';
    }
    function hideActivationOverlay() {
        document.getElementById('activationOverlay').classList.remove('visible');
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

            showActivationOverlay('Extending License', 'Extending your subscription period…', 'extend');

            try {
                // Step 1 — Verify
                await sleep(400);
                const { data: license } = await NonPUAuth.getLicenseByKey(tempKey);
                let newExpiry = new Date();
                if (license && license.expiration_date) {
                    const currentExpiry = new Date(license.expiration_date);
                    newExpiry = currentExpiry > new Date() ? currentExpiry : new Date();
                }
                newExpiry.setFullYear(newExpiry.getFullYear() + 1);
                advanceStep('step-verify');

                // Step 2 — Register
                await sleep(350);
                advanceStep('step-register');

                // Step 3 — Activate
                await sleep(300);
                const activateResult = await NonPUAuth.activateLicense(tempKey, {
                    entityName: entityData.entityName || '',
                    legalEntityName: entityData.legalEntityName || '',
                    entityType: entityData.entityType || '',
                    entityOriginLocationAndCountry: entityData.entityOriginLocationAndCountry || (buildLocation(entityData) !== '\u2014' ? buildLocation(entityData) : ''),
                    entityEmail: entityData.entityEmails || {},
                    companyRegistrationNumber: entityData.companyRegistrationNumber || null,
                    website: entityData.website || null
                }, newExpiry);
                if (activateResult.error) {
                    throw new Error(activateResult.error.message || activateResult.error || 'License activation failed');
                }
                advanceStep('step-activate');

                // Step 4 — Finalize
                await sleep(300);
                await NonPUAuth.createPaymentRecord(tempKey, 0, 'free_promotion');
                localStorage.removeItem(NONPU_CRYPTO.STORAGE_KEY);
                advanceStep('step-done');

                // Show success state
                await sleep(500);
                showActivationSuccess();
                sendAppCallback(1);

                // Return to dashboard after brief pause
                await sleep(2200);
                hideActivationOverlay();
                document.getElementById('extendPaymentForm').style.display = 'none';
                document.getElementById('extendSuccess').style.display = '';
                await loadLicenses(null);   // Refresh license list
                switchPage('dashboard');
            } catch (error) {
                hideActivationOverlay();
                extendPayBtn.disabled = false;
                extendPayBtn.innerHTML =
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' +
                    ' Extend \u2014 Free';
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

            showActivationOverlay('Activating License', 'Setting up your new NonPU Instant license…', 'new');

            try {
                // Step 1 — Verify key
                await sleep(400);
                advanceStep('step-verify');

                // Step 2 — Register key
                await sleep(350);
                await NonPUAuth.markKeyAssigned(tempKey);
                await NonPUAuth.addPendingLicense(tempKey);
                advanceStep('step-register');

                // Step 3 — Activate
                await sleep(300);
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

                // Save entity if needed
                try {
                    const existingEntity = await NonPUAuth.getEntityAccount();
                    if (!existingEntity.data) {
                        await NonPUAuth.createEntityAccount(entityData);
                    }
                } catch (eErr) {
                    console.warn('Entity save skipped:', eErr);
                }
                advanceStep('step-activate');

                // Step 4 — Finalize
                await sleep(300);
                await NonPUAuth.createPaymentRecord(tempKey, 0, 'free_promotion');
                localStorage.removeItem(NONPU_CRYPTO.STORAGE_KEY);
                advanceStep('step-done');

                // Show success
                await sleep(500);
                showActivationSuccess();
                sendAppCallback(1);

                // Return to dashboard after brief pause
                await sleep(2200);
                hideActivationOverlay();
                document.getElementById('newLicensePaymentForm').style.display = 'none';
                document.getElementById('newLicenseSuccess').style.display = '';
                await loadLicenses(null);   // Refresh license list
                switchPage('dashboard');
            } catch (error) {
                hideActivationOverlay();
                newLicensePayBtn.disabled = false;
                newLicensePayBtn.innerHTML =
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' +
                    ' Activate \u2014 Free';
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

    function sleep(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }

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

    async function loadLicenses(pendingKey) {
        const shimmer          = document.getElementById('licenseShimmer');
        const container        = document.getElementById('licensesContainer');
        const emptyState       = document.getElementById('emptyState');
        const fullContainer    = document.getElementById('licensesFullContainer');
        const fullEmpty        = document.getElementById('licensesFullEmpty');
        const devicesContainer = document.getElementById('devicesContainer');
        const devicesEmpty     = document.getElementById('devicesEmpty');

        // ---- Fetch real license data from Supabase ----
        let licenses = [];
        try {
            const { data, error } = await NonPUAuth.getUserLicenses();
            if (!error && data && data.length > 0) {
                licenses = data.map(function(l) {
                    return {
                        key:         l.license_key || '',
                        status:      l.status || 'pending',
                        type:        'NonPU Instant License',
                        entityName:  l.entity_name || '',
                        expiresAt:   l.expiration_date || null,
                        activatedAt: l.activated_at || l.created_at || null
                    };
                });
            }
        } catch (err) {
            console.warn('Failed to load licenses from DB:', err);
        }

        // Add local pending key if it's not already in the DB list
        if (pendingKey && !licenses.some(function(l){ return l.key === pendingKey; })) {
            licenses.unshift({
                key: pendingKey,
                status: 'pending',
                type: 'NonPU Instant License',
                entityName: '',
                expiresAt: null,
                activatedAt: null
            });
        }

        // ---- Compute metrics ----
        var activeCount  = licenses.filter(function(l){ return l.status === 'active'; }).length;
        var expiredCount = licenses.filter(function(l){ return l.status === 'expired'; }).length;

        document.getElementById('metricLicenses').textContent = licenses.length;
        document.getElementById('metricActive').textContent   = activeCount;

        // Next expiry (soonest future date)
        var now = new Date();
        var nextExpiry = null;
        licenses.forEach(function(l) {
            if (l.expiresAt) {
                var d = new Date(l.expiresAt);
                if (d > now && (!nextExpiry || d < nextExpiry)) nextExpiry = d;
            }
        });
        document.getElementById('metricExpiry').textContent = nextExpiry
            ? nextExpiry.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : '—';

        // ---- Render: Dashboard "Your Licenses" card ----
        if (shimmer) shimmer.style.display = 'none';

        // Remove any previously rendered license cards
        container.querySelectorAll('.dash-license-card').forEach(function(el){ el.remove(); });

        if (licenses.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            licenses.forEach(function(license) {
                container.insertBefore(buildLicenseCard(license, true), emptyState);
            });
        }

        // ---- Render: Licenses page full list ----
        if (fullContainer) {
            fullContainer.querySelectorAll('.dash-license-card').forEach(function(el){ el.remove(); });
            if (licenses.length === 0) {
                if (fullEmpty) fullEmpty.style.display = '';
            } else {
                if (fullEmpty) fullEmpty.style.display = 'none';
                licenses.forEach(function(license) {
                    fullContainer.insertBefore(buildLicenseCard(license, false), fullEmpty);
                });
            }
        }

        // ---- Load and render device bindings ----
        var deviceCount = 0;
        if (devicesContainer) {
            devicesContainer.querySelectorAll('.dash-device-card').forEach(function(el){ el.remove(); });

            try {
                // Gather device bindings for each active license
                var devicePromises = licenses
                    .filter(function(l){ return l.status === 'active'; })
                    .map(function(l){ return NonPUAuth.getDeviceBinding(l.key).then(function(r){ return { license: l, data: r.data }; }).catch(function(){ return null; }); });

                var deviceResults = await Promise.all(devicePromises);
                deviceResults.forEach(function(r) {
                    if (r && r.data) {
                        deviceCount++;
                        var d = r.data;
                        var card = document.createElement('div');
                        card.className = 'dash-device-card dash-license-card';
                        card.innerHTML =
                            '<div class="dash-license-top">' +
                                '<span class="dash-license-key">' + escapeHtml(d.device_name || d.device_id || 'Unknown Device') + '</span>' +
                                '<span class="dash-license-status active">Bound</span>' +
                            '</div>' +
                            '<div class="dash-license-details">' +
                                '<div><span class="dash-license-detail-label">License: </span><span class="dash-license-detail-value">' + escapeHtml(r.license.key) + '</span></div>' +
                                '<div><span class="dash-license-detail-label">Bound: </span><span class="dash-license-detail-value">' +
                                    (d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—') +
                                '</span></div>' +
                            '</div>';
                        devicesContainer.insertBefore(card, devicesEmpty);
                    }
                });
            } catch (devErr) {
                console.warn('Device bindings load error:', devErr);
            }

            if (deviceCount === 0) {
                if (devicesEmpty) devicesEmpty.style.display = '';
            } else {
                if (devicesEmpty) devicesEmpty.style.display = 'none';
            }
        }
        document.getElementById('metricDevices').textContent = deviceCount;
    }

    /**
     * Build a styled license card element.
     * @param {Object} license   - { key, status, type, entityName, expiresAt, activatedAt }
     * @param {boolean} compact  - true = dashboard summary, false = full licenses page
     */
    function buildLicenseCard(license, compact) {
        var statusClass = license.status === 'active' ? 'active'
                        : license.status === 'expired' ? 'expired'
                        : 'pending';
        var statusLabel = license.status.charAt(0).toUpperCase() + license.status.slice(1);

        var expiryText = license.expiresAt
            ? new Date(license.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'Not activated';

        var activatedText = license.activatedAt
            ? new Date(license.activatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : '—';

        var card = document.createElement('div');
        card.className = 'dash-license-card';
        card.innerHTML =
            '<div class="dash-license-top">' +
                '<span class="dash-license-key">' + escapeHtml(license.key) + '</span>' +
                '<span class="dash-license-status ' + statusClass + '">' + statusLabel + '</span>' +
            '</div>' +
            '<div class="dash-license-details">' +
                '<div><span class="dash-license-detail-label">Type: </span><span class="dash-license-detail-value">' + escapeHtml(license.type) + '</span></div>' +
                '<div><span class="dash-license-detail-label">Expires: </span><span class="dash-license-detail-value">' + expiryText + '</span></div>' +
                (compact ? '' : '<div><span class="dash-license-detail-label">Activated: </span><span class="dash-license-detail-value">' + activatedText + '</span></div>') +
                (license.entityName && !compact ? '<div><span class="dash-license-detail-label">Entity: </span><span class="dash-license-detail-value">' + escapeHtml(license.entityName) + '</span></div>' : '') +
            '</div>' +
            (license.status === 'pending' ? (
                '<div class="dash-license-actions">' +
                    '<button class="dash-license-btn dash-license-btn-primary" onclick="activatePendingLicense()">Activate \u2014 Free</button>' +
                    '<button class="dash-license-btn dash-license-btn-secondary" onclick="removePendingLicense()">Remove</button>' +
                '</div>'
            ) : '');

        return card;
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
