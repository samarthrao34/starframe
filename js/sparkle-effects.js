// ============================================
// Sparkle Effects Module
// Floating sparkle star, explosions, trails
// ============================================

// Floating Sparkle Star functionality
function initFloatingSparkleStar() {
    const sparkleStar = document.getElementById('sparkle-star');

    if (sparkleStar) {
        let isMoving = false;

        // Add click event listener to redirect to commission page
        sparkleStar.addEventListener('click', function (e) {
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
        sparkleStar.addEventListener('mouseenter', function () {
            // Intensify sparkle animations on hover
            const sparkles = sparkleStar.querySelectorAll('.sparkle');
            sparkles.forEach(sparkle => {
                sparkle.style.animationDuration = '0.8s';
                sparkle.style.transform = 'scale(1.3)';
            });

            // Add glow effect
            sparkleStar.style.filter = 'drop-shadow(0 0 20px #FFD700) drop-shadow(0 0 40px #FFD700)';
        });

        sparkleStar.addEventListener('mouseleave', function () {
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

// Initialize sparkle star functionality
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        initFloatingSparkleStar();
        addContinuousSparkles();
        addMovementTrail();
    }, 1500);
});
