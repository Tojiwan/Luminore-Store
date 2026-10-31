class LuminoreParallax extends HTMLElement {
  connectedCallback() {
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.mobile = matchMedia('(max-width: 749px)');
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
    const limit = this.mobile.matches ? 24 : 64;
    const speed = this.mobile.matches ? 0.06 : 0.14;
    const offset = Math.max(-limit, Math.min(limit, distance * speed));
    this.style.setProperty('--lm-offset', `${offset.toFixed(2)}px`);
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
