// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize all functions
    initNavigation();
    initScrollAnimations();
    initPortfolioFilter();
    initCommissionForm();
    initSmoothScroll();
    initParallaxEffect();
    initScrollProgress();
    initHeadingAnimation();
});

function initHeadingAnimation() {
    const sections = document.querySelectorAll('section[id]');
    let animating = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animating) {
                const heading = entry.target.querySelector('.section-title');
                if (heading) {
                    animating = true;
                    animateStarsAroundHeading(heading, () => {
                        animating = false;
                    });
                }
            }
        });
    }, { threshold: 0.5 });

    sections.forEach(section => {
        observer.observe(section);
    });
}

function createSparkle(x, y) {
    const container = document.querySelector('.sparkle-container');
    if (!container) return;
    const sparkle = document.createElement('div');
    const isStar = Math.random() > 0.5;
    sparkle.className = isStar ? 'sparkle star-sparkle' : 'sparkle circle-sparkle';
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    const size = Math.random() * 3 + 1;
    sparkle.style.width = `${size}px`;
    sparkle.style.height = `${size}px`;
    const color = `hsl(${Math.random() * 10 + 35}, 100%, ${Math.random() * 25 + 50}%)`;
    sparkle.style.backgroundColor = color;
    sparkle.style.boxShadow = `0 0 ${Math.random() * 5 + 5}px ${color}`;
    container.appendChild(sparkle);

    setTimeout(() => {
        sparkle.remove();
    }, 1200);
}

function animateStarsAroundHeading(heading, onComplete) {
    if (!window.starAnimation) return;

    const starsToAnimate = window.starAnimation.smallStars.slice(0, 2);
    if (starsToAnimate.some(star => star.dataset.animating === 'true')) {
        if (onComplete) onComplete();
        return;
    }

    const startPositions = starsToAnimate.map(star => {
        const transform = star.style.transform;
        const [x, y] = transform.match(/-?[\d\.]+/g).map(Number);
        return { x, y };
    });

    starsToAnimate.forEach(star => {
        star.dataset.animating = 'true';
    });

    const headingRect = heading.getBoundingClientRect();
    const headingCenter = {
        x: headingRect.left + headingRect.width / 2,
        y: headingRect.top + headingRect.height / 2
    };

    // Create a burst of sparkles
    for (let i = 0; i < 10; i++) {
        createSparkle(headingCenter.x, headingCenter.y);
    }

    const animationDuration = 4000; // 4 seconds
    const startTime = Date.now();

    function animate() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / animationDuration, 1);
        const easeOutQuart = 1 - (--progress) * progress * progress * progress;

        starsToAnimate.forEach((star, index) => {
            const angle = (elapsedTime / 1000) * (index === 0 ? 1.2 : -1.5) * 2 * Math.PI / 2;
            const radius = (headingRect.width / 2 + 50) + 15 * Math.sin((elapsedTime / 1000) * (index === 0 ? 2 : 2.5));

            let targetX, targetY;

            if (progress < 0.9) {
                targetX = headingCenter.x + radius * Math.cos(angle) + 10 * Math.sin((elapsedTime / 1000) * (index === 0 ? 3 : 3.5));
                targetY = headingCenter.y + radius * Math.sin(angle) + 10 * Math.cos((elapsedTime / 1000) * (index === 0 ? 3 : 3.5));
            } else {
                const returnProgress = (progress - 0.9) / 0.1;
                const currentTargetX = headingCenter.x + radius * Math.cos(angle);
                const currentTargetY = headingCenter.y + radius * Math.sin(angle);
                targetX = currentTargetX + (startPositions[index].x - currentTargetX) * returnProgress;
                targetY = currentTargetY + (startPositions[index].y - currentTargetY) * returnProgress;
            }

            const currentX = startPositions[index].x + (targetX - startPositions[index].x) * easeOutQuart;
            const currentY = startPositions[index].y + (targetY - startPositions[index].y) * easeOutQuart;

            star.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${angle * 150}deg)`;
        });

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            starsToAnimate.forEach(star => {
                delete star.dataset.animating;
            });
            if (onComplete) onComplete();
        }
    }

    animate();
}

// Navigation functionality
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!navbar || !hamburger || !navMenu) {
        return;
    }

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(254, 252, 248, 0.98)';
            navbar.style.boxShadow = '0 8px 25px rgba(60, 60, 60, 0.12)';
        } else {
            navbar.style.background = 'rgba(254, 252, 248, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');

        // Animate hamburger bars
        const bars = hamburger.querySelectorAll('.bar');
        bars.forEach((bar, index) => {
            if (hamburger.classList.contains('active')) {
                if (index === 0) {
                    bar.style.transform = 'rotate(45deg) translate(5px, 5px)';
                } else if (index === 1) {
                    bar.style.opacity = '0';
                } else {
                    bar.style.transform = 'rotate(-45deg) translate(7px, -6px)';
                }
            } else {
                bar.style.transform = 'none';
                bar.style.opacity = '1';
            }
        });
    });

    // Close mobile menu when clicking on nav links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');

            // Reset hamburger bars
            const bars = hamburger.querySelectorAll('.bar');
            bars.forEach(bar => {
                bar.style.transform = 'none';
                bar.style.opacity = '1';
            });
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');

            const bars = hamburger.querySelectorAll('.bar');
            bars.forEach(bar => {
                bar.style.transform = 'none';
                bar.style.opacity = '1';
            });
        }
    });
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add different animation classes based on element type
                if (entry.target.classList.contains('team-member')) {
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.style.opacity = '1';
                } else if (entry.target.classList.contains('portfolio-item')) {
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.style.opacity = '1';
                } else {
                    entry.target.classList.add('animate-in');
                }

                // Add stagger effect for grid items
                const siblings = Array.from(entry.target.parentNode.children);
                if (siblings.length > 1) {
                    const index = siblings.indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.1}s`;
                }
            }
        });
    }, observerOptions);

    // Observe sections and cards
    const animatedElements = document.querySelectorAll(
        '.about-text, .about-visual, .team-member, .portfolio-item, .commission-content, .section-header'
    );

    animatedElements.forEach((el, index) => {
        if (el.classList.contains('team-member') ||
            el.classList.contains('portfolio-item')) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        observer.observe(el);
    });
}

