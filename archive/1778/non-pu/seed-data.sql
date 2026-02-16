-- ============================================================
-- NonPU Instant — Full Seed Data from keys.JSON
-- Run this in: Supabase Dashboard > SQL Editor
-- This runs as postgres role (bypasses RLS)
-- ============================================================

-- ============================================================
-- STEP 0: Allow NULL user_id for seeded external licenses
-- These are pre-existing licenses NOT tied to web portal users
-- ============================================================
ALTER TABLE licenses ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN user_id DROP NOT NULL;


-- ============================================================
-- 1. LICENSE KEY REGISTRY
--    All 30 license keys marked as assigned
-- ============================================================
INSERT INTO license_key_registry (license_key, is_assigned) VALUES
  ('NP-7492-8361-5028-4917', true),
  ('NP-3847-2956-1038-7462', true),
  ('NP-5829-4716-3058-9241', true),
  ('NP-6173-8294-5012-3867', true),
  ('NP-9482-1736-5029-8147', true),
  ('NP-2847-6193-0574-8326', true),
  ('NP-1938-4726-8051-3942', true),
  ('NP-7361-2948-5073-1846', true),
  ('NP-4927-8163-0592-7438', true),
  ('NP-8274-1639-5082-4716', true),
  ('NP-3619-7284-0593-1847', true),
  ('NP-5827-3946-1072-8394', true),
  ('NP-9163-4827-0591-3748', true),
  ('NP-2748-6193-5027-8461', true),
  ('NP-6284-1937-5082-9473', true),
  ('NP-4738-2916-5083-7294', true),
  ('NP-8193-4726-0582-1947', true),
  ('NP-3927-8461-5029-7183', true),
  ('NP-7294-1836-5027-4918', true),
  ('NP-5183-9274-0628-3741', true),
  ('NP-4618-2739-5081-9374', true),
  ('NP-9372-4618-0593-2847', true),
  ('NP-2847-6193-5028-7461', true),
  ('NP-6183-2947-5081-3729', true),
  ('NP-8274-1936-5029-4718', true),
  ('NP-3948-2716-5083-9274', true),
  ('NP-7291-4836-5027-1948', true),
  ('NP-4827-1936-5082-7394', true),
  ('NP-5927-3846-1029-7483', true),
  ('NP-8163-2947-5028-4719', true)
ON CONFLICT (license_key) DO UPDATE SET is_assigned = true;


-- ============================================================
-- 2. LICENSES TABLE
--    Full license records with entity details snapshot
--    user_id is NULL (pre-existing external licenses)
-- ============================================================

