/**
 * NonPU Account System - Supabase Authentication Module
 * GVMA PBC
 * 
 * This module handles all authentication and database operations
 * for the NonPU licensing system.
 */

// ============================================
// CONFIGURATION - Replace with your Supabase credentials
// ============================================
const SUPABASE_CONFIG = {
    url: 'https://vgnxpefbzvralyoowrvs.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbnhwZWZienZyYWx5b293cnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDI4NjAsImV4cCI6MjA4NjcxODg2MH0.IqBB7hVudKyuJhsCwZ3XEUeJDTtWCX-4VPPxyDUtdWI',
    publishableKey: 'sb_publishable_MHVPSPBNrC5TTDWCgsvK6g_oaGoWk8V',
    secretKey: 'sb_secret_LDegxaYARLPt9zI_RLvDmA_XZi9G1R6',
    projectId: 'vgnxpefbzvralyoowrvs'
};

// ============================================
// hCaptcha Configuration
// ============================================
const HCAPTCHA_CONFIG = {
    siteKey: '47be45ae-5ea0-48ce-b962-84cc0da02b7e'
    // Secret key (ES_7ef22685b2af40e1828cc334fc9fc081) is for server-side verification only
};

// ============================================
// SUPABASE CLIENT INITIALIZATION
// ============================================
let supabaseClient = null;

/**
 * Wait for the Supabase CDN script to finish loading.
 * Returns a promise that resolves when window.supabase is available.
 */
function waitForSupabase(timeout) {
    if (typeof timeout === 'undefined') timeout = 8000;
    return new Promise(function (resolve, reject) {
        if (window.supabase) { resolve(); return; }
        var start = Date.now();
        var interval = setInterval(function () {
            if (window.supabase) { clearInterval(interval); resolve(); return; }
            if (Date.now() - start > timeout) {
                clearInterval(interval);
                reject(new Error('Supabase CDN did not load within ' + timeout + 'ms'));
            }
        }, 50);
    });
}

function initSupabase() {
    if (!window.supabase) {
        console.error('Supabase library not loaded');
        return null;
    }
    
    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
    }
    return supabaseClient;
}

// ============================================
// LICENSE KEY MANAGEMENT
// ============================================

/**
 * Capture ALL URL parameters (key and enc) IMMEDIATELY — no Supabase needed.
 * This must run before any auth checks or redirects.
 * Stores them in localStorage so they survive redirects between login ↔ dashboard.
 */
function captureURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    let encParam = urlParams.get('enc');
    const keyParam = urlParams.get('key');
    let captured = false;

    if (encParam) {
        // Fix base64 corruption from URL transport:
        // URLSearchParams decodes + as space — restore it.
        // Also handle URL-safe base64 variant (- → +, _ → /).
        encParam = encParam.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
        localStorage.setItem('nonpu_pending_enc', encParam);
        captured = true;
    }

    if (keyParam) {
        localStorage.setItem('nonpu_pending_license_key', keyParam);
        localStorage.setItem('nonpu_license_key_timestamp', Date.now().toString());
        captured = true;
    }

    // Clean URL — remove parameters for security (prevent history exposure)
    if (captured) {
        const cleanURL = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanURL);
    }

    return {
        enc: encParam || localStorage.getItem('nonpu_pending_enc'),
        key: keyParam || localStorage.getItem('nonpu_pending_license_key')
    };
}

/**
 * Save license key from URL parameter to localStorage
 * Then redirect without the parameter for security
 */
function handleLicenseKeyFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const licenseKey = urlParams.get('key');
    
    if (licenseKey) {
        // Store in localStorage
        localStorage.setItem('nonpu_pending_license_key', licenseKey);
        localStorage.setItem('nonpu_license_key_timestamp', Date.now().toString());
        
        // Redirect without the parameter (security: prevent history exposure)
        const cleanURL = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanURL);
        
        return licenseKey;
    }
    
    return localStorage.getItem('nonpu_pending_license_key');
}

/**
 * Get pending license key from localStorage
 */
function getPendingLicenseKey() {
    return localStorage.getItem('nonpu_pending_license_key');
}

/**
 * Clear pending license key after activation
 */
function clearPendingLicenseKey() {
    localStorage.removeItem('nonpu_pending_license_key');
    localStorage.removeItem('nonpu_license_key_timestamp');
}

