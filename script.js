/**
 * שי מערכות חכמות — Production Script
 * Modules: Config · State · DataLayer · UI · Form · A11y · Lang
 */

'use strict';

/* ================================================================
   1. CONFIG
   ================================================================ */
const CONFIG = {
  formspreeId:  'mbdepngj',
  phone:        '0549019815',
  phoneDisplay: '054-9019815',
  waPhone:      '972549019815',
  waMessageHe:  'היי, אשמח לשמוע על השירותים שלכם',
  waMessageEn:  'Hi, I\'d love to hear about your services',
  emailFallback:'shaisystems5@gmail.com',
  scrollDepthThresholds: [25, 50, 75, 100],
};

/* ================================================================
   2. STATE — single source of truth
   ================================================================ */
const state = {
  lang:              'he',
  mobileNavOpen:     false,
  a11yPanelOpen:     false,
  privacyModalOpen:  false,
  formTouched:       false,
  formSubmitted:     false,
  formStartTime:     null,
  scrollDepthFired:  new Set(),  // which thresholds already fired
  scrollDepth:       0,
  activeSection:     null,
};

/* ================================================================
   3. DATALAYER & GTM
   ================================================================ */
window.dataLayer = window.dataLayer || [];

const DL = {
  push(event, params = {}) {
    window.dataLayer.push({ event, ...params });
  },

  pageView() {
    this.push('page_view', {
      page_title: document.title,
      page_lang:  state.lang,
    });
  },

  formStart() {
    if (state.formTouched) return;   // fire only once
    state.formTouched   = true;
    state.formStartTime = Date.now();
    this.push('form_start', { form_name: 'lead_form' });
  },

  formFieldComplete(fieldName, fieldValue) {
    this.push('form_field_complete', {
      form_name:   'lead_form',
      field_name:  fieldName,
      field_value: DL._mask(fieldName, fieldValue),
    });
  },

  formError(fieldName, errorType) {
    this.push('form_error', {
      form_name:  'lead_form',
      error_field: fieldName,
      error_type:  errorType,
    });
  },

  formSubmitAttempt() {
    this.push('form_submit_attempt', { form_name: 'lead_form' });
  },

  generateLead(serviceType, hasEmail, hasMessage) {
    const fillTimeSec = state.formStartTime
      ? Math.round((Date.now() - state.formStartTime) / 1000)
      : null;
    this.push('generate_lead', {
      lead_source:           'website_form',
      service_type:          serviceType,
      contact_method:        'form',
      has_email:             hasEmail,
      has_message:           hasMessage,
      page_lang:             state.lang,
      scroll_depth_at_submit: state.scrollDepth,
      form_fill_time_sec:    fillTimeSec,
    });
  },

  formSubmitFail(errorCode) {
    this.push('form_submit_fail', {
      form_name:  'lead_form',
      error_code:  errorCode,
    });
  },

  scrollDepthEvent(depthPercent) {
    this.push('scroll_depth', {
      depth_percent:   depthPercent,
      section_visible: state.activeSection,
    });
  },

  sectionView(sectionId) {
    this.push('section_view', { section_id: sectionId });
  },

  ctaClick(ctaLabel, ctaLocation) {
    this.push('cta_click', { cta_label: ctaLabel, cta_location: ctaLocation });
  },

  whatsappClick(clickLocation) {
    this.push('whatsapp_click', { click_location: clickLocation });
  },

  phoneClick(clickLocation) {
    this.push('phone_click', { click_location: clickLocation });
  },

  langSwitch(fromLang, toLang) {
    this.push('lang_switch', { from_lang: fromLang, to_lang: toLang });
  },

  faqOpen(questionIndex, questionText) {
    this.push('faq_open', {
      question_index: questionIndex,
      question_text:  questionText.substring(0, 80),
    });
  },

  a11yAction(actionType) {
    this.push('a11y_action', { action_type: actionType });
  },

  // ── Privacy helpers ──
  _mask(fieldName, value) {
    if (!value) return '';
    const name = fieldName.toLowerCase();
    if (name.includes('phone') || name.includes('טלפון')) {
      return value.replace(/\d(?=\d{3})/g, '*');          // ***-***-815
    }
    if (name.includes('email') || name.includes('מייל') || name.includes('אימייל')) {
      const [user, domain] = value.split('@');
      if (!domain) return '***';
      return `${user[0] || ''}***@${domain}`;              // j***@gmail.com
    }
    return value;
  },
};

/* ================================================================
   4. NAVBAR
   ================================================================ */