// Portfolio filter functionality
function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            portfolioItems.forEach((item, index) => {
                const category = item.getAttribute('data-category');

                if (filterValue === 'all' || category === filterValue) {
                    item.style.display = 'block';
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';

                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, index * 100);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-20px)';

                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // Add hover effects to portfolio items
    portfolioItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-5px)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0)';
        });
    });
}

// Commission form functionality - specialized logic is handled on the commission page
function initCommissionForm() {
    // This is intentionally left empty or for global form logic only
    // Specialized project/payment logic is in commission.html
}

// Field validation
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();

    // Remove existing error styles
    field.style.borderColor = 'rgba(212, 165, 116, 0.2)';

    if (field.hasAttribute('required') && !value) {
        field.style.borderColor = '#e74c3c';
        return false;
    }

    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            field.style.borderColor = '#e74c3c';
            return false;
        }
    }

    field.style.borderColor = '#27ae60';
    return true;
}

function clearFieldError(e) {
    const field = e.target;
    if (field.style.borderColor === 'rgb(231, 76, 60)') {
        field.style.borderColor = 'rgba(212, 165, 116, 0.2)';
    }
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icon = type === 'success' ? 'fa-check-circle' :
        type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';

    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;

    // Add notification styles
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        info: '#3498db'
    };

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 15px 40px rgba(60, 60, 60, 0.18);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 400px;
        font-family: 'Inter', sans-serif;
        font-size: 0.95rem;
    `;

    document.body.appendChild(notification);

    // Show notification with bounce effect
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto hide after 5 seconds
    const autoHideTimer = setTimeout(() => {
        hideNotification(notification);
    }, 5000);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        margin-left: 1rem;
    `;

    closeBtn.addEventListener('click', () => {
        clearTimeout(autoHideTimer);
        hideNotification(notification);
    });
}

function hideNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 400);
}

// Smooth scroll functionality
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 100; // Account for fixed navbar

                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });

                // Add a subtle flash effect to the target section
                targetElement.style.background = 'rgba(212, 165, 116, 0.1)';
                setTimeout(() => {
                    targetElement.style.background = '';
                }, 1000);
            }
        });
    });
}

