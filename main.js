document.addEventListener('DOMContentLoaded', () => {
    const CALENDLY_URL = 'https://calendly.com/d/ct9m-g6s-8xk/llamada-de-valoracion-nutritp?hide_event_type_details=1&hide_gdpr_banner=1';

    // --- GTM / DATALAYER TRACKING ---
    // Garantiza que dataLayer exista antes de enviar cualquier evento a Google Tag Manager.
    window.dataLayer = window.dataLayer || [];

    // Evento de carga de la landing principal.
    window.dataLayer.push({
        event: 'page_view_landing'
    });

    function getCalendlyButtonLocation(button) {
        if (!button) return 'unknown';

        if (button.closest('.video-cta-below')) {
            return 'hero_video_cta';
        }

        if (button.closest('.final-cta')) {
            return 'final_cta';
        }

        if (button.closest('.result-modal')) {
            return 'result_case_modal';
        }

        return 'unknown';
    }

    function openCalendlyPopup() {
        if (window.Calendly && typeof window.Calendly.initPopupWidget === 'function') {
            window.Calendly.initPopupWidget({ url: CALENDLY_URL });
            return;
        }

        window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
    }

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

    // --- RESULTS SHOW MORE ---
    const resultsGrid = document.querySelector('[data-results-grid]');
    const resultsMoreButton = document.querySelector('[data-results-more]');

    if (resultsGrid && resultsMoreButton) {
        resultsMoreButton.addEventListener('click', () => {
            resultsGrid.querySelectorAll('[data-extra-result]').forEach((card) => {
                card.classList.remove('is-hidden');
            });

            resultsGrid.classList.add('is-expanded');
            resultsMoreButton.hidden = true;
        });
    }

    const resultModal = document.getElementById('resultCaseModal');
    const caseButtons = document.querySelectorAll('[data-case-modal]');

    if (resultModal && caseButtons.length) {
        const modalImage = resultModal.querySelector('[data-case-modal-image]');
        const modalTitle = resultModal.querySelector('[data-case-modal-title]');
        const modalBody = resultModal.querySelector('[data-case-modal-body]');
        const closeButtons = resultModal.querySelectorAll('[data-case-close]');

        const closeResultModal = () => {
            resultModal.hidden = true;
            document.body.classList.remove('result-modal-open');
        };

        caseButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const title = button.dataset.caseTitle || '';
                const image = button.dataset.caseImage || '';
                const body = button.dataset.caseBody || '';

                if (modalImage) {
                    modalImage.src = image;
                    modalImage.alt = title;
                }

                if (modalTitle) modalTitle.textContent = title;
                if (modalBody) modalBody.textContent = body;

                resultModal.hidden = false;
                document.body.classList.add('result-modal-open');
            });
        });

        closeButtons.forEach((button) => {
            button.addEventListener('click', closeResultModal);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !resultModal.hidden) {
                closeResultModal();
            }
        });
    }

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

    // --- PRICE COUNTDOWN ---
    document.querySelectorAll('[data-countdown-deadline]').forEach((countdown) => {
        const deadline = new Date(countdown.dataset.countdownDeadline).getTime();
        const daysEl = countdown.querySelector('[data-countdown-days]');
        const hoursEl = countdown.querySelector('[data-countdown-hours]');
        const minutesEl = countdown.querySelector('[data-countdown-minutes]');
        const secondsEl = countdown.querySelector('[data-countdown-seconds]');

        if (!deadline || !daysEl || !hoursEl || !minutesEl || !secondsEl) return;

        const pad = (value) => String(value).padStart(2, '0');

        const updateCountdown = () => {
            const remaining = deadline - Date.now();

            if (remaining <= 0) {
                countdown.hidden = true;
                window.clearInterval(intervalId);
                return;
            }

            const totalSeconds = Math.floor(remaining / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            daysEl.textContent = pad(days);
            hoursEl.textContent = pad(hours);
            minutesEl.textContent = pad(minutes);
            secondsEl.textContent = pad(seconds);
        };

        let intervalId = null;
        updateCountdown();
        intervalId = window.setInterval(updateCountdown, 1000);
    });

    // --- VIDEO/IFRAME EVENT FOR DELAYED CTA ---
    const heroVideo = document.getElementById('hero-video');
    const videoOverlay = document.getElementById('video-cta-overlay');

    if (heroVideo) {
        if (heroVideo.tagName === 'VIDEO') {
            heroVideo.addEventListener('play', () => {
                setTimeout(() => {
                    if (videoOverlay) {
                        videoOverlay.classList.add('visible');
                    }
                }, 3000);
            }, { once: true });
        } else if (window.Vimeo) {
            const vimeoPlayer = new window.Vimeo.Player(heroVideo);
            let fullscreenTestTriggered = false;

            vimeoPlayer.on('play', () => {
                if (fullscreenTestTriggered) {
                    return;
                }

                fullscreenTestTriggered = true;

                setTimeout(async () => {
                    if (videoOverlay) {
                        videoOverlay.classList.add('visible');
                    }

                    try {
                        await vimeoPlayer.requestFullscreen();
                        console.log('Fullscreen activado automaticamente tras 3 segundos.');
                    } catch (error) {
                        console.warn('El navegador bloqueo el fullscreen automatico tras 3 segundos.', error);
                    }
                }, 3000);
            });
        } else {
            // Fallback si la API de Vimeo no carga
            setTimeout(() => {
                if (videoOverlay) {
                    videoOverlay.classList.add('visible');
                }
            }, 2500);
        }
    }

    // --- CALENDLY CTA LINKS ---
    const scheduleButtons = document.querySelectorAll('[data-calendly-link]');

    if (!scheduleButtons.length) {
        console.log('GTM debug: no se encontraron botones [data-calendly-link]');
    }

    scheduleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            // Envia el evento a GTM antes de abrir Calendly para no perder el clic.
            window.dataLayer.push({
                event: 'schedule_click',
                button_text: button.textContent.trim(),
                button_location: getCalendlyButtonLocation(button),
                calendly_url: CALENDLY_URL
            });

            console.log('GTM debug: schedule_click enviado');

            openCalendlyPopup();
        });
    });
});
