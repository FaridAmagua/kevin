document.addEventListener('DOMContentLoaded', () => {

    // --- PREMIUM SMOOTH SCROLL (LENIS) ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // --- SCROLL REVEAL ANIMATION ---
    const slideUpElements = document.querySelectorAll('.slide-up');

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px', // Trigger slightly closer to the bottom to ensure reliable activation
        threshold: 0
    };

    const revealOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    slideUpElements.forEach(el => revealOnScroll.observe(el));


    // --- DELAYED COUNT UP ANIMATION OBSERVER ---
    const counterObserverOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.4 // Only trigger when 40% of the cards grid is visible on screen
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCountUpAnimations();
                observer.unobserve(entry.target);
            }
        });
    }, counterObserverOptions);

    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        counterObserver.observe(statsGrid);
    }


    // --- COUNT UP ANIMATION ---
    let animationsStarted = false;

    function startCountUpAnimations() {
        if (animationsStarted) return;
        animationsStarted = true;

        const counters = document.querySelectorAll('.count-up');
        const duration = 3500; // 3.5 seconds

        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const startTime = performance.now();
            const formatNumber = (num) => {
                return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            };

            const updateCounter = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                if (elapsedTime < duration) {
                    const progress = elapsedTime / duration;
                    // Ease out Quart function for smooth acceleration and deceleration without jumping too fast at the start
                    const easeOutProgress = 1 - Math.pow(1 - progress, 4);
                    
                    const currentValue = Math.floor(target * easeOutProgress);
                    counter.innerText = formatNumber(currentValue);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = formatNumber(target);
                }
            };
            requestAnimationFrame(updateCounter);
        });
    }

});