/**
 * Check if a license key already exists in the database
 */
async function checkLicenseKeyExists(licenseKey) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('licenses')
        .select('license_key')
        .eq('license_key', licenseKey)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found (which is good)
        return { exists: false, error: error.message };
    }
    
    return { exists: !!data, error: null };
}

// ============================================
// USER AUTHENTICATION
// ============================================

/**
 * Sign up a new user with email and password
 * Note: Email confirmation is disabled during testing phase.
 * To re-enable, remove the emailRedirectTo option and enable
 * "Confirm email" in Supabase Dashboard > Authentication > Settings.
 */
async function signUp(email, password) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { data, error } = await client.auth.signUp({
        email: email,
        password: password,
        options: {
            // During testing: skip email confirmation
            emailRedirectTo: window.location.origin + '/archive/1778/non-pu/dashboard/'
        }
    });
    
    return { data, error };
}

/**
 * Sign in existing user
 */
async function signIn(email, password) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { data, error } = await client.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    return { data, error };
}

/**
 * Sign out current user
 */
async function signOut() {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { error } = await client.auth.signOut();
    return { error };
}

/**
 * Get current user session
 */
async function getCurrentUser() {
    const client = initSupabase();
    if (!client) return null;
    
    const { data: { user } } = await client.auth.getUser();
    return user;
}

/**
 * Get current session
 */
async function getSession() {
    const client = initSupabase();
    if (!client) return null;
    
    const { data: { session } } = await client.auth.getSession();
    return session;
}

// ============================================
// ENTITY/ACCOUNT MANAGEMENT
// ============================================

/**
 * Create a new entity account
 * Data structure aligned with keys.JSON license registry schema
 * @param {Object} entityData - The entity information
 */
async function createEntityAccount(entityData) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const user = await getCurrentUser();
    if (!user) return { error: 'User not authenticated' };
    
    const { data, error } = await client
        .from('entities')
        .insert([{
            user_id: user.id,
            entity_type: entityData.entityType,
            entity_name: entityData.entityName,
            legal_entity_name: entityData.legalEntityName,
            entity_logo: entityData.entityLogo || null,
            entity_origin_location: entityData.entityOriginLocation,
            entity_country: entityData.entityCountry,
            entity_origin_location_and_country: entityData.entityOriginLocationAndCountry || null,
            entity_emails: entityData.entityEmails,
            company_registration_number: entityData.companyRegistrationNumber,
            website: entityData.website,
            corporate_details: entityData.corporateDetails,
            nonprofit_details: entityData.nonprofitDetails,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();
    
    return { data, error };
}

/**
 * Get entity account for current user
 */
async function getEntityAccount() {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const user = await getCurrentUser();
    if (!user) return { error: 'User not authenticated' };
    
    const { data, error } = await client
        .from('entities')
        .select('*')
        .eq('user_id', user.id)
        .single();
    
    return { data, error };
}

/**
 * Update entity account
 */
async function updateEntityAccount(entityId, updates) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('entities')
        .update(updates)
        .eq('id', entityId)
        .select()
        .single();
    
    return { data, error };
}

// ============================================
// LICENSE MANAGEMENT
// ============================================

/**
 * Get all licenses for the current user's entity
 */
async function getUserLicenses() {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const user = await getCurrentUser();
    if (!user) return { error: 'User not authenticated' };
    
    const { data, error } = await client
        .from('licenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    return { data, error };
}

/**
 * Add a pending license to user's account.
 * If the key already exists in the licenses table (e.g. seed data),
 * returns the existing row instead of erroring — the caller will
 * proceed to activate / claim it.
 */
async function addPendingLicense(licenseKey) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const user = await getCurrentUser();
    if (!user) return { error: 'User not authenticated' };
    
    // Check if license already exists
    const { exists } = await checkLicenseKeyExists(licenseKey);
    if (exists) {
        // Key already in the licenses table — return the existing row
        // so the activation step can claim / update it.
        const { data: existing, error: fetchErr } = await client
            .from('licenses')
            .select('*')
            .eq('license_key', licenseKey)
            .single();
        return { data: existing, error: fetchErr, alreadyExists: true };
    }
    
    const { data, error } = await client
        .from('licenses')
        .insert([{
            user_id: user.id,
            license_key: licenseKey,
            status: 'pending',
            created_at: new Date().toISOString()
        }])
        .select()
        .single();
    
    return { data, error };
}

/**
 * Activate a license after payment.
 * Handles two cases:
 *  1. License already belongs to this user (user_id matches) → update in place.
 *  2. License exists but is unclaimed (user_id IS NULL — seed data) → claim it
 *     for the current user and activate.
 *
 * @param {string}  licenseKey   - The NP-XXXX-XXXX-XXXX-XXXX key
 * @param {Object}  entityData   - Entity details to write into the license row
 * @param {Date}   [expirationDate] - Optional expiry override. If omitted,
 *                                     defaults to 1 year from now.
 */
async function activateLicense(licenseKey, entityData, expirationDate) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const user = await getCurrentUser();
    if (!user) return { error: 'User not authenticated' };
    
    // Use caller-supplied expiration, or default to 1 year from now
    if (!expirationDate) {
        expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    }
    
    const updatePayload = {
        status: 'active',
        user_id: user.id,
        entity_name: entityData.entityName,
        legal_entity_name: entityData.legalEntityName,
        entity_type: entityData.entityType,
        entity_details: entityData,
        activated_at: new Date().toISOString(),
        expiration_date: expirationDate.toISOString()
    };
    
    // Attempt 1: update the license that already belongs to this user
    let { data, error } = await client
        .from('licenses')
        .update(updatePayload)
        .eq('license_key', licenseKey)
        .eq('user_id', user.id)
        .select();
    
    if (!error && data && data.length > 0) {
        // Matched by user_id — normal update
        clearPendingLicenseKey();
        return { data: data[0], error: null };
    }
    
    // Attempt 2: license exists but user_id is NULL (unclaimed seed data).
    // Claim it for this user.
    const result = await client
        .from('licenses')
        .update(updatePayload)
        .eq('license_key', licenseKey)
        .is('user_id', null)
        .select();
    
    if (!result.error && result.data && result.data.length > 0) {
        clearPendingLicenseKey();
        return { data: result.data[0], error: null };
    }
    
    // If we still got nothing, return a helpful error
    return { data: null, error: result.error || { message: 'License key not found or already claimed by another user.' } };
}

