/* clyvara-analytics.js: shared GA4 events and lead-source capture.
   Rules: no personal data to GA4; every gtag call guarded. */
(function () {
  function track(name, params) {
    if (typeof gtag === 'function') gtag('event', name, params || {});
  }
  window.clyvaraTrack = track;

  /* 1. Where a link sits on the page */
  function ctaLocation(a) {
    if (a.getAttribute('data-cta')) return a.getAttribute('data-cta');
    if (a.closest('nav, #site-nav')) return 'nav';
    if (a.closest('footer')) return 'footer';
    var sec = a.closest('section[id]');
    return sec ? sec.id : 'body';
  }

  /* 2. Click tracking: Book, email, social, self-check next step */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.href || '';
    if (a.id === 'next-step-link') {
      track('selfcheck_next_step_click', {
        route_label: (a.textContent || '').trim().slice(0, 60),
        route_path: a.pathname || ''
      });
    }
    if (href.indexOf('cal.com/clyvara') > -1) {
      track('book_call_click', { cta_location: ctaLocation(a) });
    } else if (href.indexOf('mailto:') === 0) {
      track('email_click', { cta_location: ctaLocation(a) });
    } else if (/linkedin\.com/.test(href)) {
      track('social_click', { platform: 'linkedin', cta_location: ctaLocation(a) });
    } else if (/medium\.com/.test(href)) {
      track('social_click', { platform: 'medium', cta_location: ctaLocation(a) });
    }
  }, true);

  /* 3. Self-check start: first answer selected, once per page load */
  var sc = document.getElementById('self-check-form');
  if (sc) {
    var started = false;
    sc.addEventListener('change', function () {
      if (started) return;
      started = true;
      track('selfcheck_start');
    });
  }

  /* 4. Lead-source capture (first page of the visit) */
  var KEY = 'clyvara_src';
  function readSource() {
    try {
      var saved = sessionStorage.getItem(KEY);
      if (saved) return JSON.parse(saved);
      var p = new URLSearchParams(location.search);
      var ref = '';
      try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
      if (ref === location.hostname) ref = '';
      var src = {
        landing: location.pathname,
        source: p.get('utm_source') || '',
        medium: p.get('utm_medium') || '',
        campaign: p.get('utm_campaign') || '',
        referrer: ref
      };
      sessionStorage.setItem(KEY, JSON.stringify(src));
      return src;
    } catch (e) {
      return { landing: location.pathname, source: '', medium: '', campaign: '', referrer: '' };
    }
  }
  var src = readSource();

  function addHidden(form, name, value) {
    if (form.querySelector('input[name="' + name + '"]')) return;
    var i = document.createElement('input');
    i.type = 'hidden';
    i.name = name;
    i.value = value || '(none)';
    form.appendChild(i);
  }
  var forms = document.querySelectorAll('form[action*="formspree.io"], form#contactForm');
  for (var f = 0; f < forms.length; f++) {
    addHidden(forms[f], 'Landing page', src.landing);
    addHidden(forms[f], 'UTM source', src.source);
    addHidden(forms[f], 'UTM medium', src.medium);
    addHidden(forms[f], 'UTM campaign', src.campaign);
    addHidden(forms[f], 'Referrer domain', src.referrer);
  }
})();
