// StarFrame Real-Time Analytics Tracker
class StarFrameAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.pageStartTime = Date.now();
        this.lastActivity = Date.now();
        this.interactions = [];
        this.isActive = true;
        this.heartbeatInterval = null;
        
        // Initialize tracking immediately
        this.init();
    }

    init() {
        // Track page load immediately
        this.trackPageView();
        
        // Set up all event listeners
        this.setupEventListeners();
        
        // Start heartbeat to show user is active
        this.startHeartbeat();
        
        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.trackPageExit();
        });
        
        // Track visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackPageHidden();
            } else {
                this.trackPageVisible();
            }
        });
        
        // Track scroll activity
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            this.updateLastActivity();
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.trackScroll();
            }, 1000); // Track scroll after 1 second of no scrolling
        });
    }

    setupEventListeners() {
        // Track all link clicks
        document.addEventListener('click', (event) => {
            const target = event.target;
            const link = target.closest('a');
            
            if (link) {
                this.trackLinkClick(link);
            }
            
            // Track button clicks
            if (target.matches('button, input[type="button"], input[type="submit"]')) {
                this.trackButtonClick(target);
            }
            
            // Track navigation menu interactions
            if (target.matches('nav a, .menu a, .navbar a')) {
                this.trackNavigationClick(target);
            }
            
            // Track any clickable element
            this.trackClick(target);
        });

        // Track form interactions
        document.addEventListener('submit', (event) => {
            this.trackFormSubmission(event.target);
        });

        document.addEventListener('input', (event) => {
            if (event.target.matches('input, textarea, select')) {
                this.trackFormInteraction(event.target);
            }
        });

        document.addEventListener('focus', (event) => {
            if (event.target.matches('input, textarea, select')) {
                this.trackFormFocus(event.target);
            }
        });

        // Track mouse movement (to detect active users)
        let mouseTimeout;
        document.addEventListener('mousemove', () => {
            this.updateLastActivity();
            this.isActive = true;
        });

        // Track keyboard activity
        document.addEventListener('keydown', () => {
            this.updateLastActivity();
            this.isActive = true;
        });

        // Track touch events (mobile)
        document.addEventListener('touchstart', () => {
            this.updateLastActivity();
            this.isActive = true;
        });
    }

    // Track page view
    trackPageView() {
        const data = {
            type: 'page_view',
            page_url: window.location.href,
            page_title: document.title,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        this.sendData(data);
    }

    // Track link clicks
    trackLinkClick(link) {
        const data = {
            type: 'link_click',
            link_url: link.href,
            link_text: link.textContent.trim().substring(0, 100),
            link_id: link.id || null,
            link_class: link.className || null,
            current_page: window.location.href,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        this.sendData(data);
        this.updateLastActivity();
    }

    // Track button clicks
    trackButtonClick(button) {
        const data = {
            type: 'button_click',
            button_text: button.textContent.trim().substring(0, 100),
            button_id: button.id || null,
            button_class: button.className || null,
            button_type: button.type || null,
            current_page: window.location.href,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        this.sendData(data);
        this.updateLastActivity();
    }

    // Track navigation clicks
    trackNavigationClick(navElement) {
        const data = {
            type: 'navigation_click',
            nav_text: navElement.textContent.trim(),
            nav_url: navElement.href,
            nav_section: this.getNavigationSection(navElement),
            current_page: window.location.href,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        this.sendData(data);
        this.updateLastActivity();
    }

    // Track form submissions
    trackFormSubmission(form) {
        const formData = new FormData(form);
        const fields = {};
        
        // Get form field names (not values for privacy)
        for (let [key, value] of formData.entries()) {
            fields[key] = typeof value === 'string' ? value.length : 'file';
        }
        
        const data = {
            type: 'form_submission',
            form_id: form.id || null,
            form_class: form.className || null,
            form_action: form.action || null,
            form_method: form.method || 'get',
            form_fields: Object.keys(fields),
            field_count: Object.keys(fields).length,
            current_page: window.location.href,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        this.sendData(data);
        this.updateLastActivity();
    }

    // Track form interactions
    trackFormInteraction(field) {
        const data = {
            type: 'form_interaction',
            field_name: field.name || null,
            field_type: field.type || field.tagName.toLowerCase(),
            field_id: field.id || null,
            current_page: window.location.href,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        this.sendData(data);
        this.updateLastActivity();
    }

    // Track form field focus
    trackFormFocus(field) {
        const data = {
            type: 'form_focus',
            field_name: field.name || null,
            field_type: field.type || field.tagName.toLowerCase(),
            field_id: field.id || null,
            current_page: window.location.href,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        this.sendData(data);
        this.updateLastActivity();
    }

    // Track scroll activity
    trackScroll() {
        const scrollPercent = Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        
        const data = {
            type: 'scroll',
            scroll_percent: scrollPercent,
            scroll_y: window.scrollY,
            page_height: document.documentElement.scrollHeight,
            viewport_height: window.innerHeight,
            current_page: window.location.href,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        this.sendData(data);
    }

    // Track general clicks
    trackClick(element) {
        const data = {
            type: 'click',
            element_tag: element.tagName.toLowerCase(),
            element_id: element.id || null,
            element_class: element.className || null,
            element_text: element.textContent.trim().substring(0, 50),
            click_x: event.clientX,
            click_y: event.clientY,
            current_page: window.location.href,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        this.sendData(data);
        this.updateLastActivity();
    }

    // Track page exit
    trackPageExit() {
        const timeSpent = Date.now() - this.pageStartTime;
        
        const data = {
            type: 'page_exit',
            time_spent: timeSpent,
            interactions_count: this.interactions.length,
            current_page: window.location.href,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        // Use sendBeacon for reliable sending on page unload
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/analytics/track', JSON.stringify(data));
        } else {
            this.sendData(data);
        }
    }

    // Track page hidden (tab switch)
    trackPageHidden() {
        const data = {
            type: 'page_hidden',
            current_page: window.location.href,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        this.sendData(data);
    }

    // Track page visible (tab return)
    trackPageVisible() {
        const data = {
            type: 'page_visible',
            current_page: window.location.href,
            timestamp: new Date().toISOString(),
            session_id: this.sessionId
        };
        
        this.sendData(data);
        this.updateLastActivity();
    }

    // Send heartbeat to show user is still active
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isActive && !document.hidden) {
                const data = {
                    type: 'heartbeat',
                    current_page: window.location.href,
                    timestamp: new Date().toISOString(),
                    session_id: this.sessionId
                };
                
                this.sendData(data);
            }
            
            // Reset active flag
            this.isActive = false;
        }, 30000); // Send heartbeat every 30 seconds
    }

    // Update last activity time
    updateLastActivity() {
        this.lastActivity = Date.now();
        this.isActive = true;
    }

    // Get navigation section
    getNavigationSection(element) {
        const nav = element.closest('nav, .navbar, .menu');
        if (nav) {
            return nav.className || nav.id || 'navigation';
        }
        return 'unknown';
    }

    // Generate unique session ID
    generateSessionId() {
        return 'session_' + Math.random().toString(36).substring(2, 15) + 
               Date.now().toString(36);
    }

    // Send data to server
    async sendData(data) {
        try {
            // Add to interactions log
            this.interactions.push(data);
            
            // Send immediately to server
            await fetch('/api/analytics/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            console.log('Tracked:', data.type, data);
        } catch (error) {
            console.error('Analytics tracking error:', error);
            // Store in local storage for retry
            this.storeForRetry(data);
        }
    }

    // Store failed requests for retry
    storeForRetry(data) {
        try {
            const stored = JSON.parse(localStorage.getItem('sf_analytics_queue') || '[]');
            stored.push(data);
            localStorage.setItem('sf_analytics_queue', JSON.stringify(stored.slice(-50))); // Keep last 50
        } catch (error) {
            console.error('Failed to store analytics data:', error);
        }
    }

    // Retry failed requests
    async retryFailedRequests() {
        try {
            const stored = JSON.parse(localStorage.getItem('sf_analytics_queue') || '[]');
            if (stored.length > 0) {
                for (const data of stored) {
                    await this.sendData(data);
                }
                localStorage.removeItem('sf_analytics_queue');
            }
        } catch (error) {
            console.error('Failed to retry analytics requests:', error);
        }
    }
}

// Initialize analytics tracking immediately when script loads
const starframeAnalytics = new StarFrameAnalytics();

// Export for manual tracking if needed
window.StarFrameAnalytics = starframeAnalytics;
