/* global.js – Shared functionality for all pages */

// ── Navbar scroll effect ─────────────────────────────
const navbar = document.getElementById('navbar');
const onScroll = () => {
  if (window.scrollY > 20) navbar?.classList.add('scrolled');
  else navbar?.classList.remove('scrolled');
};
window.addEventListener('scroll', onScroll, { passive: true });

// ── Mobile menu toggle ───────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
hamburger?.addEventListener('click', () => {
  mobileMenu?.classList.toggle('open');
  const spans = hamburger.querySelectorAll('span');
  hamburger.classList.toggle('active');
  const expanded = hamburger.classList.contains('active');
  hamburger.setAttribute('aria-expanded', String(expanded));
  hamburger.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  if (hamburger.classList.contains('active')) {
    spans[0].style.transform = 'rotate(45deg) translate(5px,5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

// Close menu when clicking a link
document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu?.classList.remove('open');
    hamburger?.classList.remove('active');
    hamburger?.setAttribute('aria-expanded', 'false');
    hamburger?.setAttribute('aria-label', 'Open navigation');
    if (hamburger) {
      hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
});

// ── Active nav link ──────────────────────────────────
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === 'index.html' && href === '/') || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// ── Intersection Observer for reveal animations ──────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

// Observe reveal elements without synchronous geometry reads.
// IntersectionObserver also handles elements initially in the viewport.
function initReveal() {
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    if (!el.classList.contains('visible')) revealObserver.observe(el);
  });
}

initReveal();
setTimeout(initReveal, 100);

// ── Animated number counters ─────────────────────────
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
  const duration = 2000;
  const start = performance.now();

  const tick = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = (target * eased).toFixed(decimals);
    el.textContent = prefix + value + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

// ── Smooth scroll for anchor links ───────────────────
// Keep native focus and fragment navigation for skip links and article contents.
document.querySelectorAll('a[href^="#"]:not(.sd-skip-link):not([data-native-anchor])').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Stagger children in grid ─────────────────────────
document.querySelectorAll('.stagger-children').forEach(parent => {
  const children = parent.children;
  Array.from(children).forEach((child, i) => {
    child.style.transitionDelay = `${i * 0.08}s`;
    child.classList.add('reveal');
    revealObserver.observe(child);
  });
});


// Lead-intent instrumentation: no cookies, external tag, PII or network calls.
// Sends only to an existing consent-aware GA4 gtag or GTM container.
(function setupLeadAnalytics() {
  function trackLeadEvent(eventName, attributes) {
    // Only collect events after affirmative analytics consent.
    if (window.iscalifyAnalyticsAllowed !== true) return;
    const safeData = Object.assign({ page_path: window.location.pathname }, attributes || {});
    // Analytics failures must never interrupt navigation or resubmit a lead form.
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, safeData);
      } else if (window.google_tag_manager && Array.isArray(window.dataLayer)) {
        window.dataLayer.push(Object.assign({ event: 'iscalify_' + eventName }, safeData));
      }
    } catch (error) {
      // Tracking is best-effort and must not affect user-facing functionality.
    }
  }

  window.iscalifyTrackLeadEvent = trackLeadEvent;

  // Clicks indicate intent; they are not confirmed calls, messages or bookings.
  document.addEventListener('click', function (event) {
    const link = event.target && typeof event.target.closest === 'function'
      ? event.target.closest('a[href]') : null;
    if (!link) return;

    let url;
    try {
      url = new URL(link.getAttribute('href'), window.location.href);
    } catch (error) {
      return;
    }

    const host = url.hostname.toLowerCase();
    if (url.protocol === 'tel:') {
      trackLeadEvent('contact_phone_click', { contact_method: 'phone' });
    } else if (url.protocol === 'mailto:') {
      trackLeadEvent('contact_email_click', { contact_method: 'email' });
    } else if (host === 'wa.me' || host === 'whatsapp.com' || host.endsWith('.whatsapp.com')) {
      trackLeadEvent('contact_whatsapp_click', { contact_method: 'whatsapp' });
    } else if (host === 'calendly.com' || host === 'www.calendly.com') {
      trackLeadEvent('appointment_link_click', { booking_platform: 'calendly' });
    }
  }, { passive: true });
})();


