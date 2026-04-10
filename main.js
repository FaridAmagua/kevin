document.addEventListener('DOMContentLoaded', () => {

    // --- PREMIUM SMOOTH SCROLL (LENIS) ---
    const useLenis = window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 768;

    if (useLenis) {
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
    }

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


    // --- INDIVIDUAL COUNT UP ANIMATION OBSERVER ---
    const counterObserverOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateSingleCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, counterObserverOptions);

    document.querySelectorAll('.count-up').forEach(el => counterObserver.observe(el));

    function animateSingleCounter(counter) {
        if (counter.dataset.animated) return;
        counter.dataset.animated = 'true';

        const target = +counter.getAttribute('data-target');
        const duration = 2500; // 2.5 seconds
        const startTime = performance.now();
        
        const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        const updateCounter = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            if (elapsedTime < duration) {
                const progress = elapsedTime / duration;
                const easeOutProgress = 1 - Math.pow(1 - progress, 4);
                counter.innerText = formatNumber(Math.floor(target * easeOutProgress));
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = formatNumber(target);
            }
        };
        requestAnimationFrame(updateCounter);
    }

    // --- VIDEO PLAY EVENT FOR DELAYED CTA ---
    const heroVideo = document.getElementById('hero-video');
    const videoOverlay = document.getElementById('video-cta-overlay');

    if (heroVideo && videoOverlay) {
        heroVideo.addEventListener('play', () => {
            setTimeout(() => {
                videoOverlay.classList.add('visible');
            }, 3000); // 3 seconds after play
        }, { once: true }); // Only trigger once per session/page load
    }
});
