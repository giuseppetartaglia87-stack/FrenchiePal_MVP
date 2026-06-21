window.FrenchiePal = window.FrenchiePal || {};

window.FrenchiePal.createWaitlistController = function createWaitlistController({
    sessionContext,
    trackEvent
}) {
    let waitlistStartedTracked = false;

    function trackWaitlistStart(source = 'form_focus') {
        if (waitlistStartedTracked) return;
        waitlistStartedTracked = true;

        trackEvent('waitlist_form_start', {
            sourceSection: 'waitlist',
            metadata: {
                source
            }
        });
    }

    async function submitLeadForm() {
        const email = document.getElementById('email-input')?.value || '';
        const dogAge = document.getElementById('dog-age-input')?.value || '';
        const priority = document.getElementById('priority-input')?.value || '';
        const success = document.getElementById('form-success');

        trackEvent('waitlist_submit', {
            sourceSection: 'waitlist',
            metadata: {
                dog_age: dogAge,
                priority
            }
        });

        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    dog_age: dogAge,
                    priority,
                    session_id: sessionContext.session_id,
                    device_type: window.FrenchiePal.getDeviceType(),
                    landing_version: sessionContext.landing_version,
                    started_at: sessionContext.started_at
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Errore nel salvataggio');
                return;
            }

            trackEvent('lead_captured', {
                sourceSection: 'waitlist',
                metadata: {
                    lead_source: 'form',
                    dog_age: dogAge,
                    priority
                }
            });

            window.FrenchiePal.markSessionLeadCaptured();
            success.classList.remove('hidden');
            success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            document.getElementById('email-input').value = '';
            document.getElementById('dog-age-input').value = '';
            document.getElementById('priority-input').value = '';
        } catch (e) {
            alert('Errore di rete');
        }
    }

    function init() {
        ['email-input', 'dog-age-input', 'priority-input'].forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;

            el.addEventListener('focus', () => trackWaitlistStart('focus'), { once: true });
            el.addEventListener('change', () => trackWaitlistStart('change'), { once: true });
        });
    }

    return {
        submitLeadForm,
        init
    };
};