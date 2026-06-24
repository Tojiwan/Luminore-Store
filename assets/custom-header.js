document.addEventListener('DOMContentLoaded', function () {
  const wrappers = document.querySelectorAll('[data-custom-header-wrapper]');

  wrappers.forEach(function (wrapper) {
    if (wrapper.dataset.initialized === 'true') return;
    wrapper.dataset.initialized = 'true';

    const html = document.documentElement;
    const body = document.body;

    const header = wrapper.querySelector('[data-custom-header]');
    const menuOpenBtn = wrapper.querySelector('[data-mobile-menu-open]');
    const menuCloseBtn = wrapper.querySelector('[data-mobile-menu-close]');
    const menuDrawer = wrapper.querySelector('[data-mobile-menu-drawer]');
    const menuOverlay = wrapper.querySelector('[data-mobile-menu-overlay]');

    const searchToggleBtn = wrapper.querySelector('[data-mobile-search-toggle]');
    const searchCloseBtn = wrapper.querySelector('[data-mobile-search-close]');
    const searchPanel = wrapper.querySelector('[data-mobile-search-panel]');
    const searchInput = wrapper.querySelector('[data-mobile-search-input]');

    const searchFields = wrapper.querySelectorAll('[data-search-field]');

    if (!header) return;

    /* ---------------------------
      SCROLL HEADER STATE LOGIC
    ----------------------------*/
    function handleHeaderState() {
      if (window.scrollY > 10) {
        header.classList.add('is-fixed');
        header.classList.remove('is-top');
      } else {
        header.classList.remove('is-fixed');
        header.classList.add('is-top');
      }
    }

    function setHeaderSpace() {
      if (!header) return;

      if (header.classList.contains('is-fixed')) {
        body.style.paddingTop = header.offsetHeight + 'px';
      } else {
        body.style.paddingTop = '0px';
      }
    }

    window.addEventListener('scroll', function () {
      handleHeaderState();
      setHeaderSpace();
    });

    window.addEventListener('resize', setHeaderSpace);
    document.addEventListener('DOMContentLoaded', function () {
      handleHeaderState();
      setHeaderSpace();
    });

    /* ---------------------------
      LOCK SCROLL HELPERS
    ----------------------------*/
    function lockScroll() {
      html.classList.add('custom-header-lock-scroll');
      body.classList.add('custom-header-lock-scroll');
    }

    function unlockScroll() {
      html.classList.remove('custom-header-lock-scroll');
      body.classList.remove('custom-header-lock-scroll');
    }

    /* ---------------------------
      SEARCH FIELD CLEAR BUTTONS
    ----------------------------*/
    searchFields.forEach(function (field) {
      const input = field.querySelector('[data-search-input]');
      const clearButton = field.querySelector('[data-search-clear]');

      if (!input || !clearButton) return;

      function syncClearButton() {
        if (input.value.trim() !== '') {
          clearButton.classList.remove('tw-hidden');
        } else {
          clearButton.classList.add('tw-hidden');
        }
      }

      input.addEventListener('input', syncClearButton);

      clearButton.addEventListener('click', function () {
        input.value = '';
        input.focus();
        syncClearButton();
      });

      syncClearButton();
    });

    /* ---------------------------
      MENU FUNCTIONS
    ----------------------------*/
    function openMenu() {
      if (!menuDrawer || !menuOverlay) return;

      closeSearch();
      menuDrawer.classList.add('is-open');
      menuOverlay.classList.add('is-open');
      menuDrawer.setAttribute('aria-hidden', 'false');

      if (menuOpenBtn) {
        menuOpenBtn.setAttribute('aria-expanded', 'true');
      }

      lockScroll();
    }

    function closeMenu() {
      if (!menuDrawer || !menuOverlay) return;

      menuDrawer.classList.remove('is-open');
      menuOverlay.classList.remove('is-open');
      menuDrawer.setAttribute('aria-hidden', 'true');

      if (menuOpenBtn) {
        menuOpenBtn.setAttribute('aria-expanded', 'false');
      }

      unlockScroll();
    }

    function toggleMenu() {
      if (!menuDrawer) return;
      menuDrawer.classList.contains('is-open') ? closeMenu() : openMenu();
    }

    /* ---------------------------
      SEARCH FUNCTIONS
    ----------------------------*/
    function openSearch() {
      if (!searchPanel) return;

      closeMenu();
      searchPanel.classList.add('is-open');
      searchPanel.setAttribute('aria-hidden', 'false');

      if (searchToggleBtn) {
        searchToggleBtn.setAttribute('aria-expanded', 'true');
      }

      requestAnimationFrame(function () {
        if (searchInput) searchInput.focus();
      });
    }

    function closeSearch() {
      if (!searchPanel) return;

      searchPanel.classList.remove('is-open');
      searchPanel.setAttribute('aria-hidden', 'true');

      if (searchToggleBtn) {
        searchToggleBtn.setAttribute('aria-expanded', 'false');
      }
    }

    function toggleSearch() {
      if (!searchPanel) return;
      searchPanel.classList.contains('is-open') ? closeSearch() : openSearch();
    }

    /* ---------------------------
      EVENTS
    ----------------------------*/
    if (menuOpenBtn) menuOpenBtn.addEventListener('click', toggleMenu);
    if (menuCloseBtn) menuCloseBtn.addEventListener('click', closeMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
    if (searchToggleBtn) searchToggleBtn.addEventListener('click', toggleSearch);
    if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearch);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMenu();
        closeSearch();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024) {
        closeMenu();
        closeSearch();
      }
    });
  });
});