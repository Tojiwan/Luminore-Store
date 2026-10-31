function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

class LuminoreParallax extends HTMLElement {
  connectedCallback() {
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.tablet = matchMedia('(max-width: 1099px)');
    this.mobile = matchMedia('(max-width: 749px)');
    this.update = this.update.bind(this);
    this.schedule = this.schedule.bind(this);
    this.configure = this.configure.bind(this);
    this.motion.addEventListener('change', this.configure);
    this.tablet.addEventListener('change', this.schedule);
    this.mobile.addEventListener('change', this.schedule);
    this.querySelectorAll('[data-speed]').forEach((layer) => {
      layer.style.setProperty('--lm-speed', layer.dataset.speed);
    });
    this.configure();
  }

  configure() {
    window.removeEventListener('scroll', this.schedule);
    window.removeEventListener('resize', this.schedule);
    cancelAnimationFrame(this.frame);
    this.frame = null;
    if (this.motion.matches || !this.hasAttribute('enabled')) {
      this.style.removeProperty('--lm-offset');
      return;
    }
    window.addEventListener('scroll', this.schedule, { passive: true });
    window.addEventListener('resize', this.schedule);
    this.update();
  }

  schedule() {
    if (!this.frame) this.frame = requestAnimationFrame(this.update);
  }

  update() {
    this.frame = null;
    if (this.motion.matches || !this.hasAttribute('enabled')) return;
    const rect = this.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const distance = window.innerHeight / 2 - (rect.top + rect.height / 2);
    const limit = this.mobile.matches ? 24 : this.tablet.matches ? 40 : 64;
    const speed = this.mobile.matches ? 0.06 : this.tablet.matches ? 0.1 : 0.14;
    const offset = clamp(distance * speed, -limit, limit);
    this.style.setProperty('--lm-offset', `${offset.toFixed(2)}px`);
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.schedule);
    window.removeEventListener('resize', this.schedule);
    this.motion.removeEventListener('change', this.configure);
    this.tablet.removeEventListener('change', this.schedule);
    this.mobile.removeEventListener('change', this.schedule);
    cancelAnimationFrame(this.frame);
  }
}

class LuminoreStack extends HTMLElement {
  connectedCallback() {
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.mobile = matchMedia('(max-width: 749px)');
    this.cards = [...this.querySelectorAll('[data-stack-card]')];
    this.update = this.update.bind(this);
    this.schedule = this.schedule.bind(this);
    this.configure = this.configure.bind(this);
    this.motion.addEventListener('change', this.configure);
    this.mobile.addEventListener('change', this.schedule);
    this.configure();
  }

  configure() {
    window.removeEventListener('scroll', this.schedule);
    window.removeEventListener('resize', this.schedule);
    cancelAnimationFrame(this.frame);
    this.frame = null;
    if (this.motion.matches) {
      this.classList.remove('lm-stack--ready');
      this.reset();
      return;
    }
    this.classList.add('lm-stack--ready');
    window.addEventListener('scroll', this.schedule, { passive: true });
    window.addEventListener('resize', this.schedule);
    this.update();
  }

  reset() {
    this.cards.forEach((card) => {
      card.style.removeProperty('--lm-enter');
      card.style.removeProperty('--lm-recede');
      card.style.removeProperty('--lm-card-scale');
      card.style.removeProperty('--lm-card-lift');
      const link = card.querySelector('[data-stack-link]');
      if (link) link.removeAttribute('tabindex');
    });
  }

  schedule() {
    if (!this.frame) this.frame = requestAnimationFrame(this.update);
  }

  update() {
    this.frame = null;
    if (this.motion.matches || !this.cards.length) return;
    const viewport = window.innerHeight;
    const rect = this.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > viewport) return;
    const stickyTop = parseFloat(getComputedStyle(this.cards[0]).top) || 0;
    const range = viewport * (this.mobile.matches ? 0.55 : 0.45);
    const tops = this.cards.map((card) => card.getBoundingClientRect().top);
    const progress = this.cards.map((card, index) => {
      const enter = clamp(1 - (tops[index] - stickyTop) / range, 0, 1);
      const next = tops[index + 1];
      const recede = next === undefined ? 0 : clamp(1 - (next - stickyTop) / range, 0, 1);
      return {
        enter,
        recede,
        covered: next !== undefined && next <= stickyTop + 8,
      };
    });
    this.cards.forEach((card, index) => {
      const { enter, recede, covered } = progress[index];
      const scale = (0.96 + enter * 0.04) * (1 - recede * 0.06);
      card.style.setProperty('--lm-enter', enter.toFixed(3));
      card.style.setProperty('--lm-recede', recede.toFixed(3));
      card.style.setProperty('--lm-card-scale', scale.toFixed(4));
      card.style.setProperty('--lm-card-lift', `${(recede * -8).toFixed(2)}px`);
      const link = card.querySelector('[data-stack-link]');
      if (!link) return;
      if (covered) link.setAttribute('tabindex', '-1');
      else link.removeAttribute('tabindex');
      if (covered && document.activeElement === link) {
        const nextLink = this.cards[index + 1]?.querySelector('[data-stack-link]');
        if (nextLink) nextLink.focus({ preventScroll: true });
      }
    });
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.schedule);
    window.removeEventListener('resize', this.schedule);
    this.motion.removeEventListener('change', this.configure);
    this.mobile.removeEventListener('change', this.schedule);
    cancelAnimationFrame(this.frame);
  }
}

customElements.define('luminore-parallax', LuminoreParallax);
customElements.define('luminore-stack', LuminoreStack);

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const disclosure = event.target.closest('.lm-header details[open]');
  if (!disclosure) return;
  disclosure.open = false;
  disclosure.querySelector('summary').focus();
});

document.addEventListener('click', (event) => {
  document.querySelectorAll('.lm-header details[open]').forEach((disclosure) => {
    if (!disclosure.contains(event.target) || event.target.closest('a')) disclosure.open = false;
  });
});
