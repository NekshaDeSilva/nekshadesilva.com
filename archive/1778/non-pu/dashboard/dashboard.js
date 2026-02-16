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
 * Minimal MD5 implementation for EVP_BytesToKey compatibility.
 * Only used internally — NOT for security purposes.
 */
function md5(input) {
    // input is Uint8Array, returns Uint8Array(16)
    function safeAdd(x, y) { var l = (x & 0xFFFF) + (y & 0xFFFF); return ((x >> 16) + (y >> 16) + (l >> 16)) << 16 | l & 0xFFFF; }
    function md5cmn(q, a, b, x, s, t) { var r = safeAdd(safeAdd(a, q), safeAdd(x, t)); return safeAdd((r << s) | (r >>> (32 - s)), b); }
    function ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }

    var bytes = input;
    var len = bytes.length;
    // Pre-processing: pad to 64-byte blocks
    var bitLen = len * 8;
    var padded = new Uint8Array(((len + 8 >> 6) + 1) * 64);
    padded.set(bytes);
    padded[len] = 0x80;
    var dv = new DataView(padded.buffer);
    dv.setUint32(padded.length - 8, bitLen & 0xFFFFFFFF, true);
    dv.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000), true);

    var a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
    for (var i = 0; i < padded.length; i += 64) {
        var M = [];
        for (var j = 0; j < 16; j++) M[j] = dv.getUint32(i + j * 4, true);
        var aa = a, bb = b, cc = c, dd = d;
        a = ff(a, b, c, d, M[0], 7, -680876936); d = ff(d, a, b, c, M[1], 12, -389564586); c = ff(c, d, a, b, M[2], 17, 606105819); b = ff(b, c, d, a, M[3], 22, -1044525330);
        a = ff(a, b, c, d, M[4], 7, -176418897); d = ff(d, a, b, c, M[5], 12, 1200080426); c = ff(c, d, a, b, M[6], 17, -1473231341); b = ff(b, c, d, a, M[7], 22, -45705983);
        a = ff(a, b, c, d, M[8], 7, 1770035416); d = ff(d, a, b, c, M[9], 12, -1958414417); c = ff(c, d, a, b, M[10], 17, -42063); b = ff(b, c, d, a, M[11], 22, -1990404162);
        a = ff(a, b, c, d, M[12], 7, 1804603682); d = ff(d, a, b, c, M[13], 12, -40341101); c = ff(c, d, a, b, M[14], 17, -1502002290); b = ff(b, c, d, a, M[15], 22, 1236535329);
        a = gg(a, b, c, d, M[1], 5, -165796510); d = gg(d, a, b, c, M[6], 9, -1069501632); c = gg(c, d, a, b, M[11], 14, 643717713); b = gg(b, c, d, a, M[0], 20, -373897302);
        a = gg(a, b, c, d, M[5], 5, -701558691); d = gg(d, a, b, c, M[10], 9, 38016083); c = gg(c, d, a, b, M[15], 14, -660478335); b = gg(b, c, d, a, M[4], 20, -405537848);
        a = gg(a, b, c, d, M[9], 5, 568446438); d = gg(d, a, b, c, M[14], 9, -1019803690); c = gg(c, d, a, b, M[3], 14, -187363961); b = gg(b, c, d, a, M[8], 20, 1163531501);
        a = gg(a, b, c, d, M[13], 5, -1444681467); d = gg(d, a, b, c, M[2], 9, -51403784); c = gg(c, d, a, b, M[7], 14, 1735328473); b = gg(b, c, d, a, M[12], 20, -1926607734);
        a = hh(a, b, c, d, M[5], 4, -378558); d = hh(d, a, b, c, M[8], 11, -2022574463); c = hh(c, d, a, b, M[11], 16, 1839030562); b = hh(b, c, d, a, M[14], 23, -35309556);
        a = hh(a, b, c, d, M[1], 4, -1530992060); d = hh(d, a, b, c, M[4], 11, 1272893353); c = hh(c, d, a, b, M[7], 16, -155497632); b = hh(b, c, d, a, M[10], 23, -1094730640);
        a = hh(a, b, c, d, M[13], 4, 681279174); d = hh(d, a, b, c, M[0], 11, -358537222); c = hh(c, d, a, b, M[3], 16, -722521979); b = hh(b, c, d, a, M[6], 23, 76029189);
        a = hh(a, b, c, d, M[9], 4, -640364487); d = hh(d, a, b, c, M[12], 11, -421815835); c = hh(c, d, a, b, M[15], 16, 530742520); b = hh(b, c, d, a, M[2], 23, -995338651);
        a = ii(a, b, c, d, M[0], 6, -198630844); d = ii(d, a, b, c, M[7], 10, 1126891415); c = ii(c, d, a, b, M[14], 15, -1416354905); b = ii(b, c, d, a, M[5], 21, -57434055);
        a = ii(a, b, c, d, M[12], 6, 1700485571); d = ii(d, a, b, c, M[3], 10, -1894986606); c = ii(c, d, a, b, M[10], 15, -1051523); b = ii(b, c, d, a, M[1], 21, -2054922799);
        a = ii(a, b, c, d, M[8], 6, 1873313359); d = ii(d, a, b, c, M[15], 10, -30611744); c = ii(c, d, a, b, M[6], 15, -1560198380); b = ii(b, c, d, a, M[13], 21, 1309151649);
        a = ii(a, b, c, d, M[4], 6, -145523070); d = ii(d, a, b, c, M[11], 10, -1120210379); c = ii(c, d, a, b, M[2], 15, 718787259); b = ii(b, c, d, a, M[9], 21, -343485551);
        a = safeAdd(a, aa); b = safeAdd(b, bb); c = safeAdd(c, cc); d = safeAdd(d, dd);
    }
    var result = new Uint8Array(16);
    var rdv = new DataView(result.buffer);
    rdv.setUint32(0, a, true); rdv.setUint32(4, b, true); rdv.setUint32(8, c, true); rdv.setUint32(12, d, true);
    return result;
}