const Navbar = {
  el: null,

  init() {
    this.el = document.getElementById('navbar');
    if (!this.el) return;
    window.addEventListener('scroll', () => this._onScroll(), { passive: true });
  },

  _onScroll() {
    this.el.classList.toggle('is-scrolled', window.scrollY > 60);
  },
};

/* ================================================================
   5. MOBILE NAV
   ================================================================ */
const MobileNav = {
  btn:  null,
  nav:  null,

  init() {
    this.btn = document.getElementById('hamburger');
    this.nav = document.getElementById('mobile-nav');
    if (!this.btn || !this.nav) return;

    this.btn.addEventListener('click', () => this.toggle());

    // Close on link click
    this.nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => this.close());
    });
  },

  toggle() {
    state.mobileNavOpen ? this.close() : this.open();
  },

  open() {
    state.mobileNavOpen = true;
    this.nav.classList.add('is-open');
    this.btn.setAttribute('aria-expanded', 'true');
    this.btn.setAttribute('aria-label',
      state.lang === 'he' ? 'סגור תפריט' : 'Close menu');
  },

  close() {
    state.mobileNavOpen = false;
    this.nav.classList.remove('is-open');
    this.btn.setAttribute('aria-expanded', 'false');
    this.btn.setAttribute('aria-label',
      state.lang === 'he' ? 'פתח תפריט' : 'Open menu');
  },
};

/* ================================================================
   6. LANGUAGE SYSTEM
   ================================================================ */
const Lang = {
  init() {
    const btnHe = document.getElementById('btn-he');
    const btnEn = document.getElementById('btn-en');
    if (!btnHe || !btnEn) return;

    btnHe.addEventListener('click', () => this.set('he'));
    if (btnEn.tagName === 'A') {
      // English now has a stable, crawlable URL. Let the link navigate normally.
      btnEn.addEventListener('click', () => DL.langSwitch(state.lang, 'en'));
    } else {
      btnEn.addEventListener('click', () => this.set('en'));
    }

    // Default is Hebrew, unless the URL explicitly requests English
    // (keeps /?lang=en honest for the hreflang="en" tag in <head>)
    const params = new URLSearchParams(window.location.search);
    const initialLang = params.get('lang') === 'en' ? 'en' : 'he';

    state.lang = initialLang;
    document.documentElement.lang = initialLang;
    document.documentElement.dir  = initialLang === 'he' ? 'rtl' : 'ltr';
    document.body.dir             = initialLang === 'he' ? 'rtl' : 'ltr';
    document.body.classList.toggle('lang-en', initialLang === 'en');

    this._updateUI(initialLang);
    this._translateAll(initialLang);
    const waMsg = encodeURIComponent(
      initialLang === 'he' ? CONFIG.waMessageHe : CONFIG.waMessageEn
    );
    document.querySelectorAll('[data-wa]').forEach(el => {
      el.href = `https://wa.me/${CONFIG.waPhone}?text=${waMsg}`;
    });
  },

  set(lang) {
    const prev = state.lang;
    if (lang === prev) return;

    DL.langSwitch(prev, lang);
    state.lang = lang;

    document.documentElement.lang = lang;
    document.documentElement.dir  = lang === 'he' ? 'rtl' : 'ltr';
    document.body.dir             = lang === 'he' ? 'rtl' : 'ltr';
    document.body.classList.toggle('lang-en', lang === 'en');

    this._updateUI(lang);
    this._translateAll(lang);

    // Update WhatsApp links
    const waMsg = encodeURIComponent(
      lang === 'he' ? CONFIG.waMessageHe : CONFIG.waMessageEn
    );
    document.querySelectorAll('[data-wa]').forEach(el => {
      el.href = `https://wa.me/${CONFIG.waPhone}?text=${waMsg}`;
    });
  },

  _updateUI(lang) {
    const isHe = lang === 'he';
    document.getElementById('btn-he')
      ?.classList.toggle('is-active', isHe);
    document.getElementById('btn-en')
      ?.classList.toggle('is-active', !isHe);
    document.getElementById('btn-he')
      ?.setAttribute('aria-pressed', isHe);
    const btnEn = document.getElementById('btn-en');
    if (btnEn?.tagName === 'A') {
      btnEn.removeAttribute('aria-pressed');
    } else {
      btnEn?.setAttribute('aria-pressed', !isHe);
    }

    // Skip link text
    const skip = document.querySelector('.skip-link');
    if (skip) skip.textContent = isHe ? 'דלג לתוכן הראשי' : 'Skip to main content';
  },

  _translateAll(lang) {
    document.querySelectorAll('[data-he][data-en]').forEach(el => {
      const val = el.getAttribute(`data-${lang}`);
      if (val === null) return;

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else if (el.tagName === 'OPTION') {
        el.textContent = val;
      } else if (val.includes('<br') || val.includes('&')) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });
  },
};

