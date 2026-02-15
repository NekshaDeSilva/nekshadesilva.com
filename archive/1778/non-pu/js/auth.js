/**
 * NonPU Account System - Supabase Authentication Module
 * GVMA Incorporated — Global Vision for Machinery Advancement
 * 
 * This module handles all authentication and database operations
 * for the NonPU licensing system.
 */

// ============================================
// CONFIGURATION - Replace with your Supabase credentials
// ============================================
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_PROJECT_URL', // e.g., https://xyzabc.supabase.co
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
};

// ============================================
// SUPABASE CLIENT INITIALIZATION
// ============================================
let supabaseClient = null;

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
 */
async function signUp(email, password) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const { data, error } = await client.auth.signUp({
        email: email,
        password: password
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
            entity_origin_location: entityData.entityOriginLocation,
            entity_country: entityData.entityCountry,
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
 * Add a pending license to user's account
 */
async function addPendingLicense(licenseKey) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const user = await getCurrentUser();
    if (!user) return { error: 'User not authenticated' };
    
    // Check if license already exists
    const { exists } = await checkLicenseKeyExists(licenseKey);
    if (exists) {
        return { error: 'License key already registered' };
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
 * Activate a license after payment
 */
async function activateLicense(licenseKey, entityData) {
    const client = initSupabase();
    if (!client) return { error: 'Supabase not initialized' };
    
    const user = await getCurrentUser();
    if (!user) return { error: 'User not authenticated' };
    
    // Calculate expiration date (1 year from now)
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    
    const { data, error } = await client
        .from('licenses')
        .update({
            status: 'active',
            entity_name: entityData.entityName,
            legal_entity_name: entityData.legalEntityName,
            entity_type: entityData.entityType,
            entity_details: entityData,
            activated_at: new Date().toISOString(),
            expiration_date: expirationDate.toISOString()
        })
        .eq('license_key', licenseKey)
        .eq('user_id', user.id)
        .select()
        .single();
    
    // Clear the pending license from localStorage
    if (!error) {
        clearPendingLicenseKey();
    }
    
    return { data, error };
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
    initSupabase,
    
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
    
    // State listener
    onAuthStateChange,
    
    // Utilities
    generateLicenseKey,
    validateLicenseKeyFormat,
    formatDate
};

// Make available globally
window.NonPUAuth = NonPUAuth;
