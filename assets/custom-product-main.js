(function () {
  function formatMoney(cents, locale, currencyCode) {
    const amount = Number(cents || 0) / 100;

    try {
      return new Intl.NumberFormat(locale || document.documentElement.lang || 'en', {
        style: 'currency',
        currency: currencyCode || 'USD'
      }).format(amount);
    } catch (error) {
      return `$${amount.toFixed(2)}`;
    }
  }

  function initProductGallery(section) {
    if (!section || section.dataset.productGalleryInitialized === 'true') return;

    section.dataset.productGalleryInitialized = 'true';

    const thumbsEl = section.querySelector('.product-thumbs');
    const mainEl = section.querySelector('.product-main');

    let mainSwiper = null;

    if (thumbsEl && mainEl && typeof Swiper !== 'undefined') {
      const thumbsSwiper = new Swiper(thumbsEl, {
        spaceBetween: 12,
        slidesPerView: 'auto',
        watchSlidesProgress: true,
        slideToClickedSlide: true,
        direction: 'horizontal',
        freeMode: true,
        breakpoints: {
          768: {
            direction: 'vertical',
            slidesPerView: 'auto',
            spaceBetween: 12
          }
        }
      });

      mainSwiper = new Swiper(mainEl, {
        effect: 'fade',
        fadeEffect: {
          crossFade: true
        },
        speed: 350,
        allowTouchMove: true,
        thumbs: {
          swiper: thumbsSwiper
        }
      });
    }

    const minusBtn = section.querySelector('.qty-minus');
    const plusBtn = section.querySelector('.qty-plus');
    const qtyInput = section.querySelector('.qty-input');

    if (minusBtn && plusBtn && qtyInput) {
      minusBtn.addEventListener('click', () => {
        const currentValue = parseInt(qtyInput.value, 10) || 1;

        if (currentValue > 1) {
          qtyInput.value = currentValue - 1;
        }
      });

      plusBtn.addEventListener('click', () => {
        const currentValue = parseInt(qtyInput.value, 10) || 1;
        qtyInput.value = currentValue + 1;
      });
    }

    const form = section.querySelector('.product-form-custom');
    const variantInput = section.querySelector('[data-product-variant-id]');
    const variantJson = section.querySelector('[data-product-variants-json]');
    const optionGroups = section.querySelectorAll('[data-option-group]');
    const priceEl = section.querySelector('[data-product-price]');
    const comparePriceEl = section.querySelector('[data-product-compare-price]');
    const discountEl = section.querySelector('[data-product-discount]');
    const addButton = section.querySelector('[data-product-add-button]');

    if (!form || !variantInput || !variantJson) return;

    let variants = [];

    try {
      variants = JSON.parse(variantJson.textContent);
    } catch (error) {
      variants = [];
    }

    function getSelectedOptions() {
      return Array.from(optionGroups).map((group) => {
        const checkedInput = group.querySelector('.product-gallery__option-input:checked');
        return checkedInput ? checkedInput.value : null;
      });
    }

    function findSelectedVariant() {
      const selectedOptions = getSelectedOptions();

      return variants.find((variant) => {
        return variant.options.every((optionValue, index) => {
          return optionValue === selectedOptions[index];
        });
      });
    }

    function updatePrice(variant) {
      if (!variant || !priceEl) return;

      const locale = section.dataset.locale;
      const currencyCode = section.dataset.currencyCode;

      priceEl.textContent = formatMoney(variant.price, locale, currencyCode);

      if (comparePriceEl) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          comparePriceEl.textContent = formatMoney(variant.compare_at_price, locale, currencyCode);
          comparePriceEl.classList.remove('product-gallery__hidden');
        } else {
          comparePriceEl.classList.add('product-gallery__hidden');
        }
      }

      if (discountEl) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          const discount = Math.round(
            ((variant.compare_at_price - variant.price) * 100) / variant.compare_at_price
          );

          discountEl.textContent = `-${discount}%`;
          discountEl.classList.remove('product-gallery__hidden');
        } else {
          discountEl.classList.add('product-gallery__hidden');
        }
      }
    }

    function updateAddButton(variant) {
      if (!addButton || !variant) return;

      if (variant.available) {
        addButton.disabled = false;
        addButton.textContent = 'Add to Cart';
      } else {
        addButton.disabled = true;
        addButton.textContent = 'Sold Out';
      }
    }

    function updateMedia(variant) {
      if (!variant || !variant.featured_media || !mainSwiper) return;

      const mediaId = String(variant.featured_media.id);
      const slides = Array.from(section.querySelectorAll('.product-main .swiper-slide'));

      const slideIndex = slides.findIndex((slide) => {
        return slide.dataset.mediaId === mediaId;
      });

      if (slideIndex >= 0) {
        mainSwiper.slideTo(slideIndex);
      }
    }

    function updateSelectedVariant() {
      const selectedVariant = findSelectedVariant();

      if (!selectedVariant) return;

      variantInput.value = selectedVariant.id;

      updatePrice(selectedVariant);
      updateAddButton(selectedVariant);
      updateMedia(selectedVariant);
    }

    const optionInputs = section.querySelectorAll('.product-gallery__option-input');

    optionInputs.forEach((input) => {
      input.addEventListener('change', updateSelectedVariant);
    });

    updateSelectedVariant();
  }

  function initAllProductGalleries() {
    document.querySelectorAll('[data-product-gallery-section]').forEach((section) => {
      initProductGallery(section);
    });
  }

  document.addEventListener('DOMContentLoaded', initAllProductGalleries);

  document.addEventListener('shopify:section:load', (event) => {
    const section = event.target.querySelector('[data-product-gallery-section]');

    if (section) {
      initProductGallery(section);
    }
  });
})();