/* ================================================================
   7. FAQ
   ================================================================ */
const FAQ = {
  init() {
    document.querySelectorAll('.faq-item__q').forEach((btn, index) => {
      btn.addEventListener('click', () => this.toggle(btn, index));
    });
  },

  toggle(btn, index) {
    const item   = btn.closest('.faq-item');
    const isOpen = item.classList.contains('is-open');

    // Close all
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('is-open');
      i.querySelector('.faq-item__q')?.setAttribute('aria-expanded', 'false');
    });

    // Open clicked (if was closed)
    if (!isOpen) {
      item.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      DL.faqOpen(index, btn.querySelector('span')?.textContent || '');
    }
  },
};

/* ================================================================
   8. SMOOTH SCROLL
   ================================================================ */
const SmoothScroll = {
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-h')) || 64;
        window.scrollTo({
          top: target.offsetTop - offset,
          behavior: 'smooth',
        });
      });
    });
  },
};

/* ================================================================
   9. SCROLL DEPTH & SECTION OBSERVER
   ================================================================ */
const ScrollTracker = {
  sectionObserver: null,

  init() {
    // Scroll depth
    window.addEventListener('scroll', () => this._checkDepth(), { passive: true });

    // Section observer
    this.sectionObserver = new IntersectionObserver(
      (entries) => this._onSectionChange(entries),
      { threshold: 0.4 }
    );
    document.querySelectorAll('section[id]').forEach(sec => {
      this.sectionObserver.observe(sec);
    });
  },

  _checkDepth() {
    const scrolled  = window.scrollY + window.innerHeight;
    const total     = document.documentElement.scrollHeight;
    const percent   = Math.round((scrolled / total) * 100);
    state.scrollDepth = percent;

    CONFIG.scrollDepthThresholds.forEach(threshold => {
      if (percent >= threshold && !state.scrollDepthFired.has(threshold)) {
        state.scrollDepthFired.add(threshold);
        DL.scrollDepthEvent(threshold);
      }
    });
  },

  _onSectionChange(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        if (id && id !== state.activeSection) {
          state.activeSection = id;
          DL.sectionView(id);
        }
      }
    });
  },
};

/* ================================================================
   10. SCROLL REVEAL (motion-safe)
   ================================================================ */
