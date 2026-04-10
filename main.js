document.addEventListener('DOMContentLoaded', () => {
    const CALENDLY_URL = 'https://calendly.com/gonzalosbpartner/reunion-gonzalo';

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

    // --- RESULTS CAROUSEL ---
    document.querySelectorAll('[data-results-carousel]').forEach((carousel) => {
        const viewport = carousel.querySelector('[data-carousel-viewport]');
        const track = carousel.querySelector('.results-track');
        const cards = Array.from(track.querySelectorAll('.result-card'));
        const dotsContainer = carousel.querySelector('[data-carousel-dots]');

        if (!viewport || !cards.length || !dotsContainer) return;

        let currentPage = 0;
        let scrollTicking = false;
        let autoPlayId = null;

        const getCardsPerPage = () => {
            if (window.innerWidth >= 1024) return 3;
            if (window.innerWidth >= 768) return 2;
            return 1;
        };

        const getPageCount = () => Math.ceil(cards.length / getCardsPerPage());

        const getAutoPlayDelay = () => {
            if (window.innerWidth >= 1024) return 3000;
            return 2000;
        };

        const getPageOffsets = () => {
            const cardsPerPage = getCardsPerPage();
            const pageCount = getPageCount();
            return Array.from({ length: pageCount }, (_, pageIndex) => {
                const cardIndex = Math.min(pageIndex * cardsPerPage, cards.length - 1);
                return cards[cardIndex].offsetLeft;
            });
        };

        const setActiveDot = (pageIndex) => {
            dotsContainer.querySelectorAll('.results-dot').forEach((dot, dotIndex) => {
                dot.classList.toggle('is-active', dotIndex === pageIndex);
            });
        };

        const updateUI = () => {
            setActiveDot(currentPage);
        };

        const scrollToPage = (pageIndex, behavior = 'smooth') => {
            const pageCount = getPageCount();
            currentPage = Math.max(0, Math.min(pageIndex, pageCount - 1));
            const offsets = getPageOffsets();
            viewport.scrollTo({ left: offsets[currentPage] || 0, behavior });
            updateUI();
        };

        const syncFromScroll = () => {
            const offsets = getPageOffsets();
            let closestPage = 0;
            let closestDistance = Number.POSITIVE_INFINITY;

            offsets.forEach((offset, pageIndex) => {
                const distance = Math.abs(viewport.scrollLeft - offset);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPage = pageIndex;
                }
            });

            currentPage = closestPage;
            updateUI();
        };

        const stopAutoPlay = () => {
            if (autoPlayId) {
                window.clearInterval(autoPlayId);
                autoPlayId = null;
            }
        };

        const startAutoPlay = () => {
            stopAutoPlay();
            if (getPageCount() <= 1) return;

            autoPlayId = window.setInterval(() => {
                const pageCount = getPageCount();
                const nextPage = (currentPage + 1) % pageCount;
                scrollToPage(nextPage);
            }, getAutoPlayDelay());
        };

        const renderDots = () => {
            const pageCount = getPageCount();
            dotsContainer.innerHTML = '';

            for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'results-dot';
                dot.setAttribute('aria-label', `Ir al grupo ${pageIndex + 1}`);
                dot.addEventListener('click', () => {
                    scrollToPage(pageIndex);
                    startAutoPlay();
                });
                dotsContainer.appendChild(dot);
            }

            currentPage = Math.min(currentPage, pageCount - 1);
            scrollToPage(currentPage, 'auto');
            startAutoPlay();
        };

        viewport.addEventListener('scroll', () => {
            if (scrollTicking) return;
            scrollTicking = true;
            requestAnimationFrame(() => {
                syncFromScroll();
                scrollTicking = false;
            });
        });

        carousel.addEventListener('mouseenter', stopAutoPlay);
        carousel.addEventListener('mouseleave', startAutoPlay);
        carousel.addEventListener('focusin', stopAutoPlay);
        carousel.addEventListener('focusout', startAutoPlay);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoPlay();
            } else {
                startAutoPlay();
            }
        });

        window.addEventListener('resize', renderDots);
        renderDots();
    });

    // --- HELP IMAGE SLIDESHOW ---
    const helpSlideshow = document.getElementById('helpSlideshow');
    if (helpSlideshow) {
        const helpImages = Array.from(helpSlideshow.querySelectorAll('.help-image'));

        if (helpImages.length > 1) {
            let activeIndex = helpImages.findIndex((image) => image.classList.contains('active'));
            if (activeIndex < 0) {
                activeIndex = 0;
                helpImages[0].classList.add('active');
            }

            window.setInterval(() => {
                helpImages[activeIndex].classList.remove('active');
                activeIndex = (activeIndex + 1) % helpImages.length;
                helpImages[activeIndex].classList.add('active');
            }, 2600);
        }
    }


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

    // --- VIDEO/IFRAME EVENT FOR DELAYED CTA ---
    const heroVideo = document.getElementById('hero-video');
    const videoOverlay = document.getElementById('video-cta-overlay');

    if (heroVideo && videoOverlay) {
        if (heroVideo.tagName === 'VIDEO') {
            heroVideo.addEventListener('play', () => {
                setTimeout(() => {
                    videoOverlay.classList.add('visible');
                }, 3000);
            }, { once: true });
        } else {
            // YouTube iframe: we don't get native play events without extra API wiring
            setTimeout(() => {
                videoOverlay.classList.add('visible');
            }, 2500);
        }
    }

    // --- CALENDLY CTA LINKS ---
    document.querySelectorAll('[data-calendly-link]').forEach((button) => {
        button.addEventListener('click', () => {
            window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
        });
    });
});
