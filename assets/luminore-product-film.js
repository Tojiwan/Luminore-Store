if (!customElements.get('luminore-product-film')) {
  customElements.define('luminore-product-film', class extends HTMLElement {
    connectedCallback() {
      this.video = this.querySelector('video');
      if (!this.video) return;
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.started = false;
      this.onMotion = () => { if (this.motion.matches) this.video.pause(); };
      this.motion.addEventListener('change', this.onMotion);
      this.observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) {
          this.video.pause();
        } else if (!this.started && !this.motion.matches) {
          this.started = true;
          this.video.play().catch(() => {});
        }
      }, { threshold: 0.25 });
      this.observer.observe(this);
    }
    disconnectedCallback() {
      if (!this.video) return;
      this.observer.disconnect();
      this.motion.removeEventListener('change', this.onMotion);
      this.video.pause();
    }
  });
}
