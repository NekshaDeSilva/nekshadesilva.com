/**
 * NonPU Instant — One-Time Database Seeder
 * 
 * Reads keys.JSON and inserts all license registry data into Supabase:
 *   1. license_key_registry — all license keys (marked as assigned)
 *   2. licenses — all license records with entity snapshots (no user_id, system-seeded)
 *   3. entities — all entity records (no user_id, system-seeded)
 * 
 * Run with: node seed-database.js
 * Then DELETE this file.
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://vgnxpefbzvralyoowrvs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbnhwZWZienZyYWx5b293cnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDI4NjAsImV4cCI6MjA4NjcxODg2MH0.IqBB7hVudKyuJhsCwZ3XEUeJDTtWCX-4VPPxyDUtdWI';

// If you have the service_role key, paste it here to bypass RLS:
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Use service_role key if available, otherwise fall back to anon key
const API_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

const REST_URL = `${SUPABASE_URL}/rest/v1`;

// ============================================
// LOAD keys.JSON
// ============================================
const keysPath = path.join(
    __dirname, '..', 
    'encrypted-assets', 'keys', 
    'encypted-349827298375286582638', '45729458728452945',
    '59278695267852657257357235', '578203752985729357927539',
    '3578902759285729857295827', 'keys.JSON'
);

let keysData;
try {
    const raw = fs.readFileSync(keysPath, 'utf-8');
    keysData = JSON.parse(raw);
    console.log(`✓ Loaded keys.JSON — ${keysData.licenseRegistry.length} entries found`);
} catch (err) {
    console.error('✗ Failed to load keys.JSON:', err.message);
    process.exit(1);
}

// ============================================
// HELPERS
// ============================================

/**
 * Parse the date format from keys.JSON (e.g., "December/31/2027") to ISO string
 */
function parseExpirationDate(dateStr) {
    if (!dateStr) return null;
    const months = {
        'January': 0, 'February': 1, 'March': 2, 'April': 3,
        'May': 4, 'June': 5, 'July': 6, 'August': 7,
        'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const month = months[parts[0]];
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (month === undefined || isNaN(day) || isNaN(year)) return null;
    return new Date(year, month, day).toISOString();
}

/**
 * Make a POST request to Supabase REST API
 */
async function supabaseInsert(table, rows) {
    const url = `${REST_URL}/${table}`;
    const headers = {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation,resolution=merge-duplicates'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(rows)
        });

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }

        if (!response.ok) {
            return { error: data, status: response.status };
        }
        return { data, status: response.status };
    } catch (err) {
        return { error: err.message, status: 0 };
    }
}

/**
 * UPSERT request (insert or update on conflict)
 */
async function supabaseUpsert(table, rows, onConflict) {
    const url = `${REST_URL}/${table}`;
    const headers = {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation,resolution=merge-duplicates'
    };
    if (onConflict) {
        headers['Prefer'] = `return=representation,resolution=merge-duplicates`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(rows)
        });

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }

        if (!response.ok) {
            return { error: data, status: response.status };
        }
        return { data, status: response.status };
    } catch (err) {
        return { error: err.message, status: 0 };
    }
}

// ============================================
// SEED FUNCTIONS
// ============================================

/**
 * 1. Seed license_key_registry table
 */
async function seedLicenseKeyRegistry() {
    console.log('\n━━━ Seeding license_key_registry ━━━');
    
    const rows = keysData.licenseRegistry.map(entry => ({
        license_key: entry.licenseKey,
        is_assigned: true
    }));

    console.log(`  Inserting ${rows.length} license keys...`);
    
    // Insert one by one to handle duplicates gracefully
    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows) {
        const result = await supabaseInsert('license_key_registry', [row]);
        if (result.status === 201 || result.status === 200) {
            success++;
            console.log(`  ✓ ${row.license_key}`);
        } else if (result.error && JSON.stringify(result.error).includes('duplicate')) {
            skipped++;
            console.log(`  ○ ${row.license_key} (already exists)`);
        } else {
            failed++;
            console.log(`  ✗ ${row.license_key} — Error:`, JSON.stringify(result.error).substring(0, 120));
        }
    }

    console.log(`  Done: ${success} inserted, ${skipped} already existed, ${failed} failed`);
    return { success, skipped, failed };
}

/**
 * 2. Seed licenses table
 *    Note: These are "system" entries without a user_id — they represent pre-registered licenses
 */
