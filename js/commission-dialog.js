// ============================================
// Commission Dialog Module
// Show/close/auto-show commission dialog
// ============================================

// Commission Dialog Functions
function showCommissionDialog() {
    const dialog = document.getElementById('commissionDialog');
    if (dialog) {
        dialog.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeCommissionDialog() {
    const dialog = document.getElementById('commissionDialog');
    if (dialog) {
        dialog.classList.remove('show');
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
}

// Auto-show dialog after user interaction
function initCommissionDialog() {
    let hasShownDialog = sessionStorage.getItem('commissionDialogShown');
    let userInteracted = false;

    // Track user interaction
    function trackInteraction() {
        userInteracted = true;
        document.removeEventListener('scroll', trackInteraction);
        document.removeEventListener('click', trackInteraction);
        document.removeEventListener('keydown', trackInteraction);
    }

    document.addEventListener('scroll', trackInteraction);
    document.addEventListener('click', trackInteraction);
    document.addEventListener('keydown', trackInteraction);

    // Show dialog after delay if not shown in this session
    if (!hasShownDialog) {
        setTimeout(() => {
            if (userInteracted) {
                showCommissionDialog();
                sessionStorage.setItem('commissionDialogShown', 'true');
            }
        }, 8000); // Show after 8 seconds of interaction
    }

    // Close dialog when clicking outside
    const dialogOverlay = document.getElementById('commissionDialog');
    if (dialogOverlay) {
        dialogOverlay.addEventListener('click', (e) => {
            if (e.target === dialogOverlay) {
                closeCommissionDialog();
            }
        });

        // Close dialog with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dialogOverlay.classList.contains('show')) {
                closeCommissionDialog();
            }
        });
    }
}

// Add smooth entrance animation for dialog particles
function animateDialogParticles() {
    const particles = document.querySelectorAll('.dialog-particles .particle');
    particles.forEach((particle, index) => {
        particle.style.animationDelay = `${index * 0.2}s`;
    });
}

// Call particle animation when dialog is shown
const originalShowFunction = showCommissionDialog;
showCommissionDialog = function () {
    originalShowFunction();
    setTimeout(() => {
        animateDialogParticles();
    }, 200);
};

// Export functions to global scope for onclick handlers
window.showCommissionDialog = showCommissionDialog;
window.closeCommissionDialog = closeCommissionDialog;

// Initialize commission dialog
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        initCommissionDialog();
    }, 1000);
});
