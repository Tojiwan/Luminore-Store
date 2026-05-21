document.addEventListener('DOMContentLoaded', () => {
  const sliders = document.querySelectorAll('.product-swiper');

  sliders.forEach((slider) => {
    const slidesDesktop = parseInt(slider.dataset.slidesDesktop) || 4;
    const enableAutoplay = slider.dataset.autoplay === 'true';
    const autoplayDelay = parseInt(slider.dataset.autoplayDelay) || 3000;

    const sliderWrapper = slider.closest('.tw-relative');

    new Swiper(slider, {
      loop: true,
      spaceBetween: 16,
      slidesPerView: 1,

      autoplay: enableAutoplay
        ? {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }
        : false,

      pagination: {
        el: slider.querySelector('.swiper-pagination'),
        clickable: true,
      },

      // navigation: {
      //   nextEl: sliderWrapper ? sliderWrapper.querySelector('.swiper-button-next') : null,
      //   prevEl: sliderWrapper ? sliderWrapper.querySelector('.swiper-button-prev') : null,
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