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
