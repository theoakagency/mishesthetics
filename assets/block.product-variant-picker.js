/*============================================================================
  Product variant picker glue

  Delivered as an ES module (not a section `{% javascript %}` tag) so it also
  initializes when the picker markup is injected into Quick Add / Quick Shop:
  those flows re-run `<script type="module">` tags via executeJSmodules, but
  section javascript tags only run on pages where the section is server-rendered.

  Bridges kit's `shopify:product:select` standard event to the theme's legacy
  `variant:change:{sectionId}:{productId}` event that the product blocks
  (buy-buttons, price, title, inventory, gallery) listen for.
==============================================================================*/

// Document-level singleton — safe to import repeatedly; only wires up once.
if (!window.__variantChangeBridge) {
  window.__variantChangeBridge = true

  // Rapid option clicks abort the in-flight section request; a superseded
  // selection must not settle the legacy listeners, or ATC re-enables with the
  // variant that was current before it started while the newer one is still loading.
  const latestSelection = new WeakMap()

  document.addEventListener('shopify:product:select', async (event) => {
    const triggerEl = event.target
    if (!(triggerEl instanceof HTMLElement) || !triggerEl.matches('kit-variant-picker')) return

    const { sectionId, productId } = triggerEl.dataset
    if (!sectionId || !productId) return

    const selectionId = (latestSelection.get(triggerEl) ?? 0) + 1
    latestSelection.set(triggerEl, selectionId)

    const dispatch = (html, variant, loading) => {
      if (latestSelection.get(triggerEl) !== selectionId) return

      triggerEl.dispatchEvent(
        new CustomEvent(`variant:change:${sectionId}:${productId}`, {
          bubbles: true,
          detail: { sectionId, variant, html, loading }
        })
      )
    }

    // Dispatch loading state
    const selectedVariant = JSON.parse(triggerEl.querySelector('[data-kit-selected-variant]')?.textContent ?? 'null')
    dispatch(null, selectedVariant, true)

    try {
      // Dispatch the refreshed section markup once the standard event's promise settles
      const { html } = await event.promise
      const newSelectedVariant = JSON.parse(html.querySelector('[data-kit-selected-variant]')?.textContent ?? 'null')
      dispatch(html, newSelectedVariant, false)
    } catch (error) {
      if (error?.name !== 'AbortError') console.error('Variant change failed:', error)

      // Dispatch with null variant to disable the button
      dispatch(null, null, false)
    }
  })
}