/**
 * Get license by key (for validation)
 */
async function getLicenseByKey(licenseKey) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { data, error } = await client
        .from('licenses')
        .select('*')
        .eq('license_key', licenseKey)
        .single();
    
    return { data, error };
}

// ============================================
// AUTH STATE LISTENER
// ============================================

/**
 * Listen for auth state changes
 */
function onAuthStateChange(callback) {
    const client = initSupabase();
    if (!client) return null;
    
    return client.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a unique license key (for testing)
 * Format: NP-XXXX-XXXX-XXXX-XXXX
 */
function generateLicenseKey() {
    const chars = '0123456789';
    let key = 'NP';
    for (let i = 0; i < 4; i++) {
        key += '-';
        for (let j = 0; j < 4; j++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    return key;
}

/**
 * Generate a unique license key that does not already exist in the registry
 * Keeps regenerating until a unique one is found
 */
async function generateUniqueLicenseKey() {
    const client = initSupabase();
    if (!client) return { data: null, error: 'Supabase not initialized' };

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const key = generateLicenseKey();

        // Check registry for duplicates
        const { data } = await client
            .from('license_key_registry')
            .select('license_key')
            .eq('license_key', key)
            .single();

        if (!data) {
            // Key doesn't exist — register it
            const { error: insertError } = await client
                .from('license_key_registry')
                .insert([{ license_key: key, is_assigned: false }]);

            if (!insertError) {
                return { data: key, error: null };
            }
        }

        attempts++;
    }

    return { data: null, error: 'Failed to generate unique key after ' + maxAttempts + ' attempts' };
}

/**
 * Mark a license key as assigned in the registry
 */
/**
 * Mark a license key as assigned in the registry.
 * Uses upsert: if the key doesn't exist yet it's inserted;
 * if it already exists it's updated to is_assigned = true.
 */
async function markKeyAssigned(licenseKey) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };

    const { error } = await client
        .from('license_key_registry')
        .upsert(
            { license_key: licenseKey, is_assigned: true },
            { onConflict: 'license_key' }
        );

    return { error };
}

