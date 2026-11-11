if (!customElements.get('luminore-filter-drawer')) {
  customElements.define('luminore-filter-drawer', class extends HTMLElement {
    static buildParams(search, entries) {
      const params = new URLSearchParams(search);
      [...params.keys()].filter(key => key.startsWith('filter.') || key === 'page').forEach(key => params.delete(key));
      for (const [key, value] of entries) {
        if (value === '') continue;
        if (key.startsWith('filter.')) params.append(key, value);
        else params.set(key, value);
      }
      return params;
    }

    static clampPrice(value, min, max) {
      const number = Number(value);
      return Math.min(max, Math.max(min, Number.isFinite(number) ? number : min));
    }

    connectedCallback() {
      this.events = new AbortController();
      this.inline = window.matchMedia('(min-width: 750px)');
      const options = { signal: this.events.signal };
      this.inline.addEventListener('change', () => this.syncMode(), options);
      this.addEventListener('click', event => this.onClick(event), options);
      this.addEventListener('input', event => this.onInput(event), options);
      this.addEventListener('keydown', event => {
        const dialog = this.querySelector('dialog');
        if (event.key !== 'Tab' || !dialog?.open) return;
        const focusable = [...getFocusableElements(dialog)].filter(element => element.getClientRects().length);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }, options);
      this.addEventListener('change', event => {
        if (!event.target.matches('[data-sort]')) return;
        const params = new URLSearchParams(location.search);
        params.delete('page');
        params.set('sort_by', event.target.value);
        FacetFiltersForm.renderPage(params.toString());
      }, options);
      this.addEventListener('submit', event => {
        if (!event.target.matches('[data-filter-form]')) return;
        event.preventDefault();
        this.querySelectorAll('[data-price]').forEach(group => this.syncPrice(group));
        const params = this.constructor.buildParams(location.search, new FormData(event.target));
        this.close();
        FacetFiltersForm.renderPage(params.toString());
      }, options);
      this.addEventListener('cancel', event => { event.preventDefault(); this.close(); }, { ...options, capture: true });
      this.enhance();
    }

    disconnectedCallback() {
      this.events?.abort();
      this.request?.abort();
      this.unlock();
    }

    enhance() {
      this.querySelectorAll('[data-ranges]').forEach(element => { element.hidden = false; });
      this.querySelectorAll('[data-price]').forEach(group => this.syncPrice(group));
    }

    open() {
      if (this.inline.matches) return;
      const dialog = this.querySelector('dialog');
      if (!dialog || dialog.open) return;
      this.querySelector('form').reset();
      this.enhance();
      this.previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      dialog.querySelector('[data-close]').focus();
    }

    syncMode() {
      const dialog = this.querySelector('dialog');
      if (this.inline.matches && dialog?.open) {
        dialog.close();
        this.unlock();
      }
    }

    unlock() {
      if (this.previousOverflow === undefined) return;
      document.body.style.overflow = this.previousOverflow;
      this.previousOverflow = undefined;
    }

    close(restoreFocus = true) {
      const dialog = this.querySelector('dialog');
      const wasOpen = dialog?.open;
      dialog?.close();
      if (wasOpen) this.querySelector('form')?.reset();
      this.unlock();
      if (restoreFocus && wasOpen) this.querySelector('[data-open]')?.focus();
    }

    onClick(event) {
      if (event.target.closest('[data-open]')) this.open();
      if (event.target.closest('[data-close]')) this.close();
      const dialog = this.querySelector('dialog');
      if (dialog.open && event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.close();
      }
      if (event.target.closest('[data-clear]')) {
        // Clear is immediate; other filter edits stay staged until Apply.
        FacetFiltersForm.renderPage(this.constructor.buildParams(location.search, []).toString());
        return;
      }
      const remove = event.target.closest('[data-remove]');
      if (remove) {
        event.preventDefault();
        const url = new URL(remove.href);
        FacetFiltersForm.renderPage(url.search.slice(1));
      }
    }

    onInput(event) {
      const input = event.target;
      const group = input.closest('[data-price]');
      if (!group) return;
      if (input.dataset.slider) group.querySelector(`[data-bound="${input.dataset.slider}"]`).value = input.value;
      this.syncPrice(group, input.dataset.slider || input.dataset.bound);
    }

    syncPrice(group, changed = 'min') {
      const min = group.querySelector('[data-bound=min]');
      const max = group.querySelector('[data-bound=max]');
      const ceiling = Number(group.dataset.max);
      let low = this.constructor.clampPrice(min.value, 0, ceiling);
      let high = max.value === '' ? ceiling : this.constructor.clampPrice(max.value, 0, ceiling);
      if (low > high) {
        if (changed === 'max') high = low;
        else low = high;
      }
      if (min.value !== '') min.value = low;
      if (max.value !== '') max.value = high;
      group.querySelector('[data-slider=min]').value = low;
      group.querySelector('[data-slider=max]').value = high;
    }

    async renderResults(searchParams, updateHistory = true) {
      this.request?.abort();
      const request = this.request = new AbortController();
      const focusedSort = document.activeElement?.matches('[data-sort]');
      const returnFocus = this.contains(document.activeElement);
      this.close(returnFocus);
      this.setAttribute('aria-busy', 'true');
      this.querySelector('.lm-filter-error')?.setAttribute('hidden', '');
      const grid = document.getElementById('ProductGridContainer');
      grid.setAttribute('aria-busy', 'true');
      const params = new URLSearchParams(searchParams);
      params.set('section_id', this.dataset.section);
      try {
        const response = await fetch(`${location.pathname}?${params}`, { signal: request.signal });
        if (!response.ok) throw new Error(`Filter request failed: ${response.status}`);
        const html = await response.text();
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const next = parsed.querySelector('luminore-filter-drawer');
        if (!next || !parsed.getElementById('ProductGridContainer')) throw new Error('Missing collection section');
        if (request.signal.aborted) return;
        FacetFiltersForm.renderProductGridContainer(html);
        this.innerHTML = next.innerHTML;
        this.enhance();
        if (updateHistory) FacetFiltersForm.updateURLHash(searchParams);
        FacetFiltersForm.searchParamsPrev = searchParams;
        const inlineFocus = returnFocus && this.inline.matches ? this.querySelector('.lm-filter-header h2') : null;
        const focusTarget = focusedSort ? this.querySelector('[data-sort]') : inlineFocus || (returnFocus ? this.querySelector('[data-open]') : null);
        focusTarget?.focus();
      } catch (error) {
        if (error.name !== 'AbortError') {
          this.querySelector('.lm-filter-error')?.removeAttribute('hidden');
          const sort = this.querySelector('[data-sort]');
          if (sort) sort.value = new URLSearchParams(location.search).get('sort_by') || sort.querySelector('[selected]')?.value;
        }
      } finally {
        if (this.request === request) {
          this.removeAttribute('aria-busy');
          grid.removeAttribute('aria-busy');
        }
      }
    }
  });
}