// Parallax effect for hero section
function initParallaxEffect() {
    const heroSection = document.querySelector('.hero');
    const heroBackground = document.querySelector('.hero-bg-image');

    if (heroSection && heroBackground) {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (ticking) return;

            ticking = true;
            requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                const parallax = Math.min(scrolled * 0.2, 120);
                heroBackground.style.transform = `translateY(${parallax}px)`;
                ticking = false;
            });
        }, { passive: true });
    }
}

// Scroll progress indicator
function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.id = 'scroll-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(135deg, #d4a574 0%, #b8935f 100%);
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// Team member card interactions
document.addEventListener('DOMContentLoaded', () => {
    const teamMembers = document.querySelectorAll('.team-member');

    teamMembers.forEach(member => {
        member.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-12px)';
        });

        member.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });
});

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

// Initialize commission dialog
document.addEventListener('DOMContentLoaded', function() {
    // Add dialog initialization to the existing DOMContentLoaded listener
    setTimeout(() => {
        initCommissionDialog();
    }, 1000); // Small delay to ensure page is fully loaded
});

// Add smooth entrance animation for dialog particles
function animateDialogParticles() {
    const particles = document.querySelectorAll('.dialog-particles .particle');
    particles.forEach((particle, index) => {
        particle.style.animationDelay = `${index * 0.2}s`;
    });
}

// Call particle animation when dialog is shown
const originalShowFunction = showCommissionDialog;
showCommissionDialog = function() {
    originalShowFunction();
    setTimeout(() => {
        animateDialogParticles();
    }, 200);
};

// Export functions to global scope for onclick handlers
window.showCommissionDialog = showCommissionDialog;
window.closeCommissionDialog = closeCommissionDialog;

// Floating Sparkle Star functionality
function initFloatingSparkleStar() {
    const sparkleStar = document.getElementById('sparkle-star');
    
    if (sparkleStar) {
        let isMoving = false;
        
        // Add click event listener to redirect to commission page
        sparkleStar.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Add click animation
            sparkleStar.classList.add('clicked');
            
            // Create magical burst effect
            createSparkleExplosion(sparkleStar);
            
            // Show success message
            showNotification('🌟 Taking you to our magical commission page! ✨', 'success');
            
            // Redirect after a short delay to show the animation
            setTimeout(() => {
                window.location.href = 'commission.html';
            }, 800);
        });
        
        // Add hover tooltip
        sparkleStar.setAttribute('title', 'Click me to start your magical commission! ✨');
        
        // Initialize random movement system
        initRandomMovement(sparkleStar);
        
        // Enhanced hover effects
        sparkleStar.addEventListener('mouseenter', function() {
            // Intensify sparkle animations on hover
            const sparkles = sparkleStar.querySelectorAll('.sparkle');
            sparkles.forEach(sparkle => {
                sparkle.style.animationDuration = '0.8s';
                sparkle.style.transform = 'scale(1.3)';
            });
            
            // Add glow effect
            sparkleStar.style.filter = 'drop-shadow(0 0 20px #FFD700) drop-shadow(0 0 40px #FFD700)';
        });
        
        sparkleStar.addEventListener('mouseleave', function() {
            // Reset sparkle animations
            const sparkles = sparkleStar.querySelectorAll('.sparkle');
            sparkles.forEach(sparkle => {
                sparkle.style.animationDuration = '3s';
                sparkle.style.transform = 'scale(1)';
            });
            
            // Reset glow
            sparkleStar.style.filter = '';
        });
    }
}

