if (!customElements.get('luminore-styled-with')) {
  customElements.define('luminore-styled-with', class extends HTMLElement {
    connectedCallback() {
      this.init = () => {
        if (!this.isConnected || this.swiper) return;
        this.swiper = new Swiper(this, {
          slidesPerView: 1.2,
          spaceBetween: 12,
          loop: false,
          autoplay: false,
          watchOverflow: true,
          navigation: {
            nextEl: this.querySelector('.swiper-button-next'),
            prevEl: this.querySelector('.swiper-button-prev'),
          },
          pagination: {
            el: this.querySelector('.swiper-pagination'),
            type: 'fraction',
            formatFractionCurrent: (number) => String(number).padStart(2, '0'),
            formatFractionTotal: (number) => String(number).padStart(2, '0'),
          },
          breakpoints: {
            750: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 4, spaceBetween: 20 },
          },
        });
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', this.init, { once: true });
      else this.init();
    }
    disconnectedCallback() {
      document.removeEventListener('DOMContentLoaded', this.init);
      this.swiper?.destroy(true, true);
      this.swiper = null;
    }
  });
}
