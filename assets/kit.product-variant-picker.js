/*============================================================================
  kit-variant-picker

  Imported as an ES module to support hydration in AJAX contexts (Quick Add / Quick Shop).

  The consuming theme must map the module specifier `kit.product-variant-picker`
  to this asset in its import map.
==============================================================================*/

if (!customElements.get('kit-variant-picker')) {
  class KitVariantPicker extends HTMLElement {
    #abortController = null;
    #standardEventsReady = null;

    connectedCallback() {
      this.productId = this.dataset.productId;
      this.productTitle = this.dataset.productTitle;
      this.productHandle = this.dataset.productHandle;
      this.productUrl = this.dataset.productUrl;
      this.sectionId = this.dataset.sectionId;
      this.selectedVariant = JSON.parse(this.querySelector('[data-kit-selected-variant]')?.textContent ?? 'null');
      this.shouldUpdateUrl = 'updateUrl' in this.dataset;

      this.#standardEventsReady = this.#loadStandardEvents();
      this.addEventListener('change', this.#onChange);
    }

    async #loadStandardEvents() {
      try {
        this.SE = await import('https://cdn.shopify.com/storefront/standard-events.js');
      } catch (error) {
        console.error('Failed to load the Shopify Standard Events module.', error);
      }
    }

    disconnectedCallback() {
      this.removeEventListener('change', this.#onChange);
      this.#abortController?.abort();
    }

    async #onChange(event) {
      const trigger = event.target;

      if (!(trigger instanceof HTMLElement) || !trigger.matches('input[type="radio"], select')) {
        return;
      }

      const optionValueId =
        trigger.tagName === 'SELECT'
          ? trigger.options[trigger.selectedIndex]?.dataset.optionValueId
          : trigger.closest('[data-option-value-id]')?.dataset.optionValueId;
      await this.#standardEventsReady;

      if (!this.SE?.ProductSelectEvent) {
        this.#navigate();
        return;
      }

      const deferred = this.SE.ProductSelectEvent.createPromise();

      this.#standardDispatch({ promise: deferred.promise });

      try {
        const html = await this.#refresh(optionValueId);
        deferred.resolve({
          html, // extra keys survive Shopify's promise wrapper, useful for legacy event systems
          variant: this.selectedVariant
            ? {
              id: this.selectedVariant.id,
              title: this.selectedVariant.title,
              availableForSale: this.selectedVariant.available,
              price: {
                amount: (this.selectedVariant.price / 100).toFixed(2),
                currencyCode: window.Shopify?.currency?.active
              },
              selectedOptions: this.#getSelectedOptions().map(option => ({ name: option.name, value: option.value }))
            }
            : null
        });
      } catch (error) {
        deferred.reject(error);

        // Ignore AbortError triggered by a newer selection.
        // For other errors, navigate to the new variant.
        if (error.name !== 'AbortError') {
          console.error(error);
          this.#navigate();
        }
      }
    }

    #navigate() {
      const optionValues = this.#getSelectedOptions()
        .map(option => option.id)
        .filter(Boolean);

      if (!optionValues.length) return;

      const url = new URL(this.productUrl, window.location.origin);
      url.searchParams.set('option_values', optionValues.join(','));

      this.classList.add('kit-picker--loading');
      window.location.assign(url.toString());
    }

    async #refresh(changedOptionValueId) {
      const optionValues = this.#getSelectedOptions().map(option => option.id).join(',');
      const sectionRequestUrl = `${this.productUrl}?section_id=${this.sectionId}&option_values=${optionValues}`;

      this.#abortController?.abort();
      const abortController = new AbortController();
      this.#abortController = abortController;

      this.classList.add('kit-picker--loading');
      try {
        const sectionRequest = await fetch(sectionRequestUrl, { signal: abortController.signal });

        if (!sectionRequest.ok) {
          throw new Error(`Variant section request failed with ${sectionRequest.status}`);
        }

        const sectionResponse = await sectionRequest.text();
        const sectionHtml = new DOMParser().parseFromString(sectionResponse, 'text/html');
        const newPicker = sectionHtml.querySelector('kit-variant-picker');
        const newVariantData = JSON.parse(sectionHtml.querySelector('[data-kit-selected-variant]')?.textContent ?? 'null');

        if (newPicker) {
          this.selectedVariant = newVariantData;
          this.innerHTML = newPicker.innerHTML;
          this.#restoreFocus(changedOptionValueId);
          this.#updateHistory(newVariantData?.id);
        }

        return sectionHtml;
      } finally {
        // A superseded request must leave the picker inert: the request that
        // aborted it owns the controller and restores interactivity when it settles.
        if (this.#abortController === abortController) {
          this.classList.remove('kit-picker--loading');
        }
      }
    }

    #getSelectedOptions() {
      return [...this.querySelectorAll('input[type="radio"]:checked, select')].map(option => {
        if (option.tagName === 'SELECT') {
          return {
            name: option.dataset.optionName,
            value: option.options[option.selectedIndex]?.value,
            id: option.options[option.selectedIndex]?.dataset.optionValueId
          };
        } else if (option.tagName === 'INPUT') {
          return {
            name: option.name,
            value: option.value,
            id: option.closest('[data-option-value-id]')?.dataset.optionValueId
          };
        }
      });
    }

    #restoreFocus(optionValueId) {
      const option = this.querySelector(`[data-option-value-id="${optionValueId}"]`);

      if (!option) return;
      if (option.tagName === 'OPTION') {
        option.closest('select')?.focus();
      } else {
        (option.querySelector('input') || option).focus();
      }
    }

    #updateHistory(variantId) {
      if (!variantId || !this.shouldUpdateUrl) return;

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variantId);
      window.history.replaceState({}, '', url.toString());
    }

    #standardDispatch({ promise }) {
      this.dispatchEvent(new this.SE.ProductSelectEvent({
        selectedOptions: this.#getSelectedOptions().map(option => ({ name: option.name, value: option.value })),
        product: {
          id: this.productId,
          title: this.productTitle,
          handle: this.productHandle
        },
        promise
      }));
    }
  }

  customElements.define('kit-variant-picker', KitVariantPicker);
}