// Random movement system for sparkle star
function initRandomMovement(sparkleStar) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const starSize = 50;
    
    let currentX = parseFloat(sparkleStar.style.left) || 10;
    let currentY = parseFloat(sparkleStar.style.top) || 20;
    
    function getRandomPosition() {
        return {
            x: Math.random() * (viewportWidth - starSize - 100) + 50,
            y: Math.random() * (viewportHeight - starSize - 200) + 100
        };
    }
    
    function moveToPosition(targetX, targetY, duration = 3000) {
        const startTime = Date.now();
        const startX = currentX;
        const startY = currentY;
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth movement
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            currentX = startX + (targetX - startX) * easeProgress;
            currentY = startY + (targetY - startY) * easeProgress;
            
            sparkleStar.style.left = currentX + 'px';
            sparkleStar.style.top = currentY + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Schedule next movement
                setTimeout(() => {
                    const nextPos = getRandomPosition();
                    const distance = Math.sqrt(Math.pow(nextPos.x - currentX, 2) + Math.pow(nextPos.y - currentY, 2));
                    const nextDuration = Math.max(2000, Math.min(6000, distance * 8));
                    moveToPosition(nextPos.x, nextPos.y, nextDuration);
                }, Math.random() * 2000 + 1000); // Random pause between 1-3 seconds
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Start random movement after initial delay
    setTimeout(() => {
        const firstPos = getRandomPosition();
        moveToPosition(firstPos.x, firstPos.y);
    }, 2000);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const newViewportWidth = window.innerWidth;
        const newViewportHeight = window.innerHeight;
        
        // Adjust position if star is now out of bounds
        if (currentX > newViewportWidth - starSize) {
            currentX = newViewportWidth - starSize - 50;
            sparkleStar.style.left = currentX + 'px';
        }
        if (currentY > newViewportHeight - starSize) {
            currentY = newViewportHeight - starSize - 100;
            sparkleStar.style.top = currentY + 'px';
        }
    });
}

