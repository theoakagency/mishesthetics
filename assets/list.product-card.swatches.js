class ColorSwatches extends HTMLElement {
  connectedCallback() {
    this.selectors = {
      colorSwatchImage: '.grid-product__color-image',
      colorSwatch: '[data-variant-id]',
      gridItemOverlayLink: '.grid-item__overlay-link',
      gridProductImageWrap: '.grid-product__image-wrap'
    }

    // Find nearest card container (assumed parent .grid-item__link wrapper div) and select overlay link + image wrap
    const cardContainer = this.closest('.grid-item__link') || this.parentElement || document
    this.overlayLink = cardContainer.querySelector(this.selectors.gridItemOverlayLink)
    this.gridProductImageWrap = cardContainer.querySelector(this.selectors.gridProductImageWrap)
    this.colorImages = this.gridProductImageWrap ? this.gridProductImageWrap.querySelectorAll(this.selectors.colorSwatchImage) : []

    if (this.colorImages.length) {
      this.swatches = this.querySelectorAll(this.selectors.colorSwatch)
      this.colorSwatchHovering()
    }
  }

  colorSwatchHovering() {
    this.swatches.forEach((swatch) => {
      swatch.addEventListener('mouseenter', () => this.setActiveColorImage(swatch))

      swatch.addEventListener(
        'touchstart',
        (evt) => {
          evt.preventDefault()
          this.setActiveColorImage(swatch)
        },
        { passive: true }
      )

      swatch.addEventListener('mouseleave', () => this.removeActiveColorImage(swatch))
    })
  }

  setActiveColorImage(swatch) {
    if (!this.gridProductImageWrap) return

    const id = swatch.dataset.variantId
    const image = swatch.dataset.variantImage

    // Unset all active swatch images
    this.colorImages.forEach((el) => {
      el.classList.remove('is-active')
    })

    // Unset all active swatches
    this.swatches.forEach((el) => {
      el.classList.remove('is-active')
    })

    // Set active image and swatch
    const imageEl = this.gridProductImageWrap.querySelector('.grid-product__color-image--' + id)
    if (imageEl) {
      imageEl.style.backgroundImage = 'url(' + image + ')'
      imageEl.classList.add('is-active')
    }
    swatch.classList.add('is-active')

    // Update overlay link href with variant URL
    const variantUrl = swatch.dataset.url
    if (this.overlayLink && variantUrl) {
      this.overlayLink.setAttribute('href', variantUrl)
    }
  }

  removeActiveColorImage(swatch) {
    if (!this.gridProductImageWrap) return
    const id = swatch.dataset.variantId
    const imageEl = this.gridProductImageWrap.querySelector(`.grid-product__color-image--${id}`)
    if (imageEl) imageEl.classList.remove('is-active')
    swatch.classList.remove('is-active')
  }
}

customElements.define('color-swatches', ColorSwatches)
