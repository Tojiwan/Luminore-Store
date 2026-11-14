if (!customElements.get('luminore-sticky-cart')) {
  customElements.define('luminore-sticky-cart', class extends HTMLElement {
    connectedCallback() {
      this.product = document.getElementById(`MainProduct-${this.dataset.section}`);
      this.mainButton = this.product?.querySelector('product-form [type="submit"]');
      if (!this.mainButton) return;
      this.button = this.querySelector('button');
      this.price = this.product.querySelector(`#price-${this.dataset.section}`);
      this.buyButtons = this.mainButton.closest('.product-form__buttons');
      this.footer = document.querySelector('footer');
      this.defaultImage = this.querySelector('img')?.src;
      this.mobile = matchMedia('(max-width: 749px)');
      this.update = () => {
        const busy = this.mainButton.getAttribute('aria-disabled') === 'true';
        this.button.disabled = this.mainButton.disabled || busy;
        this.button.textContent = this.mainButton.querySelector('span').textContent;
        this.button.setAttribute('aria-busy', String(busy));
        if (this.mainButton.hasAttribute('aria-haspopup')) this.button.setAttribute('aria-haspopup', 'dialog');
        const amount = this.price?.classList.contains('price--on-sale')
          ? this.price.querySelector('.price-item--sale')
          : this.price.querySelector('.price-item--regular');
        this.querySelector('.lm-pdp__sticky-price').textContent = this.price?.classList.contains('hidden') ? '' : amount?.textContent.trim() || '';
      };
      this.updateVisibility = () => {
        const footerTop = this.footer?.getBoundingClientRect().top ?? Infinity;
        const atPageEnd = Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight;
        this.hidden = !this.mobile.matches || this.buyButtons.getBoundingClientRect().bottom > 0 || footerTop < 0 || atPageEnd;
      };
      this.observer = new MutationObserver(this.update);
      this.observer.observe(this.mainButton, { attributes: true, childList: true, subtree: true, characterData: true });
      if (this.price) this.observer.observe(this.price, { attributes: true, childList: true, subtree: true });
      this.onScroll = () => {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => {
          this.frame = null;
          this.updateVisibility();
        });
      };
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onScroll);
      this.mobile.addEventListener('change', this.updateVisibility);
      this.unsubscribeVariant = subscribe(PUB_SUB_EVENTS.variantChange, ({ data }) => {
        if (data.sectionId !== this.dataset.section) return;
        this.update();
        const image = this.querySelector('img');
        const source = data.variant.featured_media?.preview_image?.src || this.defaultImage;
        if (image && source) {
          const url = new URL(source, location.origin);
          url.searchParams.set('width', '120');
          image.removeAttribute('srcset');
          image.src = url.href;
        }
      });
      this.unsubscribeError = subscribe(PUB_SUB_EVENTS.cartError, ({ productVariantId, errors, message }) => {
        if (String(productVariantId) !== this.button.form?.querySelector('[name="id"]')?.value) return;
        this.querySelector('[data-error]').textContent = typeof errors === 'string' ? errors : message || '';
      });
      this.clearError = () => {
        this.querySelector('[data-error]').textContent = '';
      };
      this.button.form?.addEventListener('submit', this.clearError);
      this.update();
      this.updateVisibility();
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onScroll);
      cancelAnimationFrame(this.frame);
      this.mobile?.removeEventListener('change', this.updateVisibility);
      this.unsubscribeVariant?.();
      this.unsubscribeError?.();
      this.button?.form?.removeEventListener('submit', this.clearError);
    }
  });
}
