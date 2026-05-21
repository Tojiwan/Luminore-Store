document.addEventListener('DOMContentLoaded', () => {
  const sliders = document.querySelectorAll('.product-swiper');

  sliders.forEach((slider) => {
    const slidesDesktop = parseInt(slider.dataset.slidesDesktop) || 4;
    const enableAutoplay = slider.dataset.autoplay === 'true';
    const autoplayDelay = parseInt(slider.dataset.autoplayDelay) || 3000;

    const wrapper = slider.querySelector('.swiper-wrapper');
    const originalSlides = Array.from(wrapper.querySelectorAll('.swiper-slide'));
    const totalSlides = originalSlides.length;

    // Ensure enough slides for smooth loop behavior
    const minRequired = slidesDesktop * 2 + 1;

    if (totalSlides > 0 && totalSlides < minRequired) {
      const cloneRounds = Math.ceil(minRequired / totalSlides);

      for (let i = 0; i < cloneRounds; i++) {
        originalSlides.forEach((slide) => {
          const clone = slide.cloneNode(true);
          clone.setAttribute('data-cloned', 'true');
          wrapper.appendChild(clone);
        });
      }
    }

    const swiper = new Swiper(slider, {
      spaceBetween: 16,
      speed: 800,
      slidesPerView: 1,
      loop: true,
      watchOverflow: true,

      autoplay: enableAutoplay
        ? {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }
        : false,

      // navigation: {
      //   nextEl: slider.querySelector('.swiper-button-next'),
      //   prevEl: slider.querySelector('.swiper-button-prev')
      // },

      breakpoints: {
        640: {
          slidesPerView: 2,
          spaceBetween: 16
        },
        768: {
          slidesPerView: 3,
          spaceBetween: 20
        },
        1024: {
          slidesPerView: slidesDesktop,
          spaceBetween: 24
        }
      }
    });
  });
});