-- 1. OpenAI
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-7492-8361-5028-4917',
  'active',
  'OpenAI',
  'OpenAI Incorporated',
  'corporate',
  '{"entityOriginLocationAndCountry":"San Francisco, California, United States","entityEmail":{"email1":"contact@openai.com","email2":"licensing@openai.com","email3":"legal@openai.com","email4":"support@openai.com","email5":"partnerships@openai.com"},"companyRegistrationNumber":"C4429886","website":"https://openai.com","corporateDetails":{"division":"Research and Development","corporatePhoneNumber":"+1-415-555-0192","corporateMobilePhoneNumber":"+1-415-555-0193","corporateEmail":"corporate@openai.com","responsibleAuthority":{"individuals":[{"name":"Samuel Altman","role":"Chief Executive Officer","email":"sam.altman@openai.com","phoneNumber":"+1-415-555-0101","mobileNumber":"+1-415-555-0102"},{"name":"Gregory Brockman","role":"President","email":"greg.brockman@openai.com","phoneNumber":"+1-415-555-0103","mobileNumber":"+1-415-555-0104"}],"teamResponsible":"Executive Leadership Team"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2027-12-31T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 2. Microsoft Azure
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-3847-2956-1038-7462',
  'active',
  'Microsoft Azure',
  'Microsoft Corporation',
  'corporate',
  '{"entityOriginLocationAndCountry":"Redmond, Washington, United States","entityEmail":{"email1":"azure@microsoft.com","email2":"licensing@microsoft.com","email3":"legal@microsoft.com","email4":"enterprise@microsoft.com","email5":"support@microsoft.com"},"companyRegistrationNumber":"600413485","website":"https://azure.microsoft.com","corporateDetails":{"division":"Azure Cloud Services","corporatePhoneNumber":"+1-425-882-8080","corporateMobilePhoneNumber":"+1-425-555-0201","corporateEmail":"azurecorp@microsoft.com","responsibleAuthority":{"individuals":[{"name":"Satya Nadella","role":"Chief Executive Officer","email":"satya.nadella@microsoft.com","phoneNumber":"+1-425-555-0301","mobileNumber":"+1-425-555-0302"},{"name":"Scott Guthrie","role":"Executive Vice President - Cloud and AI","email":"scott.guthrie@microsoft.com","phoneNumber":"+1-425-555-0303","mobileNumber":"+1-425-555-0304"}],"teamResponsible":"Azure Engineering Leadership"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2028-06-30T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 3. Nathan Jones (personal-individual)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-5829-4716-3058-9241',
  'active',
  'Nathan Jones',
  'Nathan Jones',
  'personal-individual',
  '{"entityOriginLocationAndCountry":"Austin, Texas, United States","entityEmail":{"email1":"nathan.jones@gmail.com","email2":"njones.work@outlook.com"},"companyRegistrationNumber":null,"website":"https://nathanjones.dev"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2027-03-15T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 4. Mickey Hamilton (personal-individual)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-6173-8294-5012-3867',
  'active',
  'Mickey Hamilton',
  'Michael Hamilton',
  'personal-individual',
  '{"entityOriginLocationAndCountry":"London, England, United Kingdom","entityEmail":{"email1":"mickey.hamilton@gmail.com","email2":"m.hamilton@protonmail.com","email3":"hamilton.mickey@yahoo.co.uk"},"companyRegistrationNumber":null,"website":"https://mickeyhamilton.co.uk"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2026-09-22T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 5. Meta Oculus (corporate)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-9482-1736-5029-8147',
  'active',
  'Meta Oculus',
  'Meta Platforms Incorporated',
  'corporate',
  '{"entityOriginLocationAndCountry":"Menlo Park, California, United States","entityEmail":{"email1":"oculus@meta.com","email2":"licensing@meta.com","email3":"legal@meta.com","email4":"developer@meta.com","email5":"partnerships@meta.com"},"companyRegistrationNumber":"C2747618","website":"https://www.meta.com/quest","corporateDetails":{"division":"Oculus VR Division - Reality Labs","corporatePhoneNumber":"+1-650-543-4800","corporateMobilePhoneNumber":"+1-650-555-0401","corporateEmail":"oculus.corporate@meta.com","responsibleAuthority":{"individuals":[{"name":"Mark Zuckerberg","role":"Chief Executive Officer","email":"mark.zuckerberg@meta.com","phoneNumber":"+1-650-555-0501","mobileNumber":"+1-650-555-0502"},{"name":"Andrew Bosworth","role":"Chief Technology Officer","email":"andrew.bosworth@meta.com","phoneNumber":"+1-650-555-0503","mobileNumber":"+1-650-555-0504"}],"teamResponsible":"Reality Labs Executive Team"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2027-11-30T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 6. Red Cross International (non-profit)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-2847-6193-0574-8326',
  'active',
  'Red Cross International',
  'International Committee of the Red Cross',
  'non-profit',
  '{"entityOriginLocationAndCountry":"Geneva, Switzerland","entityEmail":{"email1":"info@icrc.org","email2":"licensing@icrc.org","email3":"legal@icrc.org","email4":"donations@icrc.org"},"companyRegistrationNumber":"CHE-109.814.726","website":"https://www.icrc.org","corporateDetails":{"division":"Information Technology Services","corporatePhoneNumber":"+41-22-734-6001","corporateMobilePhoneNumber":"+41-79-555-0601","corporateEmail":"it.services@icrc.org","responsibleAuthority":{"individuals":[{"name":"Mirjana Spoljaric Egger","role":"President","email":"president@icrc.org","phoneNumber":"+41-22-555-0701","mobileNumber":"+41-79-555-0702"}],"teamResponsible":"Executive Board"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2028-12-31T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 7. Johnson Family Studios (personal-team)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-1938-4726-8051-3942',
  'active',
  'Johnson Family Studios',
  'Johnson Family Creative Studio',
  'personal-team',
  '{"entityOriginLocationAndCountry":"Portland, Oregon, United States","entityEmail":{"email1":"team@johnsonfamilystudios.com","email2":"robert.johnson@johnsonfamilystudios.com","email3":"sarah.johnson@johnsonfamilystudios.com","email4":"admin@johnsonfamilystudios.com"},"companyRegistrationNumber":null,"website":"https://johnsonfamilystudios.com"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2026-08-15T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 8. Google Cloud (corporate)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-7361-2948-5073-1846',
  'active',
  'Google Cloud',
  'Google LLC',
  'corporate',
  '{"entityOriginLocationAndCountry":"Mountain View, California, United States","entityEmail":{"email1":"cloud@google.com","email2":"licensing@google.com","email3":"legal@google.com","email4":"enterprise@google.com","email5":"support@google.com"},"companyRegistrationNumber":"C3548912","website":"https://cloud.google.com","corporateDetails":{"division":"Google Cloud Platform","corporatePhoneNumber":"+1-650-253-0000","corporateMobilePhoneNumber":"+1-650-555-0801","corporateEmail":"gcp.corporate@google.com","responsibleAuthority":{"individuals":[{"name":"Sundar Pichai","role":"Chief Executive Officer - Alphabet/Google","email":"sundar.pichai@google.com","phoneNumber":"+1-650-555-0901","mobileNumber":"+1-650-555-0902"},{"name":"Thomas Kurian","role":"Chief Executive Officer - Google Cloud","email":"thomas.kurian@google.com","phoneNumber":"+1-650-555-0903","mobileNumber":"+1-650-555-0904"}],"teamResponsible":"Google Cloud Leadership Team"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2028-04-30T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 9. Emily Chen (personal-individual)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-4927-8163-0592-7438',
  'active',
  'Emily Chen',
  'Emily Wei Chen',
  'personal-individual',
  '{"entityOriginLocationAndCountry":"Vancouver, British Columbia, Canada","entityEmail":{"email1":"emily.chen@gmail.com","email2":"emilychen.dev@outlook.com"},"companyRegistrationNumber":null,"website":"https://emilychen.ca"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2027-02-28T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 10. Wikimedia Foundation (non-profit)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-8274-1639-5082-4716',
  'active',
  'Wikimedia Foundation',
  'Wikimedia Foundation Incorporated',
  'non-profit',
  '{"entityOriginLocationAndCountry":"San Francisco, California, United States","entityEmail":{"email1":"info@wikimedia.org","email2":"licensing@wikimedia.org","email3":"legal@wikimedia.org","email4":"donate@wikimedia.org","email5":"press@wikimedia.org"},"companyRegistrationNumber":"C2933881","website":"https://www.wikimedia.org","corporateDetails":{"division":"Technology Department","corporatePhoneNumber":"+1-415-839-6885","corporateMobilePhoneNumber":"+1-415-555-1001","corporateEmail":"tech@wikimedia.org","responsibleAuthority":{"individuals":[{"name":"Maryana Iskander","role":"Chief Executive Officer","email":"maryana.iskander@wikimedia.org","phoneNumber":"+1-415-555-1101","mobileNumber":"+1-415-555-1102"}],"teamResponsible":"Wikimedia Technology Team"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2028-07-31T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 11. Smith Brothers Dev Team (personal-team)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-3619-7284-0593-1847',
  'active',
  'Smith Brothers Dev Team',
  'Smith Brothers Development Collective',
  'personal-team',
  '{"entityOriginLocationAndCountry":"Dublin, Ireland","entityEmail":{"email1":"team@smithbrosdev.ie","email2":"james.smith@smithbrosdev.ie","email3":"connor.smith@smithbrosdev.ie","email4":"support@smithbrosdev.ie"},"companyRegistrationNumber":null,"website":"https://smithbrosdev.ie"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2026-10-15T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 12. Amazon Web Services (corporate)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-5827-3946-1072-8394',
  'active',
  'Amazon Web Services',
  'Amazon Web Services Incorporated',
  'corporate',
  '{"entityOriginLocationAndCountry":"Seattle, Washington, United States","entityEmail":{"email1":"aws@amazon.com","email2":"licensing@amazon.com","email3":"legal@amazon.com","email4":"enterprise@amazon.com","email5":"partners@amazon.com"},"companyRegistrationNumber":"C3983412","website":"https://aws.amazon.com","corporateDetails":{"division":"Amazon Web Services - Cloud Infrastructure","corporatePhoneNumber":"+1-206-266-1000","corporateMobilePhoneNumber":"+1-206-555-1201","corporateEmail":"aws.corporate@amazon.com","responsibleAuthority":{"individuals":[{"name":"Andy Jassy","role":"Chief Executive Officer - Amazon","email":"andy.jassy@amazon.com","phoneNumber":"+1-206-555-1301","mobileNumber":"+1-206-555-1302"},{"name":"Matt Garman","role":"Chief Executive Officer - AWS","email":"matt.garman@amazon.com","phoneNumber":"+1-206-555-1303","mobileNumber":"+1-206-555-1304"}],"teamResponsible":"AWS Executive Leadership"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2029-01-31T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 13. Kenji Tanaka (personal-individual)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-9163-4827-0591-3748',
  'active',
  'Kenji Tanaka',
  'Kenji Tanaka',
  'personal-individual',
  '{"entityOriginLocationAndCountry":"Tokyo, Japan","entityEmail":{"email1":"kenji.tanaka@gmail.com","email2":"tanaka.dev@yahoo.co.jp"},"companyRegistrationNumber":null,"website":"https://kenjitanaka.jp"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2027-05-20T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 14. Mozilla Foundation (non-profit)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-2748-6193-5027-8461',
  'active',
  'Mozilla Foundation',
  'Mozilla Foundation',
  'non-profit',
  '{"entityOriginLocationAndCountry":"San Francisco, California, United States","entityEmail":{"email1":"info@mozilla.org","email2":"licensing@mozilla.org","email3":"legal@mozilla.org","email4":"donate@mozilla.org"},"companyRegistrationNumber":"C2896201","website":"https://www.mozilla.org","corporateDetails":{"division":"Engineering Division","corporatePhoneNumber":"+1-650-903-0800","corporateMobilePhoneNumber":"+1-650-555-1401","corporateEmail":"engineering@mozilla.org","responsibleAuthority":{"individuals":[{"name":"Laura Chambers","role":"Chief Executive Officer","email":"laura.chambers@mozilla.org","phoneNumber":"+1-650-555-1501","mobileNumber":"+1-650-555-1502"}],"teamResponsible":"Mozilla Engineering Leadership"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2027-09-30T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 15. Garcia Creative Collective (personal-team)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-6284-1937-5082-9473',
  'active',
  'Garcia Creative Collective',
  'Garcia Family Creative Collective',
  'personal-team',
  '{"entityOriginLocationAndCountry":"Barcelona, Catalonia, Spain","entityEmail":{"email1":"team@garciacreative.es","email2":"maria.garcia@garciacreative.es","email3":"carlos.garcia@garciacreative.es","email4":"studio@garciacreative.es"},"companyRegistrationNumber":null,"website":"https://garciacreative.es"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2026-12-15T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 16. Apple Developer (corporate)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-4738-2916-5083-7294',
  'active',
  'Apple Developer',
  'Apple Incorporated',
  'corporate',
  '{"entityOriginLocationAndCountry":"Cupertino, California, United States","entityEmail":{"email1":"developer@apple.com","email2":"licensing@apple.com","email3":"legal@apple.com","email4":"enterprise@apple.com","email5":"appstore@apple.com"},"companyRegistrationNumber":"C0806592","website":"https://developer.apple.com","corporateDetails":{"division":"Developer Relations and App Store","corporatePhoneNumber":"+1-408-996-1010","corporateMobilePhoneNumber":"+1-408-555-1601","corporateEmail":"devrelations@apple.com","responsibleAuthority":{"individuals":[{"name":"Tim Cook","role":"Chief Executive Officer","email":"tim.cook@apple.com","phoneNumber":"+1-408-555-1701","mobileNumber":"+1-408-555-1702"},{"name":"Craig Federighi","role":"Senior Vice President - Software Engineering","email":"craig.federighi@apple.com","phoneNumber":"+1-408-555-1703","mobileNumber":"+1-408-555-1704"}],"teamResponsible":"Apple Developer Relations Team"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2028-08-31T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 17. Sofia Andersson (personal-individual)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-8193-4726-0582-1947',
  'active',
  'Sofia Andersson',
  'Sofia Marie Andersson',
  'personal-individual',
  '{"entityOriginLocationAndCountry":"Stockholm, Sweden","entityEmail":{"email1":"sofia.andersson@gmail.com","email2":"s.andersson@protonmail.com"},"companyRegistrationNumber":null,"website":"https://sofiaandersson.se"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2027-04-10T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 18. Electronic Frontier Foundation (non-profit)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-3927-8461-5029-7183',
  'active',
  'Electronic Frontier Foundation',
  'Electronic Frontier Foundation',
  'non-profit',
  '{"entityOriginLocationAndCountry":"San Francisco, California, United States","entityEmail":{"email1":"info@eff.org","email2":"licensing@eff.org","email3":"legal@eff.org","email4":"action@eff.org","email5":"press@eff.org"},"companyRegistrationNumber":"94-3091431","website":"https://www.eff.org","corporateDetails":{"division":"Technology Projects","corporatePhoneNumber":"+1-415-436-9333","corporateMobilePhoneNumber":"+1-415-555-1801","corporateEmail":"tech@eff.org","responsibleAuthority":{"individuals":[{"name":"Cindy Cohn","role":"Executive Director","email":"cindy.cohn@eff.org","phoneNumber":"+1-415-555-1901","mobileNumber":"+1-415-555-1902"}],"teamResponsible":"EFF Technology Team"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2027-11-15T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 19. Kim Studio Team (personal-team)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-7294-1836-5027-4918',
  'active',
  'Kim Studio Team',
  'Kim Family Studio Collective',
  'personal-team',
  '{"entityOriginLocationAndCountry":"Seoul, South Korea","entityEmail":{"email1":"team@kimstudio.kr","email2":"minjun.kim@kimstudio.kr","email3":"soojin.kim@kimstudio.kr","email4":"projects@kimstudio.kr"},"companyRegistrationNumber":null,"website":"https://kimstudio.kr"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2026-06-20T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 20. NVIDIA AI (corporate)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-5183-9274-0628-3741',
  'active',
  'NVIDIA AI',
  'NVIDIA Corporation',
  'corporate',
  '{"entityOriginLocationAndCountry":"Santa Clara, California, United States","entityEmail":{"email1":"ai@nvidia.com","email2":"licensing@nvidia.com","email3":"legal@nvidia.com","email4":"enterprise@nvidia.com","email5":"developer@nvidia.com"},"companyRegistrationNumber":"C2188539","website":"https://www.nvidia.com/ai","corporateDetails":{"division":"AI and Deep Learning Division","corporatePhoneNumber":"+1-408-486-2000","corporateMobilePhoneNumber":"+1-408-555-2001","corporateEmail":"ai.corporate@nvidia.com","responsibleAuthority":{"individuals":[{"name":"Jensen Huang","role":"Chief Executive Officer and Founder","email":"jensen.huang@nvidia.com","phoneNumber":"+1-408-555-2101","mobileNumber":"+1-408-555-2102"}],"teamResponsible":"NVIDIA AI Research Team"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2028-03-31T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 21. Marco Rossi (personal-individual)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-4618-2739-5081-9374',
  'active',
  'Marco Rossi',
  'Marco Antonio Rossi',
  'personal-individual',
  '{"entityOriginLocationAndCountry":"Milan, Lombardy, Italy","entityEmail":{"email1":"marco.rossi@gmail.com","email2":"m.rossi.dev@libero.it"},"companyRegistrationNumber":null,"website":"https://marcorossi.it"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2027-07-25T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 22. Doctors Without Borders Tech (non-profit)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-9372-4618-0593-2847',
  'active',
  'Doctors Without Borders Tech',
  E'M\u00E9decins Sans Fronti\u00E8res International',
  'non-profit',
  '{"entityOriginLocationAndCountry":"Geneva, Switzerland","entityEmail":{"email1":"info@msf.org","email2":"tech@msf.org","email3":"legal@msf.org","email4":"donations@msf.org"},"companyRegistrationNumber":"CHE-108.533.928","website":"https://www.msf.org","corporateDetails":{"division":"Medical Technology and Innovation","corporatePhoneNumber":"+41-22-849-8400","corporateMobilePhoneNumber":"+41-79-555-2201","corporateEmail":"innovation@msf.org","responsibleAuthority":{"individuals":[{"name":"Christos Christou","role":"International President","email":"christos.christou@msf.org","phoneNumber":"+41-22-555-2301","mobileNumber":"+41-79-555-2302"}],"teamResponsible":"MSF Technology Innovation Team"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2028-02-28T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 23. Patel Development Group (personal-team)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-2847-6193-5028-7461',
  'active',
  'Patel Development Group',
  'Patel Brothers Software Development Group',
  'personal-team',
  '{"entityOriginLocationAndCountry":"Mumbai, Maharashtra, India","entityEmail":{"email1":"team@pateldevgroup.in","email2":"raj.patel@pateldevgroup.in","email3":"amit.patel@pateldevgroup.in","email4":"projects@pateldevgroup.in","email5":"support@pateldevgroup.in"},"companyRegistrationNumber":null,"website":"https://pateldevgroup.in"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2027-01-10T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 24. Salesforce Platform (corporate)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-6183-2947-5081-3729',
  'active',
  'Salesforce Platform',
  'Salesforce Incorporated',
  'corporate',
  '{"entityOriginLocationAndCountry":"San Francisco, California, United States","entityEmail":{"email1":"platform@salesforce.com","email2":"licensing@salesforce.com","email3":"legal@salesforce.com","email4":"enterprise@salesforce.com","email5":"partners@salesforce.com"},"companyRegistrationNumber":"C2589631","website":"https://www.salesforce.com","corporateDetails":{"division":"Salesforce Platform and Developer Experience","corporatePhoneNumber":"+1-415-901-7000","corporateMobilePhoneNumber":"+1-415-555-2401","corporateEmail":"platform.corporate@salesforce.com","responsibleAuthority":{"individuals":[{"name":"Marc Benioff","role":"Chair and Chief Executive Officer","email":"marc.benioff@salesforce.com","phoneNumber":"+1-415-555-2501","mobileNumber":"+1-415-555-2502"}],"teamResponsible":"Salesforce Platform Engineering"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2028-10-31T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 25. Anna Kowalski (personal-individual)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-8274-1936-5029-4718',
  'active',
  'Anna Kowalski',
  'Anna Maria Kowalski',
  'personal-individual',
  '{"entityOriginLocationAndCountry":"Warsaw, Poland","entityEmail":{"email1":"anna.kowalski@gmail.com","email2":"a.kowalski@wp.pl","email3":"kowalski.anna@protonmail.com"},"companyRegistrationNumber":null,"website":"https://annakowalski.pl"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2026-08-05T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 26. UNICEF Innovation (non-profit)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-3948-2716-5083-9274',
  'active',
  'UNICEF Innovation',
  'United Nations Children''s Fund',
  'non-profit',
  '{"entityOriginLocationAndCountry":"New York City, New York, United States","entityEmail":{"email1":"info@unicef.org","email2":"innovation@unicef.org","email3":"legal@unicef.org","email4":"donate@unicef.org","email5":"press@unicef.org"},"companyRegistrationNumber":"13-1760110","website":"https://www.unicef.org/innovation","corporateDetails":{"division":"Office of Innovation","corporatePhoneNumber":"+1-212-326-7000","corporateMobilePhoneNumber":"+1-212-555-2601","corporateEmail":"office.innovation@unicef.org","responsibleAuthority":{"individuals":[{"name":"Catherine Russell","role":"Executive Director","email":"catherine.russell@unicef.org","phoneNumber":"+1-212-555-2701","mobileNumber":"+1-212-555-2702"}],"teamResponsible":"UNICEF Innovation Team"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2028-05-31T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 27. Mueller Design Collective (personal-team)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-7291-4836-5027-1948',
  'active',
  'Mueller Design Collective',
  'Mueller Family Design Collective',
  'personal-team',
  '{"entityOriginLocationAndCountry":"Berlin, Germany","entityEmail":{"email1":"team@muellerdesign.de","email2":"hans.mueller@muellerdesign.de","email3":"greta.mueller@muellerdesign.de","email4":"studio@muellerdesign.de"},"companyRegistrationNumber":null,"website":"https://muellerdesign.de"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2026-11-20T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 28. IBM Watson (corporate)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-4827-1936-5082-7394',
  'active',
  'IBM Watson',
  'International Business Machines Corporation',
  'corporate',
  '{"entityOriginLocationAndCountry":"Armonk, New York, United States","entityEmail":{"email1":"watson@ibm.com","email2":"licensing@ibm.com","email3":"legal@ibm.com","email4":"enterprise@ibm.com","email5":"cloud@ibm.com"},"companyRegistrationNumber":"13-0871985","website":"https://www.ibm.com/watson","corporateDetails":{"division":"Watson AI and Cloud Division","corporatePhoneNumber":"+1-914-499-1900","corporateMobilePhoneNumber":"+1-914-555-2801","corporateEmail":"watson.corporate@ibm.com","responsibleAuthority":{"individuals":[{"name":"Arvind Krishna","role":"Chairman and Chief Executive Officer","email":"arvind.krishna@ibm.com","phoneNumber":"+1-914-555-2901","mobileNumber":"+1-914-555-2902"}],"teamResponsible":"IBM Watson Leadership Team"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2027-12-31T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 29. Carlos Mendoza (personal-individual)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-5927-3846-1029-7483',
  'active',
  'Carlos Mendoza',
  'Carlos Eduardo Mendoza',
  'personal-individual',
  '{"entityOriginLocationAndCountry":"Mexico City, Mexico","entityEmail":{"email1":"carlos.mendoza@gmail.com","email2":"c.mendoza.dev@outlook.com"},"companyRegistrationNumber":null,"website":"https://carlosmendoza.mx"}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2027-09-12T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;