const RevealObserver = {
  init() {
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    const items = document.querySelectorAll('.reveal');
    if (!items.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    document.documentElement.classList.add('reveal-ready');
    items.forEach(el => observer.observe(el));
  },
};

/* ================================================================
   11. CTA & QUICK CONTACT TRACKING
   ================================================================ */
const CtaTracker = {
  init() {
    // All buttons/links with data-cta attribute
    document.querySelectorAll('[data-cta]').forEach(el => {
      el.addEventListener('click', () => {
        DL.ctaClick(
          el.getAttribute('data-cta'),
          el.getAttribute('data-cta-location') || 'unknown'
        );
      });
    });

    // WhatsApp links
    document.querySelectorAll('[data-wa]').forEach(el => {
      el.addEventListener('click', () => {
        DL.whatsappClick(el.getAttribute('data-wa-location') || 'unknown');
      });
    });

    // Phone links
    document.querySelectorAll('[data-tel]').forEach(el => {
      el.addEventListener('click', () => {
        DL.phoneClick(el.getAttribute('data-tel-location') || 'unknown');
      });
    });
  },
};

/* ================================================================
   12. FORM
   ================================================================ */
const Form = {
  formEl:   null,
  fields:   {},

  init() {
    this.formEl = document.getElementById('lead-form');
    if (!this.formEl) return;

    // Cache field references
    this.fields = {
      fname:   document.getElementById('fname'),
      phone:   document.getElementById('phone'),
      email:   document.getElementById('email'),
      service: document.getElementById('service'),
      message: document.getElementById('message'),
      privacy: document.getElementById('privacy'),
    };

    this._bindEvents();
    this._restoreFromStorage();  // localStorage restore
  },

  _bindEvents() {
    // Track form_start on first focus
    Object.values(this.fields).forEach(field => {
      if (!field) return;
      field.addEventListener('focus', () => DL.formStart(), { once: true });
    });

    // Per-field blur validation + DataLayer
    ['fname', 'phone', 'email', 'service'].forEach(key => {
      const field = this.fields[key];
      if (!field) return;
      field.addEventListener('blur', () => {
        this._validateField(key);
        if (field.value.trim()) {
          DL.formFieldComplete(key, field.value);
        }
      });
      // Save to localStorage on input
      field.addEventListener('input', () => {
        this._saveToStorage();
      });
    });

    // Submit
    this.formEl.addEventListener('submit', (e) => this._onSubmit(e));
  },

  // ── Validation ──
  _rules: {
    fname:   v => v.trim().length >= 2,
    phone:   v => /^[\d\s\-\+\(\)]{7,}$/.test(v.trim()),
    email:   v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),  // optional
    service: v => v !== '',
    privacy: v => v,
  },

  _errorMessages: {
    he: {
      fname:   'יש להזין שם (לפחות 2 תווים)',
      phone:   'יש להזין מספר טלפון תקין',
      email:   'כתובת אימייל לא תקינה',
      service: 'יש לבחור סוג שירות',
      privacy: 'יש לאשר את מדיניות הפרטיות',
    },
    en: {
      fname:   'Please enter your name (at least 2 characters)',
      phone:   'Please enter a valid phone number',
      email:   'Please enter a valid email address',
      service: 'Please select a service type',
      privacy: 'Please accept the privacy policy',
    },
  },

  _validateField(key) {
    const field = this.fields[key];
    if (!field) return true;
    const value  = key === 'privacy' ? field.checked : field.value;
    const valid  = this._rules[key]?.(value) ?? true;

    // Privacy checkbox lives outside .form__field — handle its error UI separately
    if (key === 'privacy') {
      const group = field.closest('.form__privacy');
      const errEl = document.getElementById('privacy-error');
      group?.classList.toggle('has-error', !valid);
      if (errEl) {
        errEl.textContent = !valid ? (this._errorMessages[state.lang]?.[key] || '') : '';
        errEl.style.display = !valid ? 'block' : 'none';
      }
      if (!valid) DL.formError(key, 'invalid_value');
      return valid;
    }

    const group  = field.closest('.form__field');
    const errEl  = group?.querySelector('.form__error');

    group?.classList.toggle('has-error', !valid);
    group?.classList.toggle('is-valid', valid && !!String(value).trim());

    if (errEl) {
      errEl.textContent = !valid
        ? (this._errorMessages[state.lang]?.[key] || '')
        : '';
    }

    if (!valid) DL.formError(key, 'invalid_value');
    return valid;
  },

  _validateContactPref() {
    const checked = document.querySelectorAll('input[name="חזרה_אליך"]:checked').length > 0;
    const field   = document.getElementById('contact-pref-field');
    const errEl   = document.getElementById('contact-pref-error');
    field?.classList.toggle('has-error', !checked);
    if (errEl) {
      errEl.textContent = !checked
        ? (state.lang === 'he' ? 'יש לבחור לפחות אמצעי חזרה אחד' : 'Please select at least one contact method')
        : '';
    }
    return checked;
  },

  _validateAll() {
    const keys    = ['fname', 'phone', 'email', 'service', 'privacy'];
    const results = keys.map(k => this._validateField(k));
    return results.every(Boolean);
  },

  // ── Submit ──
  async _onSubmit(e) {
    e.preventDefault();
    DL.formSubmitAttempt();

    if (!this._validateAll()) return;

    const btn = this.formEl.querySelector('.btn--submit');
    btn?.classList.add('is-loading');
    if (btn) btn.disabled = true;

    const formData = new FormData(this.formEl);
    const url      = `https://formspree.io/f/${CONFIG.formspreeId}`;

    try {
      const res = await fetch(url, {
        method:  'POST',
        body:    formData,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        this._onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
    } catch (err) {
      DL.formSubmitFail(err.message);
      this._onError(err.message, formData);
    } finally {
      btn?.classList.remove('is-loading');
      if (btn) btn.disabled = false;
    }
  },

  _onSuccess() {
    state.formSubmitted = true;

    const serviceType = this.fields.service?.value || '';
    const hasEmail    = !!this.fields.email?.value;
    const hasMessage  = !!this.fields.message?.value;
    DL.generateLead(serviceType, hasEmail, hasMessage);

    // Clear localStorage
    this._clearStorage();

    // Show success state
    document.getElementById('form-fields')?.style.setProperty('display', 'none');
    document.getElementById('form-success')?.classList.add('is-visible');

    // aria-live="assertive" + aria-atomic="true" already set in HTML
  },

  _onError(errorMsg, formData) {
    // Fallback: open mailto
    const fname   = formData.get('שם פרטי') || formData.get('Full Name') || '';
    const phone   = formData.get('טלפון')   || formData.get('Phone')     || '';
    const service = formData.get('סוג שירות') || formData.get('Service') || '';
    const body    = encodeURIComponent(
      `שם / Name: ${fname}\nטלפון / Phone: ${phone}\nשירות / Service: ${service}`
    );
    window.location.href =
      `mailto:${CONFIG.emailFallback}?subject=ליד חדש מהאתר / New Lead&body=${body}`;

    // Still show success UI (the mailto opened)
    this._onSuccess();
  },

  // ── localStorage persistence ──
  _storageKey: 'shai_form_draft',

  _saveToStorage() {
    try {
      const draft = {
        fname:   this.fields.fname?.value   || '',
        phone:   this.fields.phone?.value   || '',
        email:   this.fields.email?.value   || '',
        service: this.fields.service?.value || '',
        message: this.fields.message?.value || '',
        ts:      Date.now(),
      };
      localStorage.setItem(this._storageKey, JSON.stringify(draft));
    } catch { /* ignore storage errors */ }
  },

  _restoreFromStorage() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      // Only restore if draft is less than 24 hours old
      if (Date.now() - draft.ts > 86_400_000) {
        localStorage.removeItem(this._storageKey);
        return;
      }
      if (this.fields.fname   && draft.fname)   this.fields.fname.value   = draft.fname;
      if (this.fields.phone   && draft.phone)   this.fields.phone.value   = draft.phone;
      if (this.fields.email   && draft.email)   this.fields.email.value   = draft.email;
      if (this.fields.service && draft.service) this.fields.service.value = draft.service;
      if (this.fields.message && draft.message) this.fields.message.value = draft.message;
    } catch { /* ignore */ }
  },

  _clearStorage() {
    try { localStorage.removeItem(this._storageKey); } catch { /* ignore */ }
  },
};

