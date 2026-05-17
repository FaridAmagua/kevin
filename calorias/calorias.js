(function () {
    const STORAGE_KEY = 'nutritp_calories_result';
    const WHATSAPP_URL = 'https://wa.me/34691228316?text=Hola%2C%20acabo%20de%20calcular%20mis%20calor%C3%ADas%20en%20Nutri%20TP%20y%20quiero%20informaci%C3%B3n%20sobre%20la%20asesor%C3%ADa.';
    const LEAD_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbx_gSne0mmUwH4IvN2t9FObZLHOGTZAUS19s4JzWQCbgM3kN-vbjtwgFrA6HcldOKx_/exec';

    window.dataLayer = window.dataLayer || [];

    const formatter = new Intl.NumberFormat('es-ES', {
        maximumFractionDigits: 0
    });

    function roundCalories(value) {
        return Math.max(0, Math.round(value));
    }

    function calculateCalories(data) {
        const sexConstant = data.gender === 'male' ? 5 : -161;
        const bmr = (10 * data.weight) + (6.25 * data.height) - (5 * data.age) + sexConstant;
        const maintenance = roundCalories(bmr * data.activity);

        return {
            maintenance,
            loss: roundCalories(maintenance - 500),
            gain: roundCalories(maintenance + 500)
        };
    }

    function getFirstName(name) {
        return String(name || 'tu').trim().split(/\s+/)[0] || 'tu';
    }

    function normalizeEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    function createLeadPayload(result) {
        return JSON.stringify({
            id: result.email,
            source: 'calories_calculator',
            ...result
        });
    }

    function wait(ms) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, ms);
        });
    }

    async function saveLead(result) {
        if (!LEAD_WEBHOOK_URL) {
            console.warn('Nutri TP: falta configurar LEAD_WEBHOOK_URL para guardar leads.');
            return {
                skipped: true
            };
        }

        if (LEAD_WEBHOOK_URL.includes('script.google.com')) {
            if (navigator.sendBeacon) {
                const queued = navigator.sendBeacon(
                    LEAD_WEBHOOK_URL,
                    new Blob([createLeadPayload(result)], {
                        type: 'text/plain;charset=utf-8'
                    })
                );

                if (queued) {
                    return wait(900).then(() => ({
                        ok: true,
                        beacon: true
                    }));
                }
            }

            const request = fetch(LEAD_WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                keepalive: true,
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: createLeadPayload(result)
            }).catch((error) => {
                console.warn('Nutri TP: Apps Script tardo o no confirmo el guardado.', error);
                return {
                    delayed: true
                };
            });

            return Promise.race([
                request.then(() => ({
                    ok: true,
                    opaque: true
                })),
                wait(3500).then(() => ({
                    ok: true,
                    timeout: true
                }))
            ]);
        }

        const response = await fetch(LEAD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: createLeadPayload(result)
        });

        if (!response.ok) {
            throw new Error('No se pudo guardar el lead.');
        }

        return response.json().catch(() => ({
            ok: true
        }));
    }

    function initForm() {
        const form = document.querySelector('#calories-form');
        if (!form) return;

        const error = document.querySelector('#form-error');

        window.dataLayer.push({
            event: 'calories_calculator_view'
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!form.checkValidity()) {
                error.textContent = 'Completa todos los campos para calcular tus calorias.';
                form.reportValidity();
                return;
            }

            const submitButton = form.querySelector('[type="submit"]');
            const defaultButtonText = submitButton.textContent;

            error.textContent = '';
            submitButton.disabled = true;
            submitButton.textContent = 'Guardando...';

            const formData = new FormData(form);
            const payload = {
                age: Number(formData.get('age')),
                gender: String(formData.get('gender')),
                height: Number(formData.get('height')),
                weight: Number(formData.get('weight')),
                activity: Number(formData.get('activity')),
                name: String(formData.get('name') || '').trim(),
                email: normalizeEmail(formData.get('email'))
            };

            const result = {
                ...payload,
                ...calculateCalories(payload),
                createdAt: new Date().toISOString()
            };

            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));

            try {
                await saveLead(result);

                window.dataLayer.push({
                    event: 'calories_calculator_submit',
                    activity_factor: payload.activity,
                    gender: payload.gender,
                    maintenance_calories: result.maintenance
                });

                if (window.fbq) {
                    window.fbq('track', 'Lead');
                }

                window.location.href = './resultado.html';
            } catch (saveError) {
                console.error(saveError);
                error.textContent = 'No hemos podido guardar tus datos. Intentalo de nuevo en unos segundos.';
                submitButton.disabled = false;
                submitButton.textContent = defaultButtonText;
            }
        });
    }

    function initResult() {
        const resultName = document.querySelector('[data-result-name]');
        if (!resultName) return;

        const rawResult = sessionStorage.getItem(STORAGE_KEY);
        if (!rawResult) {
            window.location.replace('./');
            return;
        }

        let result;

        try {
            result = JSON.parse(rawResult);
        } catch (error) {
            window.location.replace('./');
            return;
        }

        resultName.textContent = getFirstName(result.name);
        document.querySelector('[data-maintenance]').textContent = formatter.format(result.maintenance);
        document.querySelector('[data-loss]').textContent = formatter.format(result.loss);
        document.querySelector('[data-gain]').textContent = formatter.format(result.gain);

        window.dataLayer.push({
            event: 'calories_result_view',
            maintenance_calories: result.maintenance,
            loss_calories: result.loss,
            gain_calories: result.gain
        });

        saveLead(result).catch((error) => {
            console.warn('Nutri TP: no se pudo reintentar el guardado desde resultados.', error);
        });

        document.querySelectorAll('[data-whatsapp-link]').forEach((link) => {
            link.addEventListener('click', () => {
                window.dataLayer.push({
                    event: 'whatsapp_click',
                    button_location: 'calories_result',
                    whatsapp_url: WHATSAPP_URL
                });
            });
        });
    }

    function initPrivacyModal() {
        const modal = document.querySelector('#privacy-modal');
        const openButton = document.querySelector('[data-privacy-open]');
        const closeButtons = document.querySelectorAll('[data-privacy-close]');

        if (!modal || !openButton) return;

        openButton.addEventListener('click', () => {
            if (typeof modal.showModal === 'function') {
                modal.showModal();
                return;
            }

            modal.setAttribute('open', '');
        });

        closeButtons.forEach((button) => {
            button.addEventListener('click', () => {
                modal.close();
            });
        });

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.close();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initForm();
        initResult();
        initPrivacyModal();
    });
})();