-- 30. Linux Foundation (non-profit)
INSERT INTO licenses (user_id, license_key, status, entity_name, legal_entity_name, entity_type, entity_details, activated_at, expiration_date, created_at)
VALUES (
  NULL,
  'NP-8163-2947-5028-4719',
  'active',
  'Linux Foundation',
  'The Linux Foundation',
  'non-profit',
  '{"entityOriginLocationAndCountry":"San Francisco, California, United States","entityEmail":{"email1":"info@linuxfoundation.org","email2":"licensing@linuxfoundation.org","email3":"legal@linuxfoundation.org","email4":"membership@linuxfoundation.org","email5":"events@linuxfoundation.org"},"companyRegistrationNumber":"46-0503801","website":"https://www.linuxfoundation.org","corporateDetails":{"division":"Open Source Program Office","corporatePhoneNumber":"+1-415-723-9709","corporateMobilePhoneNumber":"+1-415-555-3001","corporateEmail":"ospo@linuxfoundation.org","responsibleAuthority":{"individuals":[{"name":"Jim Zemlin","role":"Executive Director","email":"jim.zemlin@linuxfoundation.org","phoneNumber":"+1-415-555-3101","mobileNumber":"+1-415-555-3102"}],"teamResponsible":"Linux Foundation Technical Advisory Board"}}}'::jsonb,
  '2026-01-15T00:00:00Z',
  '2028-04-15T00:00:00Z',
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (license_key) DO UPDATE SET
  status = EXCLUDED.status, entity_name = EXCLUDED.entity_name, legal_entity_name = EXCLUDED.legal_entity_name,
  entity_type = EXCLUDED.entity_type, entity_details = EXCLUDED.entity_details,
  activated_at = EXCLUDED.activated_at, expiration_date = EXCLUDED.expiration_date;


-- ============================================================
-- 3. PAYMENT RECORDS (all completed, $99.00 each)
-- ============================================================
INSERT INTO payments (user_id, license_key, amount_cents, currency, status, payment_method, paid_at, created_at) VALUES
  (NULL, 'NP-7492-8361-5028-4917', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-3847-2956-1038-7462', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-5829-4716-3058-9241', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-6173-8294-5012-3867', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-9482-1736-5029-8147', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-2847-6193-0574-8326', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-1938-4726-8051-3942', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-7361-2948-5073-1846', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-4927-8163-0592-7438', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-8274-1639-5082-4716', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-3619-7284-0593-1847', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-5827-3946-1072-8394', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-9163-4827-0591-3748', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-2748-6193-5027-8461', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-6284-1937-5082-9473', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-4738-2916-5083-7294', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-8193-4726-0582-1947', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-3927-8461-5029-7183', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-7294-1836-5027-4918', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-5183-9274-0628-3741', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-4618-2739-5081-9374', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-9372-4618-0593-2847', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-2847-6193-5028-7461', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-6183-2947-5081-3729', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-8274-1936-5029-4718', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-3948-2716-5083-9274', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-7291-4836-5027-1948', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-4827-1936-5082-7394', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-5927-3846-1029-7483', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  (NULL, 'NP-8163-2947-5028-4719', 9900, 'usd', 'completed', 'card', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z');


-- ============================================================
-- VERIFY
-- ============================================================
SELECT 'license_key_registry' AS tbl, COUNT(*) AS cnt FROM license_key_registry
UNION ALL SELECT 'licenses', COUNT(*) FROM licenses
UNION ALL SELECT 'payments', COUNT(*) FROM payments;
