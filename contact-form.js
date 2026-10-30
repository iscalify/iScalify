/* A successful HTTP request does not necessarily mean the provider accepted a lead. */
(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const success = document.getElementById('form-success');
  const error = document.getElementById('form-error');
  let sending = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    sending = true;
    error.hidden = true;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(form.dataset.endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || (result?.success !== true && result?.success !== 'true')) {
        throw new Error('Submission was not confirmed');
      }
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      // Keep entered details; never automatically repeat an uncertain POST.
      error.textContent = "We couldn't confirm your message was sent. Please try again, or contact us using the email, WhatsApp or Calendly links on this page.";
      error.hidden = false;
      error.focus();
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      button.textContent = originalText;
      form.removeAttribute('aria-busy');
    }
  });
})();