// ── Iscalify GA4, basic consent mode (opt-in) ─────────
// The Google tag is never fetched before the visitor accepts analytics.
// This ID is supplied by Iscalify, not a placeholder or GTM container ID.
(function setupConsentAwareGA4() {
  if (window.__iscalifyConsentManagerInitialized) return;
  window.__iscalifyConsentManagerInitialized = true;

  const measurementId = 'G-W53H59HNGS';
  const consentKey = 'iscalify_analytics_consent_v1';
  const denied = {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  };
  window.iscalifyAnalyticsAllowed = false;

  function storedChoice() {
    try { return window.localStorage.getItem(consentKey); }
    catch (error) { return null; }
  }

  function saveChoice(choice) {
    try {
      window.localStorage.setItem(consentKey, choice);
      return true;
    } catch (error) {
      // Still honor the choice for this page if storage is unavailable.
      return false;
    }
  }

  function enableAnalytics() {
    if (window.__iscalifyGoogleTagInstalled) return;
    window.__iscalifyGoogleTagInstalled = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

    // Consent Mode v2: Google Ads signals remain off even when analytics is on.
    window.gtag('consent', 'default', denied);
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: true });
    window.iscalifyAnalyticsAllowed = true;

    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(measurementId);
    tag.dataset.iscalifyGa4 = measurementId;
    document.head.appendChild(tag);
  }

  function clearAnalyticsCookies() {
    // Clear this site's GA cookies when consent is withdrawn.
    document.cookie.split(';').forEach(function (cookie) {
      const name = cookie.split('=')[0].trim();
      if (name === '_ga' || name.startsWith('_ga_')) {
        document.cookie = name + '=; Max-Age=0; path=/';
        document.cookie = name + '=; Max-Age=0; path=/; domain=iscalify.com';
      }
    });
  }

  function chooseAnalytics(choice) {
    const choiceSaved = saveChoice(choice);
    const banner = document.getElementById('iscalify-consent-banner');
    if (banner) banner.remove();

    if (choice === 'granted') {
      enableAnalytics();
    } else {
      window.iscalifyAnalyticsAllowed = false;
      if (typeof window.gtag === 'function' && window.__iscalifyGoogleTagInstalled) {
        window.gtag('consent', 'update', denied);
      }
      clearAnalyticsCookies();
      if (window.__iscalifyGoogleTagInstalled && choiceSaved) {
        // Stop the already-loaded tag rather than collecting anonymous pings.
        window.location.reload();
      }
    }
  }

  function consentButton(text, variant, choice) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'iscalify-consent-button' + (variant ? ' iscalify-consent-button--secondary' : '');
    button.textContent = text;
    button.addEventListener('click', function () { chooseAnalytics(choice); });
    return button;
  }

  function openConsentBanner() {
    const existing = document.getElementById('iscalify-consent-banner');
    if (existing) {
      existing.hidden = false;
      existing.querySelector('button')?.focus();
      return;
    }

    const banner = document.createElement('section');
    banner.id = 'iscalify-consent-banner';
    banner.className = 'iscalify-consent-banner';
    banner.setAttribute('aria-label', 'Optional analytics preferences');

    const title = document.createElement('strong');
    title.className = 'iscalify-consent-title';
    title.textContent = 'Analytics preferences';

    const copy = document.createElement('p');
    copy.className = 'iscalify-consent-description';
    copy.textContent = 'We use optional Google Analytics to understand website visits and contact actions. Analytics loads only if you accept. You can change this choice in the footer.';

    const actions = document.createElement('div');
    actions.className = 'iscalify-consent-actions';
    actions.appendChild(consentButton('Decline', true, 'denied'));
    actions.appendChild(consentButton('Accept analytics', false, 'granted'));

    banner.appendChild(title);
    banner.appendChild(copy);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  }

  const footer = document.querySelector('footer .footer-bottom') || document.querySelector('footer');
  if (footer) {
    const settings = document.createElement('button');
    settings.type = 'button';
    settings.className = 'iscalify-consent-settings';
    settings.textContent = 'Analytics preferences';
    settings.addEventListener('click', openConsentBanner);
    footer.appendChild(settings);
  }

  const choice = storedChoice();
  if (choice === 'granted') {
    enableAnalytics();
  } else if (choice !== 'denied') {
    openConsentBanner();
  }
})();