// ============================================
// PAYMENT MANAGEMENT
// ============================================

/**
 * Create a pending payment record before redirecting to Stripe
 */
async function createPaymentRecord(licenseKey, amountCents, paymentMethod) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };

    const user = await getCurrentUser();
    if (!user) return { error: 'User not authenticated' };

    // Find the license record (may not have user_id yet if seed data)
    const { data: license } = await client
        .from('licenses')
        .select('id')
        .eq('license_key', licenseKey)
        .single();

    const { data, error } = await client
        .from('payments')
        .insert([{
            user_id: user.id,
            license_id: license ? license.id : null,
            license_key: licenseKey,
            amount_cents: amountCents || 9900,
            currency: 'usd',
            status: 'pending',
            payment_method: paymentMethod || 'card',
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    return { data, error };
}

/**
 * Update payment status after Stripe callback
 */
async function updatePaymentStatus(paymentId, status, stripeSessionId, stripePaymentIntentId) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };

    const updates = { status: status };
    if (stripeSessionId) updates.stripe_session_id = stripeSessionId;
    if (stripePaymentIntentId) updates.stripe_payment_intent_id = stripePaymentIntentId;
    if (status === 'completed') updates.paid_at = new Date().toISOString();

    const { data, error } = await client
        .from('payments')
        .update(updates)
        .eq('id', paymentId)
        .select()
        .single();

    return { data, error };
}

/**
 * Get all payments for the current user
 */
async function getUserPayments() {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };

    const user = await getCurrentUser();
    if (!user) return { error: 'User not authenticated' };

    const { data, error } = await client
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return { data, error };
}

// ============================================
// DEVICE BINDING
// ============================================

/**
 * Bind a license to a specific device/SD card
 */
async function bindLicenseToDevice(licenseKey, deviceIdentifier) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };

    // Get the license record
    const { data: license, error: licenseError } = await client
        .from('licenses')
        .select('id, user_id')
        .eq('license_key', licenseKey)
        .single();

    if (licenseError || !license) return { error: 'License not found' };

    // Deactivate any existing binding for this license
    await client
        .from('device_bindings')
        .update({ is_active: false, unbound_at: new Date().toISOString() })
        .eq('license_id', license.id)
        .eq('is_active', true);

    // Create new binding
    const { data, error } = await client
        .from('device_bindings')
        .insert([{
            license_id: license.id,
            license_key: licenseKey,
            device_identifier: deviceIdentifier,
            bound_at: new Date().toISOString(),
            is_active: true
        }])
        .select()
        .single();

    return { data, error };
}

/**
 * Get device binding for a license
 */
async function getDeviceBinding(licenseKey) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };

    const { data, error } = await client
        .from('device_bindings')
        .select('*')
        .eq('license_key', licenseKey)
        .eq('is_active', true)
        .single();

    return { data, error };
}

/**
 * Validate license key format
 */
function validateLicenseKeyFormat(key) {
    const pattern = /^NP-\d{4}-\d{4}-\d{4}-\d{4}$/;
    return pattern.test(key);
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ============================================
// EXPORT FOR MODULE USE
// ============================================
const NonPUAuth = {
    // Initialization
    waitForSupabase,
    initSupabase,
    captureURLParams,
    
    // License key handling
    handleLicenseKeyFromURL,
    getPendingLicenseKey,
    clearPendingLicenseKey,
    checkLicenseKeyExists,
    
    // Authentication
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    getSession,
    
    // Entity management
    createEntityAccount,
    getEntityAccount,
    updateEntityAccount,
    
    // License management
    getUserLicenses,
    addPendingLicense,
    activateLicense,
    getLicenseByKey,
    generateUniqueLicenseKey,
    markKeyAssigned,

    // Payment management
    createPaymentRecord,
    updatePaymentStatus,
    getUserPayments,

    // Device binding
    bindLicenseToDevice,
    getDeviceBinding,
    
    // State listener
    onAuthStateChange,
    
    // Utilities
    generateLicenseKey,
    validateLicenseKeyFormat,
    formatDate
};

// Make available globally
window.NonPUAuth = NonPUAuth;
