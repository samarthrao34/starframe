// ============================================
// UI Effects Module
// Loading, reveal, floating, ripple, lazy load
// ============================================

// Add loading animation
function addLoadingAnimation() {
    const body = document.body;
    body.style.opacity = '0';

    window.addEventListener('load', () => {
        body.style.transition = 'opacity 0.5s ease';
        body.style.opacity = '1';
    });
}

// Add smooth reveal animations for elements
function addRevealAnimations() {
    const revealElements = document.querySelectorAll('.about-text, .about-visual, .section-header');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        el.style.transition = `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
        revealObserver.observe(el);
    });
}

// Initialize loading and reveal animations
addLoadingAnimation();
addRevealAnimations();

// Add floating animation to hero elements
function addFloatingAnimation() {
    const floatingElements = document.querySelectorAll('.scroll-indicator');

    floatingElements.forEach(element => {
        element.style.animation = 'float 3s ease-in-out infinite';
    });

    // Add the float keyframes if not already added
    if (!document.getElementById('float-animation')) {
        const style = document.createElement('style');
        style.id = 'float-animation';
        style.textContent = `
            @keyframes float {
                0%, 100% {
                    transform: translateX(-50%) translateY(0px);
                }
                50% {
                    transform: translateX(-50%) translateY(-10px);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize floating animation
addFloatingAnimation();

// Add click effect to buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn')) {
        // Create ripple effect
        const button = e.target;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;

        button.style.position = 'relative';
        button.appendChild(ripple);

        // Add ripple animation
        if (!document.getElementById('ripple-animation')) {
            const style = document.createElement('style');
            style.id = 'ripple-animation';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
});

// Performance optimization: Lazy load images
function initLazyLoading() {
    const images = document.querySelectorAll('img');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                }
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => {
        if (img.dataset.src) {
            imageObserver.observe(img);
        }
    });
}

// Initialize lazy loading
initLazyLoading();
