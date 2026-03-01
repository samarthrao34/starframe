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
    initReviews();
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

// Commission form functionality
function initCommissionForm() {
    const form = document.getElementById('commissionForm');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            // Simple validation
            if (!data.name || !data.email || !data.service || !data.budget) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }

            // Simulate form submission
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            setTimeout(() => {
                showNotification('Thank you for reaching out! We\'ve received your project details and will get back to you within 24 hours with a personalized proposal. ✨', 'success');
                form.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });

        // Add real-time validation feedback
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
    }
}

// Reviews form functionality (server-backed with real-time updates)
function initReviews() {
    const form = document.getElementById('reviewForm');
    const reviewList = document.getElementById('reviewList');

    if (!form || !reviewList) {
        return;
    }

    // Load existing reviews from server
    fetch('/api/reviews')
        .then(r => r.json())
        .then(data => {
            if (Array.isArray(data.reviews)) {
                data.reviews.forEach(renderReviewCard);
            }
        })
        .catch(() => { });

    // Setup realtime listeners for new/deleted reviews
    setupReviewRealtime();

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const nameInput = form.querySelector('#reviewerName');
        const cityInput = form.querySelector('#reviewerCity');
        const ratingSelect = form.querySelector('#reviewerRating');
        const messageInput = form.querySelector('#reviewerMessage');

        const name = nameInput.value.trim();
        const city = cityInput.value.trim();
        const rating = parseInt(ratingSelect.value, 10);
        const message = messageInput.value.trim();

        if (!name || !message || !rating) {
            showNotification('Please share your name, rating, and experience before submitting.', 'error');
            return;
        }
        if (message.length < 10) {
            showNotification('Please share a little more detail in your review (minimum 10 characters).', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, city, rating, message })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to submit review');
            }
            form.reset();
            showNotification('Thank you for reviewing Starframe! ✨', 'success');
            // Rely on realtime event to render the new review for everyone
        } catch (err) {
            showNotification(err.message || 'Submission failed', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    function renderReviewCard(r) {
        // r: {id, name, city, rating, message, created_at}
        const card = document.createElement('article');
        card.className = 'review-card';
        card.dataset.reviewId = r.id;

        const ratingEl = document.createElement('div');
        ratingEl.className = 'review-rating';
        ratingEl.setAttribute('aria-label', `${r.rating} star rating`);
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('i');
            star.className = i < r.rating ? 'fas fa-star' : 'far fa-star';
            ratingEl.appendChild(star);
        }

        const quote = document.createElement('p');
        quote.className = 'review-quote';
        quote.textContent = `“${r.message}”`;

        const meta = document.createElement('div');
        meta.className = 'reviewer-meta';

        const initials = document.createElement('div');
        initials.className = 'reviewer-initials';
        initials.textContent = getInitials(r.name);

        const detailWrap = document.createElement('div');
        const nameEl = document.createElement('span');
        nameEl.className = 'reviewer-name';
        nameEl.textContent = r.name;
        const roleEl = document.createElement('span');
        roleEl.className = 'reviewer-role';
        roleEl.textContent = r.city || 'Shared via website';

        detailWrap.appendChild(nameEl);
        detailWrap.appendChild(roleEl);
        meta.appendChild(initials);
        meta.appendChild(detailWrap);

        card.appendChild(ratingEl);
        card.appendChild(quote);
        card.appendChild(meta);

        reviewList.prepend(card);
    }

    function setupReviewRealtime() {
        try {
            if (typeof io === 'undefined') return;
            if (!window.reviewsSocket) {
                window.reviewsSocket = io();
            }
            const socket = window.reviewsSocket;
            socket.off && socket.off('review-created');
            socket.off && socket.off('review-deleted');
            socket.on('review-created', (review) => {
                renderReviewCard(review);
            });
            socket.on('review-deleted', ({ id }) => {
                const el = reviewList.querySelector(`[data-review-id="${id}"]`);
                if (el) el.remove();
            });
        } catch (e) { /* noop */ }
    }

    function getInitials(fullName) {
        const parts = fullName.split(' ').filter(Boolean);
        if (parts.length === 0) return 'SF';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
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
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;

            heroBackground.style.transform = `translateY(${parallax}px)`;
        });
    }

    // Mouse parallax for team cards
    document.addEventListener('mousemove', (e) => {
        const interactiveCards = document.querySelectorAll('.team-member');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        interactiveCards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            const cardX = rect.left + rect.width / 2;
            const cardY = rect.top + rect.height / 2;

            const distanceX = (mouseX * window.innerWidth - cardX) / window.innerWidth;
            const distanceY = (mouseY * window.innerHeight - cardY) / window.innerHeight;

            const moveX = distanceX * 10;
            const moveY = distanceY * 10;

            card.style.transform = `translateX(${moveX}px) translateY(${moveY}px)`;
        });
    });
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

// Back to top button (legacy — kept for backward compatibility)
const backToTopButton = document.getElementById("back-to-top-btn");

window.onscroll = function () {
    scrollFunction();
};

function scrollFunction() {
    if (backToTopButton) {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            backToTopButton.style.display = "block";
        } else {
            backToTopButton.style.display = "none";
        }
    }
}

if (backToTopButton) {
    backToTopButton.addEventListener("click", backToTop);
}

function backToTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