// Create magical explosion effect when sparkle star is clicked
function createSparkleExplosion(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Create multiple sparkle particles
    for (let i = 0; i < 12; i++) {
        const sparkle = document.createElement('div');
        sparkle.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            width: 8px;
            height: 8px;
            background: radial-gradient(circle, #FFD700, #FFF8DC);
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            box-shadow: 0 0 10px #FFD700;
        `;
        
        const angle = (i * 30) * Math.PI / 180; // Convert to radians
        const distance = 100 + Math.random() * 50;
        const endX = centerX + Math.cos(angle) * distance;
        const endY = centerY + Math.sin(angle) * distance;
        
        document.body.appendChild(sparkle);
        
        // Animate the sparkle
        sparkle.animate([
            {
                transform: 'translate(0, 0) scale(0)',
                opacity: 1
            },
            {
                transform: `translate(${endX - centerX}px, ${endY - centerY}px) scale(1)`,
                opacity: 0.8
            },
            {
                transform: `translate(${endX - centerX}px, ${endY - centerY}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: 800,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => {
            sparkle.remove();
        };
    }
    
    // Add screen flash effect
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(circle at ${centerX}px ${centerY}px, rgba(255, 215, 0, 0.3) 0%, transparent 60%);
        pointer-events: none;
        z-index: 9998;
    `;
    
    document.body.appendChild(flash);
    
    flash.animate([
        { opacity: 0 },
        { opacity: 1 },
        { opacity: 0 }
    ], {
        duration: 300,
        easing: 'ease-out'
    }).onfinish = () => {
        flash.remove();
    };
}

// Add continuous sparkle generation system
function addContinuousSparkles() {
    const sparkleStar = document.getElementById('sparkle-star');
    if (!sparkleStar) return;
    
    // Array of sparkle emojis and characters
    const sparkleTypes = ['✨', '⭐', '🌟', '💫', '⚡', '🔯', '✦', '✧', '★', '☆'];
    
    function createContinuousSparkle() {
        const rect = sparkleStar.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create sparkle around the star
        const sparkle = document.createElement('div');
        const sparkleType = sparkleTypes[Math.floor(Math.random() * sparkleTypes.length)];
        sparkle.textContent = sparkleType;
        
        // Random position around the star
        const angle = Math.random() * 360 * Math.PI / 180;
        const distance = 30 + Math.random() * 40;
        const startX = centerX + Math.cos(angle) * distance;
        const startY = centerY + Math.sin(angle) * distance;
        
        sparkle.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            font-size: ${0.5 + Math.random() * 0.5}rem;
            pointer-events: none;
            z-index: 9996;
            color: ${getRandomSparkleColor()};
            text-shadow: 0 0 5px rgba(255, 215, 0, 0.8);
        `;
        
        document.body.appendChild(sparkle);
        
        // Animate the sparkle
        const moveDistance = 20 + Math.random() * 30;
        const moveAngle = Math.random() * 360 * Math.PI / 180;
        const endX = startX + Math.cos(moveAngle) * moveDistance;
        const endY = startY + Math.sin(moveAngle) * moveDistance;
        
        sparkle.animate([
            {
                transform: 'scale(0) rotate(0deg)',
                opacity: 0
            },
            {
                transform: 'scale(1) rotate(180deg)',
                opacity: 1,
                offset: 0.3
            },
            {
                transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.3) rotate(360deg)`,
                opacity: 0
            }
        ], {
            duration: 1500 + Math.random() * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => {
            sparkle.remove();
        };
    }
    
    function getRandomSparkleColor() {
        const colors = [
            '#FFD700',
            '#FFF8DC',
            '#FFEF94',
            '#F0E68C',
            '#FFFACD',
            '#FFE55C',
            '#DAA520',
            '#B8860B'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Create sparkles continuously
    function startContinuousSparkles() {
        // Create initial burst
        for (let i = 0; i < 3; i++) {
            setTimeout(() => createContinuousSparkle(), i * 200);
        }
        
        // Then create sparkles at random intervals
        function scheduleNextSparkle() {
            setTimeout(() => {
                createContinuousSparkle();
                scheduleNextSparkle();
            }, 800 + Math.random() * 1200); // Random interval between 0.8-2 seconds
        }
        
        scheduleNextSparkle();
    }
    
    // Start after initial delay
    setTimeout(startContinuousSparkles, 3000);
}

// Add movement trail sparkles
function addMovementTrail() {
    const sparkleStar = document.getElementById('sparkle-star');
    if (!sparkleStar) return;
    
    let lastX = 0, lastY = 0;
    let isFirstCheck = true;
    
    function createTrailSparkle(x, y) {
        const trail = document.createElement('span');
        trail.textContent = Math.random() > 0.5 ? '✨' : '⭐';
        
        // Add slight randomness to position
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 30;
        
        trail.style.cssText = `
            position: fixed;
            left: ${x + offsetX}px;
            top: ${y + offsetY}px;
            font-size: ${0.4 + Math.random() * 0.4}rem;
            pointer-events: none;
            z-index: 9995;
            color: rgba(255, 215, 0, ${0.6 + Math.random() * 0.4});
            text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
        `;
        
        document.body.appendChild(trail);
        
        trail.animate([
            {
                transform: 'scale(1) rotate(0deg) translateY(0px)',
                opacity: 0.8
            },
            {
                transform: 'scale(0.6) rotate(180deg) translateY(-15px)',
                opacity: 0.4,
                offset: 0.7
            },
            {
                transform: 'scale(0) rotate(360deg) translateY(-30px)',
                opacity: 0
            }
        ], {
            duration: 1200 + Math.random() * 800,
            easing: 'cubic-bezier(0.4, 0, 0.6, 1)'
        }).onfinish = () => {
            trail.remove();
        };
    }
    
    // Monitor star movement and create trail
    function monitorMovement() {
        if (sparkleStar) {
            const rect = sparkleStar.getBoundingClientRect();
            const currentX = rect.left + rect.width / 2;
            const currentY = rect.top + rect.height / 2;
            
            if (!isFirstCheck) {
                const distance = Math.sqrt(
                    Math.pow(currentX - lastX, 2) + Math.pow(currentY - lastY, 2)
                );
                
                // Create trail sparkles if star is moving
                if (distance > 15) {
                    // Create multiple trail sparkles for smoother effect
                    const numSparkles = Math.min(3, Math.floor(distance / 20));
                    for (let i = 0; i < numSparkles; i++) {
                        const interpX = lastX + (currentX - lastX) * (i / numSparkles);
                        const interpY = lastY + (currentY - lastY) * (i / numSparkles);
                        setTimeout(() => createTrailSparkle(interpX, interpY), i * 50);
                    }
                }
            }
            
            lastX = currentX;
            lastY = currentY;
            isFirstCheck = false;
        }
    }
    
    // Start monitoring movement
    setTimeout(() => {
        setInterval(monitorMovement, 100);
    }, 2000);
}

// Back to Top Button functionality
function initBackToTopButton() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (backToTopBtn) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        
        // Scroll to top when clicked
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Initialize sparkle star functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add sparkle star initialization to existing DOMContentLoaded
    setTimeout(() => {
        initFloatingSparkleStar();
        addContinuousSparkles();
        addMovementTrail();
        initBackToTopButton();
    }, 1500);
});