/**
 * Derive AES keys using multiple methods to match the C desktop client.
 * Tries every common C/OpenSSL encryption pattern.
 */
async function deriveKeys(salt) {
    const enc = new TextEncoder();
    const saltBytes = enc.encode(salt);
    const keys = [];

    // --- Method 1: SHA-256(salt) = 32-byte AES key ---
    try {
        const hash = await crypto.subtle.digest('SHA-256', saltBytes);
        const key = await crypto.subtle.importKey(
            'raw', hash, { name: 'AES-CBC' }, false, ['decrypt']
        );
        keys.push({ key, method: 'SHA-256(salt)' });
    } catch (e) { /* skip */ }

    // --- Method 2: Raw salt zero-padded to 32 bytes ---
    try {
        const padded = new Uint8Array(32);
        padded.set(saltBytes);  // rest is zeros
        const key = await crypto.subtle.importKey(
            'raw', padded, { name: 'AES-CBC' }, false, ['decrypt']
        );
        keys.push({ key, method: 'ZeroPad(salt, 32)' });
    } catch (e) { /* skip */ }

    // --- Method 3: Raw salt zero-padded to 16 bytes (AES-128) ---
    try {
        const padded16 = new Uint8Array(16);
        padded16.set(saltBytes.slice(0, 16));
        const key = await crypto.subtle.importKey(
            'raw', padded16, { name: 'AES-CBC' }, false, ['decrypt']
        );
        keys.push({ key, method: 'ZeroPad(salt, 16) AES-128' });
    } catch (e) { /* skip */ }

    // --- Method 4: OpenSSL EVP_BytesToKey (MD5, no explicit salt) ---
    // D1 = MD5(password), D2 = MD5(D1 + password), key = D1 + D2
    try {
        var d1 = md5(saltBytes);
        var concat = new Uint8Array(d1.length + saltBytes.length);
        concat.set(d1); concat.set(saltBytes, d1.length);
        var d2 = md5(concat);
        var evpKey = new Uint8Array(32);
        evpKey.set(d1); evpKey.set(d2, 16);
        const key = await crypto.subtle.importKey(
            'raw', evpKey, { name: 'AES-CBC' }, false, ['decrypt']
        );
        keys.push({ key, method: 'EVP_BytesToKey(MD5, no salt)' });
    } catch (e) { /* skip */ }

    // --- Method 5: MD5(salt) = 16-byte AES-128 key ---
    try {
        var md5key = md5(saltBytes);
        const key = await crypto.subtle.importKey(
            'raw', md5key, { name: 'AES-CBC' }, false, ['decrypt']
        );
        keys.push({ key, method: 'MD5(salt) AES-128' });
    } catch (e) { /* skip */ }

    // --- Method 6: SHA-256(salt) truncated to 16 bytes (AES-128) ---
    try {
        const hash = await crypto.subtle.digest('SHA-256', saltBytes);
        const key = await crypto.subtle.importKey(
            'raw', new Uint8Array(hash).slice(0, 16), { name: 'AES-CBC' }, false, ['decrypt']
        );
        keys.push({ key, method: 'SHA-256(salt)[0:16] AES-128' });
    } catch (e) { /* skip */ }

    // --- Method 7: PBKDF2 with raw salt, 100k iters ---
    try {
        const km = await crypto.subtle.importKey('raw', saltBytes, 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
            km, { name: 'AES-CBC', length: 256 }, false, ['decrypt']
        );
        keys.push({ key, method: 'PBKDF2(raw, 100k)' });
    } catch (e) { /* skip */ }

    // --- Method 8: PBKDF2 with SHA-256(salt) as derivation salt ---
    try {
        const km = await crypto.subtle.importKey('raw', saltBytes, 'PBKDF2', false, ['deriveKey']);
        const ds = await crypto.subtle.digest('SHA-256', saltBytes);
        const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: new Uint8Array(ds), iterations: 100000, hash: 'SHA-256' },
            km, { name: 'AES-CBC', length: 256 }, false, ['decrypt']
        );
        keys.push({ key, method: 'PBKDF2(SHA256, 100k)' });
    } catch (e) { /* skip */ }

    // --- Method 9: PBKDF2 with 10000 iterations ---
    try {
        const km = await crypto.subtle.importKey('raw', saltBytes, 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: saltBytes, iterations: 10000, hash: 'SHA-256' },
            km, { name: 'AES-CBC', length: 256 }, false, ['decrypt']
        );
        keys.push({ key, method: 'PBKDF2(raw, 10k)' });
    } catch (e) { /* skip */ }

    // --- Method 10: PBKDF2 with 1 iteration ---
    try {
        const km = await crypto.subtle.importKey('raw', saltBytes, 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: saltBytes, iterations: 1, hash: 'SHA-256' },
            km, { name: 'AES-CBC', length: 256 }, false, ['decrypt']
        );
        keys.push({ key, method: 'PBKDF2(raw, 1)' });
    } catch (e) { /* skip */ }

    // --- Method 11: EVP_BytesToKey with 8-byte OpenSSL salt from ciphertext ---
    // OpenSSL enc format: "Salted__" + 8-byte salt + ciphertext
    // This is handled separately in decryptLicenseKey if needed

    return keys;
}

