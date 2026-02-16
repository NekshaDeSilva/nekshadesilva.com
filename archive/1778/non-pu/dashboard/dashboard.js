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

    // ========== Initialize Supabase ==========
    try {
        NonPUAuth.initSupabase();
    } catch (err) {
        console.warn('Supabase init skipped:', err.message);
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

    // ========== Entity Data (from localStorage) ==========
    const entityData = JSON.parse(localStorage.getItem('nonpu_pending_entity') || '{}');
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
    const urlParams = new URLSearchParams(window.location.search);
    const encryptedParam = urlParams.get('enc');

    if (encryptedParam) {
        // Desktop client sent an encrypted license key — decrypt it
        try {
            const decryptedKey = await decryptLicenseKey(encryptedParam);

            if (decryptedKey && decryptedKey.startsWith('NP-')) {
                // Valid license key — store temporarily, never show to user
                localStorage.setItem(NONPU_CRYPTO.STORAGE_KEY, decryptedKey);

                // Switch to Licenses tab and show extend card
                switchPage('licenses');
                document.getElementById('extendLicenseCard').style.display = '';

                // Clean the URL (remove enc param)
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, '', cleanUrl);
            } else {
                // Decryption produced invalid data
                switchPage('licenses');
                document.getElementById('extendInvalidCard').style.display = '';
                sendAppCallback(0);
            }
        } catch (e) {
            console.error('License decryption error:', e);
            switchPage('licenses');
            document.getElementById('extendInvalidCard').style.display = '';
            sendAppCallback(0);
        }
    } else {
        // Check if there's a stored temp license (user may have refreshed)
        const storedTempKey = localStorage.getItem(NONPU_CRYPTO.STORAGE_KEY);
        if (storedTempKey) {
            document.getElementById('extendLicenseCard').style.display = '';
        }
    }

    // ========== Extend License Payment ==========
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
            extendPayBtn.innerHTML = '<span>Processing...</span>';

            try {
                // In production: redirect to Stripe checkout
                // const session = await fetch('/api/create-checkout', { ... });
                // window.location.href = session.url;

                // Simulated payment delay
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Payment successful — clean up
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                    Pay $99.00
                `;
                extendError.style.display = 'flex';
                document.getElementById('extendErrorText').textContent = error.message || 'Payment failed. Please try again.';

                // Send failure callback
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
                        <button class="dash-license-btn dash-license-btn-primary" onclick="activatePendingLicense()">Activate — $99.00</button>
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