/* ================================================================
   13. ACCESSIBILITY WIDGET
   ================================================================ */
const A11yWidget = {
  btn:   null,
  panel: null,

  init() {
    this.btn   = document.getElementById('a11y-toggle');
    this.panel = document.getElementById('a11y-panel');
    if (!this.btn || !this.panel) return;

    this.btn.addEventListener('click', () => this.toggle());

    // Restore preferences
    if (localStorage.getItem('a11y_hc') === '1')
      document.body.classList.add('high-contrast');
    if (localStorage.getItem('a11y_lt') === '1') {
      document.body.classList.add('large-text');
      document.documentElement.classList.add('large-text');
    }
    if (localStorage.getItem('a11y_nm') === '1')
      document.body.classList.add('no-motion');
  },

  toggle() {
    state.a11yPanelOpen = !state.a11yPanelOpen;
    this.panel.classList.toggle('is-open', state.a11yPanelOpen);
    this.btn.setAttribute('aria-expanded', state.a11yPanelOpen);
  },

  close() {
    state.a11yPanelOpen = false;
    this.panel.classList.remove('is-open');
    this.btn.setAttribute('aria-expanded', 'false');
  },

  toggleContrast() {
    const on = document.body.classList.toggle('high-contrast');
    localStorage.setItem('a11y_hc', on ? '1' : '0');
    DL.a11yAction('high_contrast_' + (on ? 'on' : 'off'));
  },

  toggleLargeText() {
    const on = document.body.classList.toggle('large-text');
    document.documentElement.classList.toggle('large-text', on);
    localStorage.setItem('a11y_lt', on ? '1' : '0');
    DL.a11yAction('large_text_' + (on ? 'on' : 'off'));
  },

  toggleMotion() {
    const on = document.body.classList.toggle('no-motion');
    localStorage.setItem('a11y_nm', on ? '1' : '0');
    DL.a11yAction('stop_animations_' + (on ? 'on' : 'off'));
  },
};

// Expose to HTML onclick (a11y panel buttons use inline data-action)
window.a11y = A11yWidget;

/* ================================================================
   14. PRIVACY MODAL
   ================================================================ */