/**
 * Decrypt an encrypted license key.
 * Handles multiple formats:
 *   Format A: base64( IV(16) + ciphertext )          — custom format
 *   Format B: base64( "Salted__" + salt(8) + cipher ) — OpenSSL enc format
 */
async function decryptLicenseKey(encryptedB64) {
    try {
        // Normalize base64: fix URL-transport corruption
        let b64 = encryptedB64
            .replace(/ /g, '+')
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        while (b64.length % 4 !== 0) b64 += '=';

        console.log('[NonPU] Attempting decryption, b64 length:', b64.length);

        const raw = atob(b64);
        const bytes = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
        console.log('[NonPU] Decoded bytes:', bytes.length);

        // Detect OpenSSL "Salted__" prefix
        const opensslPrefix = 'Salted__';
        const headerStr = String.fromCharCode.apply(null, bytes.slice(0, 8));
        const isOpenSSL = (headerStr === opensslPrefix);

        if (isOpenSSL) {
            console.log('[NonPU] Detected OpenSSL Salted__ format');
            // OpenSSL format: "Salted__" (8) + salt (8) + ciphertext
            const osslSalt = bytes.slice(8, 16);
            const osslCipher = bytes.slice(16);
            console.log('[NonPU] OpenSSL salt:', Array.from(osslSalt).map(b => b.toString(16).padStart(2, '0')).join(''));

            // EVP_BytesToKey: derive key + IV from password + salt using MD5
            const password = new TextEncoder().encode(NONPU_CRYPTO.SALT);
            // D1 = MD5(password + salt)
            var c1 = new Uint8Array(password.length + osslSalt.length);
            c1.set(password); c1.set(osslSalt, password.length);
            var d1 = md5(c1);
            // D2 = MD5(D1 + password + salt)
            var c2 = new Uint8Array(d1.length + password.length + osslSalt.length);
            c2.set(d1); c2.set(password, d1.length); c2.set(osslSalt, d1.length + password.length);
            var d2 = md5(c2);
            // D3 = MD5(D2 + password + salt)
            var c3 = new Uint8Array(d2.length + password.length + osslSalt.length);
            c3.set(d2); c3.set(password, d2.length); c3.set(osslSalt, d2.length + password.length);
            var d3 = md5(c3);

            // AES-256-CBC: key = D1+D2 (32 bytes), IV = D3 (16 bytes)
            var evpKeyBytes = new Uint8Array(32);
            evpKeyBytes.set(d1); evpKeyBytes.set(d2, 16);
            var evpIV = d3;

            try {
                var evpKey = await crypto.subtle.importKey('raw', evpKeyBytes, { name: 'AES-CBC' }, false, ['decrypt']);
                var decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: evpIV }, evpKey, osslCipher);
                var result = new TextDecoder().decode(decrypted);
                if (result && result.startsWith('NP-')) {
                    console.log('[NonPU] SUCCESS with OpenSSL EVP_BytesToKey →', result.substring(0, 7) + '...');
                    return result;
                }
                console.log('[NonPU] OpenSSL decrypted but invalid:', result.substring(0, 20));
            } catch (osslErr) {
                console.log('[NonPU] OpenSSL EVP_BytesToKey AES-256 failed:', osslErr.message);
            }

            // Try AES-128-CBC: key = D1 (16 bytes), IV = D2 (16 bytes)
            try {
                var evpKey128 = await crypto.subtle.importKey('raw', d1, { name: 'AES-CBC' }, false, ['decrypt']);
                var dec128 = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: d2 }, evpKey128, osslCipher);
                var res128 = new TextDecoder().decode(dec128);
                if (res128 && res128.startsWith('NP-')) {
                    console.log('[NonPU] SUCCESS with OpenSSL EVP AES-128 →', res128.substring(0, 7) + '...');
                    return res128;
                }
            } catch (e128) {
                console.log('[NonPU] OpenSSL EVP AES-128 failed:', e128.message);
            }
        }

        // Format A: IV(16) + ciphertext
        const iv = bytes.slice(0, 16);
        const ciphertext = bytes.slice(16);
        console.log('[NonPU] Format A: IV=16 + cipher=' + ciphertext.length);

        if (ciphertext.length === 0) {
            console.error('[NonPU] Ciphertext is empty after removing IV');
            return null;
        }

        // Try all key derivation methods
        const candidates = await deriveKeys(NONPU_CRYPTO.SALT);
        console.log('[NonPU] Trying', candidates.length, 'key derivation methods...');

        for (const candidate of candidates) {
            try {
                const decrypted = await crypto.subtle.decrypt(
                    { name: NONPU_CRYPTO.ALGO, iv: iv },
                    candidate.key,
                    ciphertext
                );
                const result = new TextDecoder().decode(decrypted);
                if (result && result.startsWith('NP-')) {
                    console.log('[NonPU] SUCCESS with method:', candidate.method, '→', result.substring(0, 7) + '...');
                    return result;
                }
                console.log('[NonPU] Method', candidate.method, 'decrypted but invalid result:', result.substring(0, 20));
            } catch (innerErr) {
                console.log('[NonPU] Method', candidate.method, 'failed:', innerErr.message || 'OperationError');
            }
        }

        // Also try EVP_BytesToKey WITHOUT the Salted__ header
        // (C client may use EVP but not prepend the header)
        console.log('[NonPU] Trying EVP_BytesToKey without Salted__ header...');
        try {
            const password = new TextEncoder().encode(NONPU_CRYPTO.SALT);
            // No salt variant: D1 = MD5(password), D2 = MD5(D1+password), D3 = MD5(D2+password)
            var nd1 = md5(password);
            var nc2 = new Uint8Array(nd1.length + password.length);
            nc2.set(nd1); nc2.set(password, nd1.length);
            var nd2 = md5(nc2);
            var nc3 = new Uint8Array(nd2.length + password.length);
            nc3.set(nd2); nc3.set(password, nd2.length);
            var nd3 = md5(nc3);

            // AES-256: key=D1+D2, IV from first 16 bytes of data
            var nkey = new Uint8Array(32);
            nkey.set(nd1); nkey.set(nd2, 16);
            var nImported = await crypto.subtle.importKey('raw', nkey, { name: 'AES-CBC' }, false, ['decrypt']);
            var nDec = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: iv }, nImported, ciphertext);
            var nResult = new TextDecoder().decode(nDec);
            if (nResult && nResult.startsWith('NP-')) {
                console.log('[NonPU] SUCCESS with EVP_BytesToKey(no salt, AES-256) →', nResult.substring(0, 7) + '...');
                return nResult;
            }
            console.log('[NonPU] EVP no-salt AES-256 decrypted but invalid:', nResult.substring(0, 20));
        } catch (evpErr) {
            console.log('[NonPU] EVP no-salt AES-256 failed:', evpErr.message || 'OperationError');
        }

        // Hex dump first 16 bytes for debugging
        console.error('[NonPU] All methods failed. First 16 bytes (hex):', Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        console.error('[NonPU] Bytes 16-48 (hex):', Array.from(bytes.slice(16)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        return null;
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
                // Pass the computed newExpiry so we extend from the current
                // expiration date rather than resetting to 1-year-from-today.
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
