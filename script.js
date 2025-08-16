// ===========================
// Figma Design System JavaScript
// ===========================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeModal();
    initializeMobileMenu();
    initializeScrollEffects();
    initializeAnimations();
});

// Tab Component
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and panes
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding pane
            this.classList.add('active');
            const targetPane = document.getElementById(targetTab);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

// Modal Component
function initializeModal() {
    const modal = document.getElementById('modal');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    const modalClose = document.querySelector('.modal-close');
    
    // Open modal function
    window.openModal = function() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    
    // Close modal function
    window.closeModal = function() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    // Close modal when clicking backdrop
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking close button
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Mobile Menu
function initializeMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navActions = document.querySelector('.nav-actions');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // Create mobile menu if it doesn't exist
            let mobileMenu = document.querySelector('.mobile-menu');
            if (!mobileMenu) {
                mobileMenu = document.createElement('div');
                mobileMenu.className = 'mobile-menu';
                
                // Clone nav items
                const menuClone = navMenu.cloneNode(true);
                const actionsClone = navActions.cloneNode(true);
                
                mobileMenu.appendChild(menuClone);
                mobileMenu.appendChild(actionsClone);
                
                document.querySelector('.navbar').appendChild(mobileMenu);
            }
            
            mobileMenu.classList.toggle('active');
        });
    }
}

// Scroll Effects
function initializeScrollEffects() {
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        // Add shadow to navbar on scroll
        if (currentScroll > 10) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar on scroll
        if (currentScroll > lastScroll && currentScroll > 100) {
            navbar.classList.add('hidden');
        } else {
            navbar.classList.remove('hidden');
        }
        
        lastScroll = currentScroll;
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Animations on scroll
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Stagger animations for grid items
                if (entry.target.classList.contains('feature-card')) {
                    const cards = document.querySelectorAll('.feature-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('animate-in');
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);
    
    // Observe elements
    document.querySelectorAll('.feature-card, .stat-item, .showcase-card').forEach(el => {
        observer.observe(el);
    });
}

// Add CSS for mobile menu and animations
const style = document.createElement('style');
style.textContent = `
    .mobile-menu {
        position: fixed;
        top: 60px;
        left: 0;
        right: 0;
        background: white;
        box-shadow: var(--shadow-xl);
        padding: var(--spacing-xl);
        transform: translateY(-100%);
        transition: transform var(--transition-base);
        z-index: 999;
    }
    
    .mobile-menu.active {
        transform: translateY(0);
    }
    
    .mobile-menu .nav-menu {
        flex-direction: column;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
    }
    
    .mobile-menu .nav-actions {
        flex-direction: column;
        gap: var(--spacing-md);
    }
    
    .mobile-menu .nav-actions button {
        width: 100%;
    }
    
    .navbar.scrolled {
        box-shadow: var(--shadow-md);
    }
    
    .navbar.hidden {
        transform: translateY(-100%);
    }
    
    .navbar {
        transition: transform var(--transition-base), box-shadow var(--transition-base);
    }
    
    .mobile-menu-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .mobile-menu-toggle.active span:nth-child(2) {
        opacity: 0;
    }
    
    .mobile-menu-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-in {
        animation: slideInUp 0.6s ease forwards;
    }
    
    .feature-card,
    .stat-item,
    .showcase-card {
        opacity: 0;
    }
    
    .feature-card.animate-in,
    .stat-item.animate-in,
    .showcase-card.animate-in {
        opacity: 1;
    }
`;

document.head.appendChild(style);

// Interactive hover effects for cards
document.querySelectorAll('.floating-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.animationPlayState = 'paused';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.animationPlayState = 'running';
    });
});

// Add ripple effect to buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple effect CSS
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    button {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;

document.head.appendChild(rippleStyle);

// Parallax effect for hero section
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero');
    if (parallax) {
        const speed = 0.5;
        parallax.style.transform = `translateY(${scrolled * speed}px)`;
    }
});

// Number counter animation for stats
function animateNumbers() {
    const stats = document.querySelectorAll('.stat-item h3');
    
    stats.forEach(stat => {
        const target = parseInt(stat.innerText.replace(/\D/g, ''));
        const suffix = stat.innerText.replace(/[0-9]/g, '');
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            stat.innerText = Math.floor(current) + suffix;
        }, 30);
    });
}

// Trigger number animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            entry.target.classList.add('counted');
            animateNumbers();
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Form validation
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Basic validation
        const inputs = this.querySelectorAll('input[required], textarea[required]');
        let valid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('error');
                valid = false;
            } else {
                input.classList.remove('error');
            }
        });
        
        if (valid) {
            // Show success message
            alert('Form submitted successfully!');
            this.reset();
        }
    });
});

// Add error styling
const errorStyle = document.createElement('style');
errorStyle.textContent = `
    input.error,
    textarea.error {
        border-color: var(--danger-color) !important;
    }
`;
document.head.appendChild(errorStyle);

console.log('Figma Design System initialized successfully!');