/**
 * StarFrame Sparkle Star Animation Controller
 * Handles random movement patterns and logo merge effect
 */

class SparkleStarController {
    constructor() {
        this.star = null;
        this.logo = null;
        this.animationDuration = 90000; // 90 seconds
        this.mergeDistance = 100; // Distance to trigger merge effect
        this.isNearLogo = false;
        this.currentCycle = 0;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.star = document.querySelector('.sparkle-star');
        this.logo = document.querySelector('.nav-logo h1');
        
        if (!this.star || !this.logo) {
            console.warn('SparkleStarController: Required elements not found');
            return;
        }
        
        this.startAnimationCycle();
        this.setupEventListeners();
        this.monitorPosition();
    }
    
    startAnimationCycle() {
        // Start the main animation cycle
        this.star.style.animation = `sparkleFloat ${this.animationDuration}ms ease-in-out infinite`;
        
        // Monitor animation progress
        setInterval(() => {
            this.checkMergeProximity();
        }, 100);
        
        // Handle animation end and restart
        this.star.addEventListener('animationiteration', () => {
            this.handleAnimationComplete();
        });
    }
    
    checkMergeProximity() {
        if (!this.star || !this.logo) return;
        
        const starRect = this.star.getBoundingClientRect();
        const logoRect = this.logo.getBoundingClientRect();
        
        const starCenter = {
            x: starRect.left + starRect.width / 2,
            y: starRect.top + starRect.height / 2
        };
        
        const logoCenter = {
            x: logoRect.left + logoRect.width / 2,
            y: logoRect.top + logoRect.height / 2
        };
        
        const distance = Math.sqrt(
            Math.pow(starCenter.x - logoCenter.x, 2) + 
            Math.pow(starCenter.y - logoCenter.y, 2)
        );
        
        if (distance < this.mergeDistance && !this.isNearLogo) {
            this.triggerMergeEffect();
        } else if (distance > this.mergeDistance && this.isNearLogo) {
            this.endMergeEffect();
        }
    }
    
    triggerMergeEffect() {
        this.isNearLogo = true;
        
        // Add merge effect to logo
        this.logo.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        this.logo.style.textShadow = `
            0 0 20px rgba(212, 165, 116, 0.8),
            0 0 40px rgba(212, 165, 116, 0.6),
            0 0 60px rgba(255, 215, 0, 0.4)
        `;
        this.logo.style.transform = 'scale(1.05)';
        
        // Enhanced star effect during merge
        this.star.style.filter = `
            drop-shadow(0 6px 25px rgba(255, 215, 0, 0.9))
            brightness(1.3)
        `;
        
        // Add sparkle burst effect
        this.createSparklesBurst();
    }
    
    endMergeEffect() {
        this.isNearLogo = false;
        
        // Reset logo effects
        this.logo.style.textShadow = '';
        this.logo.style.transform = 'scale(1)';
        
        // Reset star effects
        this.star.style.filter = 'drop-shadow(0 4px 15px rgba(212, 165, 116, 0.5))';
    }
    
    createSparklesBurst() {
        if (!this.logo) return;
        
        const logoRect = this.logo.getBoundingClientRect();
        const burstContainer = document.createElement('div');
        burstContainer.className = 'sparkle-burst';
        burstContainer.style.position = 'fixed';
        burstContainer.style.left = logoRect.left + 'px';
        burstContainer.style.top = logoRect.top + 'px';
        burstContainer.style.width = logoRect.width + 'px';
        burstContainer.style.height = logoRect.height + 'px';
        burstContainer.style.pointerEvents = 'none';
        burstContainer.style.zIndex = '10001';
        
        // Create multiple sparkle particles
        for (let i = 0; i < 12; i++) {
            const sparkle = document.createElement('span');
            sparkle.innerHTML = '✨';
            sparkle.style.position = 'absolute';
            sparkle.style.fontSize = '12px';
            sparkle.style.color = '#FFD700';
            sparkle.style.left = Math.random() * logoRect.width + 'px';
            sparkle.style.top = Math.random() * logoRect.height + 'px';
            sparkle.style.animation = `sparklePopAndFade 2s ease-out forwards`;
            sparkle.style.animationDelay = (i * 0.1) + 's';
            
            burstContainer.appendChild(sparkle);
        }
        
        document.body.appendChild(burstContainer);
        
        // Clean up after animation
        setTimeout(() => {
            if (burstContainer.parentNode) {
                burstContainer.parentNode.removeChild(burstContainer);
            }
        }, 2500);
    }
    
    handleAnimationComplete() {
        this.currentCycle++;
        console.log(`✨ StarFrame: Animation cycle ${this.currentCycle} completed - Star merged with logo!`);
        
        // Brief pause at logo position for merge effect
        setTimeout(() => {
            this.resetPosition();
        }, 1000);
    }
    
    resetPosition() {
        // Reset to starting position for next cycle
        this.star.style.animation = 'none';
        this.star.offsetHeight; // Trigger reflow
        this.star.style.animation = `sparkleFloat ${this.animationDuration}ms ease-in-out infinite`;
    }
    
    setupEventListeners() {
        // Click effect on star
        this.star.addEventListener('click', (e) => {
            e.preventDefault();
            this.star.classList.add('clicked');
            setTimeout(() => {
                this.star.classList.remove('clicked');
            }, 800);
        });
        
        // Hover effects
        this.star.addEventListener('mouseenter', () => {
            this.star.style.animationDuration = '2s';
        });
        
        this.star.addEventListener('mouseleave', () => {
            this.star.style.animationDuration = this.animationDuration + 'ms';
        });
    }
    
    monitorPosition() {
        // Log position periodically for debugging
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            setInterval(() => {
                const rect = this.star.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const xPercent = Math.round((rect.left / viewportWidth) * 100);
                const yPercent = Math.round((rect.top / viewportHeight) * 100);
                
                // Only log occasionally to avoid spam
                if (Math.random() < 0.01) { // 1% chance per check
                    console.log(`⭐ Star position: ${xPercent}vw, ${yPercent}vh | Cycle: ${this.currentCycle}`);
                }
            }, 1000);
        }
    }
}

// Add the sparkle pop animation CSS
const sparkleCSS = `
@keyframes sparklePopAndFade {
    0% {
        opacity: 0;
        transform: scale(0.5) translateY(0px);
    }
    20% {
        opacity: 1;
        transform: scale(1.2) translateY(-10px);
    }
    40% {
        opacity: 0.8;
        transform: scale(1) translateY(-20px);
    }
    100% {
        opacity: 0;
        transform: scale(0.3) translateY(-40px) rotate(180deg);
    }
}

.sparkle-burst {
    animation: burstGlow 2s ease-out;
}

@keyframes burstGlow {
    0% { filter: brightness(1); }
    50% { filter: brightness(1.5) saturate(1.3); }
    100% { filter: brightness(1); }
}
`;

// Inject the CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = sparkleCSS;
document.head.appendChild(styleSheet);

// Initialize the controller
const sparkleController = new SparkleStarController();

// Export for potential external use
window.SparkleStarController = SparkleStarController;
