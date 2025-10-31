// Password fragments stored in different locations
// These combine to form the actual password
const fragmentA = "1"; // First character
const fragmentB = "2"; // Second character  
const fragmentC = "4"; // Third character
const fragmentD = "5"; // Fourth character

// Hidden fragments in various locations
const hiddenPart1 = fragmentA;
const secretSegment = fragmentB;
const obscuredBit = fragmentC;
const finalPiece = fragmentD;

// Combine fragments to create the actual password
function getActualPassword() {
    return hiddenPart1 + secretSegment + obscuredBit + finalPiece;
}

// Check password function
function checkPassword() {
    const input = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('passwordError');
    const overlay = document.getElementById('passwordOverlay');
    const content = document.getElementById('archiveContent');
    
    const enteredPassword = input.value;
    const correctPassword = getActualPassword();
    
    if (enteredPassword === correctPassword) {
        // Correct password
        overlay.classList.add('hidden');
        content.classList.add('visible');
        sessionStorage.setItem('archiveAccess', 'granted');
    } else {
        // Wrong password
        input.classList.add('error');
        errorMsg.classList.add('show');
        
        // Redirect to main site after 2 seconds
        setTimeout(function() {
            window.location.href = '../index.html';
        }, 2000);
    }
}

// Allow Enter key to submit
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('passwordInput');
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
        
        // Remove error state on input
        passwordInput.addEventListener('input', function() {
            passwordInput.classList.remove('error');
            document.getElementById('passwordError').classList.remove('show');
        });
    }
    
    // Check if already authenticated in this session
    if (sessionStorage.getItem('archiveAccess') === 'granted') {
        document.getElementById('passwordOverlay').classList.add('hidden');
        document.getElementById('archiveContent').classList.add('visible');
    }
});
