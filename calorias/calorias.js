(function () {
    const STORAGE_KEY = 'nutritp_calories_result';
    const CALENDLY_URL = 'https://calendly.com/d/ct9m-g6s-8xk/llamada-de-valoracion-nutritp?hide_event_type_details=1&hide_gdpr_banner=1';
    const LEAD_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwxLtJhEWJt6Nv3uIe4d9A7USUJudM58m3hKnSydDdYGYHS7M9YzEIxMbZ-NYk9BNhp/exec';

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

    async function saveLead(result) {
        if (!LEAD_WEBHOOK_URL) {
            console.warn('Nutri TP: falta configurar LEAD_WEBHOOK_URL para guardar leads.');
            return {
                skipped: true
            };
        }

        if (LEAD_WEBHOOK_URL.includes('script.google.com')) {
            await fetch(LEAD_WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify({
                    id: result.email,
                    source: 'calories_calculator',
                    ...result
                })
            });

            return {
                ok: true,
                opaque: true
            };
        }

        const response = await fetch(LEAD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: result.email,
                source: 'calories_calculator',
                ...result
            })
        });

        if (!response.ok) {
            throw new Error('No se pudo guardar el lead.');
        }

        return response.json().catch(() => ({
            ok: true
        }));
    }

    function openCalendlyPopup() {
        if (window.Calendly && typeof window.Calendly.initPopupWidget === 'function') {
            window.Calendly.initPopupWidget({ url: CALENDLY_URL });
            return;
        }

        window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
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
            submitButton.textContent = 'Calculando...';

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

            try {
                await saveLead(result);
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));

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

        document.querySelectorAll('[data-calendly-link]').forEach((button) => {
            button.addEventListener('click', () => {
                window.dataLayer.push({
                    event: 'schedule_click',
                    button_location: 'calories_result',
                    calendly_url: CALENDLY_URL
                });

                openCalendlyPopup();
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initForm();
        initResult();
    });
})();
