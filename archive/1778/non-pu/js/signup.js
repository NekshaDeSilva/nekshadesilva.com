/**
 * NonPU Instant Account System - Signup Flow Logic
 * GVMA PBC
 * 
 * Multi-step signup wizard with entity type handling
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase (wrapped in try-catch so UI still works if Supabase isn't configured yet)
    var pendingKey = null;
    try {
        NonPUAuth.initSupabase();
        pendingKey = NonPUAuth.handleLicenseKeyFromURL();
    } catch (err) {
        console.warn('Supabase init skipped:', err.message);
    }
    
    // Show pending license notice if exists
    if (pendingKey) {
        document.getElementById('pendingLicenseNotice').style.display = 'flex';
        document.getElementById('pendingKeyDisplay').textContent = pendingKey;
    }
    
    // ============================================
    // State Management
    // ============================================
    let currentStep = 1;
    let totalSteps = 5;
    let entityType = null;
    let nonprofitType = null;
    
    const formData = {
        entityType: null,
        nonprofitType: null,
        firstName: null,
        lastName: null,
        entityName: null,
        legalEntityName: null,
        entityLogo: null,
        email: null,
        password: null,
        country: null,
        city: null,
        registrationNumber: null,
        division: null,
        website: null,
        phoneNumber: null,
        employeeCount: null,
        authority: {
            name: null,
            role: null,
            email: null,
            phone: null,
            team: null
        },
        agreeTerms: false,
        agreeUpdates: false
    };
    
    // ============================================
    // UI Elements
    // ============================================
    const loadingBar = document.getElementById('loadingBar');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const stepProgress = document.getElementById('stepProgress');
    
    // Steps
    const step1 = document.getElementById('step1');
    const step2nonprofit = document.getElementById('step2nonprofit');
    const step2basic = document.getElementById('step2basic');
    const step3location = document.getElementById('step3location');
    const step4authority = document.getElementById('step4authority');
    const step5agreement = document.getElementById('step5agreement');
    
    // ============================================
    // Utility Functions
    // ============================================
    function showLoading() {
        loadingBar.classList.add('active');
    }
    
    function hideLoading() {
        loadingBar.classList.remove('active');
    }
    
    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'flex';
    }
    
    function hideError() {
        errorMessage.style.display = 'none';
    }
    
    function updateStepProgress(step) {
        const dots = stepProgress.querySelectorAll('.step-dot');
        dots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            if (index + 1 < step) {
                dot.classList.add('completed');
            } else if (index + 1 === step) {
                dot.classList.add('active');
            }
        });
    }
    
    function hideAllSteps() {
        step1.style.display = 'none';
        step2nonprofit.style.display = 'none';
        step2basic.style.display = 'none';
        step3location.style.display = 'none';
        step4authority.style.display = 'none';
        step5agreement.style.display = 'none';
    }
    
    function showStep(stepElement) {
        hideAllSteps();
        stepElement.style.display = 'block';
        stepElement.classList.add('animate-slideUp');
    }
    
    // ============================================
    // Step 1: Entity Type Selection
    // ============================================
    const entityTypeCards = document.querySelectorAll('.entity-type-card[data-type]');
    const step1NextBtn = document.getElementById('step1Next');
    
    // Add click handlers for entity type cards
    entityTypeCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove selected from all entity type cards
            entityTypeCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected to clicked card
            this.classList.add('selected');
            
            // Update state
            entityType = this.dataset.type;
            formData.entityType = entityType;
            
            // Enable next button
            step1NextBtn.disabled = false;
            
            console.log('Selected entity type:', entityType);
        });
        
        // Also handle keyboard navigation
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    step1NextBtn.addEventListener('click', function() {
        hideError();
        
        if (!entityType) {
            showError('Please select an entity type');
            return;
        }
        
        if (entityType === 'non-profit') {
            // Show nonprofit subtype selection
            currentStep = 2;
            updateStepProgress(currentStep);
            showStep(step2nonprofit);
        } else {
            // Skip to basic info
            currentStep = 2;
            updateStepProgress(currentStep);
            setupBasicInfoStep();
            showStep(step2basic);
        }
    });
    
    // ============================================
    // Step 2 (Nonprofit): Subtype Selection
    // ============================================
    const nonprofitTypeCards = document.querySelectorAll('.entity-type-card[data-subtype]');
    const step2nonprofitNextBtn = document.getElementById('step2nonprofitNext');
    const step2nonprofitBackBtn = document.getElementById('step2nonprofitBack');
    
    nonprofitTypeCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            nonprofitTypeCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            nonprofitType = this.dataset.subtype;
            formData.nonprofitType = nonprofitType;
            step2nonprofitNextBtn.disabled = false;
            
            console.log('Selected nonprofit type:', nonprofitType);
        });
        
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    step2nonprofitNextBtn.addEventListener('click', function() {
        currentStep = 3;
        updateStepProgress(currentStep);
        setupBasicInfoStep();
        showStep(step2basic);
    });
    
    step2nonprofitBackBtn.addEventListener('click', function() {
        currentStep = 1;
        updateStepProgress(currentStep);
        showStep(step1);
    });
    
    // ============================================
    // Step 2/3: Basic Information
    // ============================================
    const personalFields = document.getElementById('personalFields');
    const corporateFields = document.getElementById('corporateFields');
    const basicInfoForm = document.getElementById('basicInfoForm');
    const basicInfoSubtitle = document.getElementById('basicInfoSubtitle');
    const step2basicBackBtn = document.getElementById('step2basicBack');
    
    function setupBasicInfoStep() {
        // Toggle visibility AND disable hidden required fields so the browser
        // doesn't try to validate inputs that are display:none (which causes
        // "An invalid form control with name='...' is not focusable" errors).
        if (entityType === 'personal-individual' || entityType === 'personal-team') {
            personalFields.style.display = 'block';
            corporateFields.style.display = 'none';
            basicInfoSubtitle.textContent = entityType === 'personal-team' 
                ? 'Enter the primary account holder details' 
                : 'Enter your details';
            // Enable personal, disable corporate
            document.getElementById('firstName').disabled = false;
            document.getElementById('lastName').disabled = false;
            document.getElementById('entityName').disabled = true;
            document.getElementById('legalEntityName').disabled = true;
        } else {
            personalFields.style.display = 'none';
            corporateFields.style.display = 'block';
            basicInfoSubtitle.textContent = 'Enter your organization details';
            // Disable personal, enable corporate
            document.getElementById('firstName').disabled = true;
            document.getElementById('lastName').disabled = true;
            document.getElementById('entityName').disabled = false;
            document.getElementById('legalEntityName').disabled = false;
        }
    }
    
    // ============================================
    // Logo Upload Handling (Corporate / Non-Profit)
    // ============================================
    const logoUploadArea = document.getElementById('logoUploadArea');
    const logoPlaceholder = document.getElementById('logoPlaceholder');
    const logoPreview = document.getElementById('logoPreview');
    const logoRemoveBtn = document.getElementById('logoRemoveBtn');
    const entityLogoInput = document.getElementById('entityLogoInput');
    
    const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
    
    function handleLogoFile(file) {
        if (!file) return;
        
        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            showError('Logo must be a PNG, JPG, or SVG file');
            return;
        }
        
        // Validate file size
        if (file.size > MAX_LOGO_SIZE) {
            showError('Logo file must be under 2MB');
            return;
        }
        
        hideError();
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUri = e.target.result;
            formData.entityLogo = dataUri;
            
            // Show preview
            logoPreview.src = dataUri;
            logoPreview.style.display = 'block';
            logoPlaceholder.style.display = 'none';
            logoRemoveBtn.style.display = 'flex';
            logoUploadArea.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }
    
    function removeLogo() {
        formData.entityLogo = null;
        logoPreview.src = '';
        logoPreview.style.display = 'none';
        logoPlaceholder.style.display = 'flex';
        logoRemoveBtn.style.display = 'none';
        logoUploadArea.classList.remove('has-image');
        entityLogoInput.value = '';
    }
    
    if (logoUploadArea) {
        // Click to upload
        logoUploadArea.addEventListener('click', function(e) {
            if (e.target === logoRemoveBtn || logoRemoveBtn.contains(e.target)) return;
            entityLogoInput.click();
        });
        
        // File selected via input
        entityLogoInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                handleLogoFile(this.files[0]);
            }
        });
        
        // Remove button
        logoRemoveBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            removeLogo();
        });
        
        // Drag and drop
        logoUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('drag-over');
        });
        
        logoUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
        });
        
        logoUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
            
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleLogoFile(e.dataTransfer.files[0]);
            }
        });
    }
    
    basicInfoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hideError();
        
        // Validate passwords match
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (password.length < 8) {
            showError('Password must be at least 8 characters');
            return;
        }
        
        // Save form data
        if (entityType === 'personal-individual' || entityType === 'personal-team') {
            formData.firstName = document.getElementById('firstName').value;
            formData.lastName = document.getElementById('lastName').value;
            formData.entityName = `${formData.firstName} ${formData.lastName}`;
            formData.legalEntityName = formData.entityName;
        } else {
            formData.entityName = document.getElementById('entityName').value;
            formData.legalEntityName = document.getElementById('legalEntityName').value;
        }
        
        formData.email = document.getElementById('signupEmail').value;
        formData.password = password;
        
        // Move to next step
        currentStep++;
        updateStepProgress(currentStep);
        setupLocationStep();
        showStep(step3location);
    });
    
    step2basicBackBtn.addEventListener('click', function() {
        if (entityType === 'non-profit') {
            currentStep = 2;
            updateStepProgress(currentStep);
            showStep(step2nonprofit);
        } else {
            currentStep = 1;
            updateStepProgress(currentStep);
            showStep(step1);
        }
    });
    
    // ============================================
    // Step 3/4: Location & Contact
    // ============================================
    const locationForm = document.getElementById('locationForm');
    const corporateContactFields = document.getElementById('corporateContactFields');
    const employeeCountGroup = document.getElementById('employeeCountGroup');
    const regNumberLabel = document.getElementById('regNumberLabel');
    const step3BackBtn = document.getElementById('step3Back');
    
    function setupLocationStep() {
        if (entityType === 'corporate' || entityType === 'non-profit') {
            corporateContactFields.style.display = 'block';
            
            if (entityType === 'corporate') {
                employeeCountGroup.style.display = 'block';
                regNumberLabel.textContent = 'Company registration number';
            } else {
                employeeCountGroup.style.display = 'none';
                if (nonprofitType === 'educational-university' || nonprofitType === 'educational-school') {
                    regNumberLabel.textContent = 'Institution registration number';
                } else {
                    regNumberLabel.textContent = 'Nonprofit registration number';
                }
            }
        } else {
            corporateContactFields.style.display = 'none';
        }
    }
    
    locationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hideError();
        
        // Save form data
        formData.country = document.getElementById('country').value;
        formData.city = document.getElementById('city').value;
        
        if (entityType === 'corporate' || entityType === 'non-profit') {
            formData.registrationNumber = document.getElementById('registrationNumber').value;
            formData.division = document.getElementById('division').value;
            formData.website = document.getElementById('website').value;
            formData.phoneNumber = document.getElementById('phoneNumber').value;
            
            if (entityType === 'corporate') {
                formData.employeeCount = document.getElementById('employeeCount').value;
            }
            
            // Move to authority step for corporate/nonprofit
            currentStep++;
            updateStepProgress(currentStep);
            showStep(step4authority);
        } else {
            // Skip authority step for personal
            currentStep = totalSteps;
            updateStepProgress(currentStep);
            showStep(step5agreement);
        }
    });
    
    step3BackBtn.addEventListener('click', function() {
        currentStep--;
        updateStepProgress(currentStep);
        showStep(step2basic);
    });
    
    // ============================================
    // Step 4/5: Responsible Authority
    // ============================================
    const authorityForm = document.getElementById('authorityForm');
    const step4BackBtn = document.getElementById('step4Back');
    
    authorityForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hideError();
        
        // Save form data
        formData.authority.name = document.getElementById('authorityName').value;
        formData.authority.role = document.getElementById('authorityRole').value;
        formData.authority.email = document.getElementById('authorityEmail').value;
        formData.authority.phone = document.getElementById('authorityPhone').value;
        formData.authority.team = document.getElementById('teamName').value;
        
        // Move to agreement step
        currentStep = totalSteps;
        updateStepProgress(currentStep);
        showStep(step5agreement);
    });
    
    step4BackBtn.addEventListener('click', function() {
        currentStep--;
        updateStepProgress(currentStep);
        showStep(step3location);
    });
    
    // ============================================
    // Step 5/6: Agreement & Create Account
    // ============================================
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    const agreeUpdatesCheckbox = document.getElementById('agreeUpdates');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const step5BackBtn = document.getElementById('step5Back');
    
    agreeTermsCheckbox.addEventListener('change', function() {
        createAccountBtn.disabled = !this.checked;
        formData.agreeTerms = this.checked;
    });
    
    agreeUpdatesCheckbox.addEventListener('change', function() {
        formData.agreeUpdates = this.checked;
    });
    
    step5BackBtn.addEventListener('click', function() {
        if (entityType === 'corporate' || entityType === 'non-profit') {
            currentStep--;
            updateStepProgress(currentStep);
            showStep(step4authority);
        } else {
            currentStep--;
            updateStepProgress(currentStep);
            showStep(step3location);
        }
    });
    
    createAccountBtn.addEventListener('click', async function() {
        hideError();

        // Validate hCaptcha
        const hcaptchaError = document.getElementById('hcaptchaError');
        let captchaToken = '';
        try {
            captchaToken = hcaptcha.getResponse();
        } catch(err) {
            console.warn('hCaptcha not loaded yet');
        }
        if (!captchaToken) {
            if (hcaptchaError) hcaptchaError.style.display = 'block';
            showError('Please complete the captcha verification.');
            return;
        }
        if (hcaptchaError) hcaptchaError.style.display = 'none';

        showLoading();
        createAccountBtn.disabled = true;
        createAccountBtn.textContent = 'Creating...';
        
        try {
            // 0. Ensure Supabase CDN is ready
            await NonPUAuth.waitForSupabase(10000);
            NonPUAuth.initSupabase();

            // 1. Create user account in Supabase Auth
            const { data: authData, error: authError } = await NonPUAuth.signUp(
                formData.email,
                formData.password
            );
            
            if (authError) {
                throw new Error(authError.message);
            }
            
            // 2. Sign in immediately (since we're not requiring email verification for now)
            const { data: signInData, error: signInError } = await NonPUAuth.signIn(
                formData.email,
                formData.password
            );
            
            if (signInError) {
                // User might need to verify email first
                console.log('Sign in after signup:', signInError.message);
            }
            
            // 3. Create entity account with all collected data
            const entityData = {
                entityType: formData.entityType,
                entityName: formData.entityName,
                legalEntityName: formData.legalEntityName,
                entityLogo: formData.entityLogo || null,
                entityOriginLocation: formData.city,
                entityCountry: formData.country,
                entityOriginLocationAndCountry: formData.city && formData.country 
                    ? `${formData.city}, ${formData.country}` : null,
                entityEmails: {
                    email1: formData.email,
                    email2: formData.authority?.email || null
                },
                companyRegistrationNumber: formData.registrationNumber,
                website: formData.website,
                corporateDetails: (formData.entityType === 'corporate' || formData.entityType === 'non-profit') ? {
                    division: formData.division,
                    phoneNumber: formData.phoneNumber,
                    employeeCount: formData.employeeCount,
                    responsibleAuthority: {
                        individuals: [{
                            name: formData.authority.name,
                            role: formData.authority.role,
                            email: formData.authority.email,
                            phoneNumber: formData.authority.phone
                        }],
                        teamResponsible: formData.authority.team
                    }
                } : null,
                nonprofitDetails: formData.entityType === 'non-profit' ? {
                    nonprofitType: formData.nonprofitType
                } : null
            };
            
            // Save to localStorage as fallback
            localStorage.setItem('nonpu_pending_entity', JSON.stringify(entityData));

            // Persist entity to Supabase database
            if (signInData && signInData.user) {
                try {
                    const { data: entityRow, error: entityError } = await NonPUAuth.createEntityAccount(entityData);
                    if (entityError) {
                        console.warn('Entity DB insert failed (will retry from dashboard):', entityError);
                    } else {
                        console.log('Entity saved to database:', entityRow);
                    }
                } catch (dbErr) {
                    console.warn('Entity DB insert error (will retry from dashboard):', dbErr);
                }
            }

            // 4. If there's a pending license key, add it
            const pendingKey = NonPUAuth.getPendingLicenseKey();
            if (pendingKey) {
                console.log('Pending license to be activated:', pendingKey);
            }
            
            hideLoading();
            
            // 5. Redirect to dashboard (using folder-based URL)
            window.location.href = '../dashboard/';
            
        } catch (error) {
            hideLoading();
            createAccountBtn.disabled = false;
            createAccountBtn.textContent = 'Create Account';
            showError(error.message || 'Failed to create account. Please try again.');
        }
    });
    
    // ============================================
    // Initialize
    // ============================================
    updateStepProgress(currentStep);
});