const PrivacyModal = {
  overlay: null,

  init() {
    this.overlay = document.getElementById('privacy-modal');
    if (!this.overlay) return;

    // Close on backdrop click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Close button
    this.overlay.querySelector('.modal__close')?.addEventListener('click', () => this.close());

    // Trigger links
    document.querySelectorAll('[data-privacy]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });
  },

  open() {
    state.privacyModalOpen = true;
    this.overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    // Focus trap: focus close button
    this.overlay.querySelector('.modal__close')?.focus();
  },

  close() {
    state.privacyModalOpen = false;
    this.overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  },
};

/* ================================================================
   15. KEYBOARD SHORTCUTS
   ================================================================ */
const Keyboard = {
  init() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (state.privacyModalOpen)  PrivacyModal.close();
        if (state.mobileNavOpen)     MobileNav.close();
        if (state.a11yPanelOpen)     A11yWidget.close();
      }
    });
  },
};

/* ================================================================
   16. ACTIVE NAV HIGHLIGHTING
   ================================================================ */
const NavHighlight = {
  links: [],

  init() {
    this.links = Array.from(document.querySelectorAll('.nav__links a[href^="#"]'));
    window.addEventListener('scroll', () => this._update(), { passive: true });
  },

  _update() {
    let current = '';
    document.querySelectorAll('section[id]').forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 100) current = sec.id;
    });
    this.links.forEach(a => {
      a.classList.toggle(
        'is-active',
        a.getAttribute('href') === '#' + current
      );
    });
  },
};

/* ================================================================
   17. STICKY CTA
   ================================================================ */
const StickyCta = {
  el: null,

  init() {
    this.el = document.getElementById('sticky-cta');
    if (!this.el) return;
    window.addEventListener('scroll', () => this._update(), { passive: true });
    this._update();
  },

  _update() {
    const hero    = document.getElementById('hero');
    const contact = document.getElementById('contact');
    const footer  = document.getElementById('footer');
    if (!hero || !this.el) return;
    const pastHero  = window.scrollY > hero.offsetTop + hero.offsetHeight - 200;
    const atContact = contact && window.scrollY >= contact.offsetTop - 120;
    const atFooter  = footer  && window.scrollY + window.innerHeight >= footer.offsetTop + 80;
    this.el.classList.toggle('is-visible', pastHero && !atContact && !atFooter);
  },
};

/* ================================================================
   18. INIT — wire everything up
   ================================================================ */
/* ================================================================
   17. GALLERY CAROUSEL
   ================================================================ */
const GalleryCarousel = {
  init() {
    const grid = document.querySelector('.gallery-grid');
    const dots = document.querySelectorAll('.gallery-dot');
    if (!grid || !dots.length) return;

    const items = grid.querySelectorAll('.gallery-item');

    const getActiveIndex = () => {
      const gridLeft = grid.getBoundingClientRect().left;
      let closest = 0, minDist = Infinity;
      items.forEach((item, i) => {
        const dist = Math.abs(item.getBoundingClientRect().left - gridLeft);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      return closest;
    };

    const updateDots = () => {
      const idx = getActiveIndex();
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    };

    grid.addEventListener('scroll', updateDots, { passive: true });

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        if (items[i]) items[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      });
    });

    updateDots();
  },
};

/* ================================================================
   18. CONSTRUCTION BUBBLE
   ================================================================ */
const ConstructionBubble = {
  init() {
    const bubble = document.getElementById('construction-bubble');
    const closeBtn = document.getElementById('construction-bubble-close');
    const link = bubble?.querySelector('.construction-bubble__inner');
    if (!bubble || !closeBtn || !link) return;

    if (localStorage.getItem('bubble_dismissed')) {
      bubble.style.display = 'none';
      return;
    }

    const dismiss = () => {
      bubble.classList.add('hidden');
      setTimeout(() => { bubble.style.display = 'none'; }, 300);
      localStorage.setItem('bubble_dismissed', '1');
    };

    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dismiss();
    });

    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('contact');
      if (!target) return;
      const offset = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-h')) || 64;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    });
  },
};

document.addEventListener('DOMContentLoaded', () => {
  Navbar.init();
  MobileNav.init();
  Lang.init();
  FAQ.init();
  SmoothScroll.init();
  ScrollTracker.init();
  RevealObserver.init();
  CtaTracker.init();
  Form.init();
  A11yWidget.init();
  PrivacyModal.init();
  Keyboard.init();
  NavHighlight.init();
  StickyCta.init();
  GalleryCarousel.init();
  ConstructionBubble.init();

  // Page view (after all setup)
  DL.pageView();
});