async function seedLicenses() {
    console.log('\n━━━ Seeding licenses ━━━');

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const entry of keysData.licenseRegistry) {
        const expirationDate = parseExpirationDate(entry.expirationDate);
        
        // Build entity_details snapshot (same structure stored in license)
        const entityDetails = {
            entityName: entry.entityName,
            legalEntityName: entry.legalEntityName,
            entityType: entry.entityType,
            entityLogo: entry.entityLogo || null,
            entityOriginLocationAndCountry: entry.entityOriginLocationAndCountry || null,
            entityEmail: entry.entityEmail || null,
            companyRegistrationNumber: entry.companyRegistrationNumber || null,
            website: entry.website || null
        };

        if (entry.corporateDetails) {
            entityDetails.corporateDetails = entry.corporateDetails;
        }

        const row = {
            license_key: entry.licenseKey,
            status: 'active',
            entity_name: entry.entityName,
            legal_entity_name: entry.legalEntityName,
            entity_type: entry.entityType,
            entity_details: entityDetails,
            activated_at: new Date().toISOString(),
            expiration_date: expirationDate,
            created_at: new Date().toISOString()
            // user_id is omitted — these are system-seeded entries
        };

        const result = await supabaseInsert('licenses', [row]);
        if (result.status === 201 || result.status === 200) {
            success++;
            console.log(`  ✓ ${entry.licenseKey} — ${entry.entityName}`);
        } else if (result.error && JSON.stringify(result.error).includes('duplicate')) {
            skipped++;
            console.log(`  ○ ${entry.licenseKey} (already exists)`);
        } else {
            failed++;
            const errMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
            console.log(`  ✗ ${entry.licenseKey} — ${errMsg.substring(0, 150)}`);
        }
    }

    console.log(`  Done: ${success} inserted, ${skipped} already existed, ${failed} failed`);
    return { success, skipped, failed };
}

/**
 * 3. Seed entities table
 *    System-seeded entity records from keys.JSON
 */
async function seedEntities() {
    console.log('\n━━━ Seeding entities ━━━');

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const entry of keysData.licenseRegistry) {
        // Parse location and country from the combined string
        const locationStr = entry.entityOriginLocationAndCountry || '';
        const locationParts = locationStr.split(', ');
        const country = locationParts.length > 0 ? locationParts[locationParts.length - 1] : '';
        const location = locationParts.slice(0, -1).join(', ');

        // Build emails object
        const emails = entry.entityEmail || {};

        const row = {
            entity_type: entry.entityType,
            entity_name: entry.entityName,
            legal_entity_name: entry.legalEntityName,
            entity_logo: entry.entityLogo || null,
            entity_origin_location: location || null,
            entity_country: country || null,
            entity_origin_location_and_country: entry.entityOriginLocationAndCountry || null,
            entity_emails: emails,
            company_registration_number: entry.companyRegistrationNumber || null,
            website: entry.website || null,
            corporate_details: entry.corporateDetails || null,
            nonprofit_details: null,
            created_at: new Date().toISOString()
            // user_id is omitted — these are system-seeded entries
        };

        const result = await supabaseInsert('entities', [row]);
        if (result.status === 201 || result.status === 200) {
            success++;
            console.log(`  ✓ ${entry.entityName} (${entry.entityType})`);
        } else if (result.error && JSON.stringify(result.error).includes('duplicate')) {
            skipped++;
            console.log(`  ○ ${entry.entityName} (already exists)`);
        } else {
            failed++;
            const errMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
            console.log(`  ✗ ${entry.entityName} — ${errMsg.substring(0, 150)}`);
        }
    }

    console.log(`  Done: ${success} inserted, ${skipped} already existed, ${failed} failed`);
    return { success, skipped, failed };
}

// ============================================
// MAIN
// ============================================
async function main() {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   NonPU Instant — Database Seeder        ║');
    console.log('║   One-time seed from keys.JSON           ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log(`Using API key: ${API_KEY === SUPABASE_ANON_KEY ? 'anon key' : 'service_role key'}`);
    console.log(`Target: ${SUPABASE_URL}`);
    console.log(`Entries to seed: ${keysData.licenseRegistry.length}`);

    // Seed all tables
    const registryResult = await seedLicenseKeyRegistry();
    const licensesResult = await seedLicenses();
    const entitiesResult = await seedEntities();

    // Summary
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║              SEED SUMMARY                 ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║ license_key_registry: ${registryResult.success} ok, ${registryResult.skipped} skip, ${registryResult.failed} fail`);
    console.log(`║ licenses:            ${licensesResult.success} ok, ${licensesResult.skipped} skip, ${licensesResult.failed} fail`);
    console.log(`║ entities:            ${entitiesResult.success} ok, ${entitiesResult.skipped} skip, ${entitiesResult.failed} fail`);
    console.log('╚══════════════════════════════════════════╝');

    if (registryResult.failed > 0 || licensesResult.failed > 0 || entitiesResult.failed > 0) {
        console.log('\n⚠ Some inserts failed. If you see RLS/permission errors,');
        console.log('  you need the service_role key from Supabase Dashboard:');
        console.log('  https://supabase.com/dashboard/project/vgnxpefbzvralyoowrvs/settings/api');
        console.log('  Then run: set SUPABASE_SERVICE_ROLE_KEY=<your_key> && node seed-database.js');
    } else {
        console.log('\n✓ All data seeded successfully!');
        console.log('  You can now delete this file: seed-database.js');
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
