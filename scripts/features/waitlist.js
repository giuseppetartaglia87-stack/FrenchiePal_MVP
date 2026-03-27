window.FrenchiePal = window.FrenchiePal || {};

window.FrenchiePal.createWaitlistController = function createWaitlistController({ trackEvent, sessionId }) {
    async function submitLeadForm() {
        trackEvent('form_cta_click', { location: 'waitlist_form' });

        const email = document.getElementById('email-input')?.value || '';
        const dogAge = document.getElementById('dog-age-input')?.value || '';
        const priority = document.getElementById('priority-input')?.value || '';
        const success = document.getElementById('form-success');

        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    dog_age: dogAge,
                    priority,
                    session_id: sessionId
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Errore nel salvataggio');
                return;
            }

            success.classList.remove('hidden');
            success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            document.getElementById('email-input').value = '';
            document.getElementById('dog-age-input').value = '';
            document.getElementById('priority-input').value = '';
        } catch (e) {
            alert('Errore di rete');
        }
    }

    return {
        submitLeadForm
    };
};
