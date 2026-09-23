class ImageLightbox extends HTMLElement {
  constructor() {
    super()

    const lightboxTrigger = this.querySelector('.lightbox-trigger')
    const lightbox = this.querySelector('.lightbox')
    const lightboxOuterContainer = this.querySelector('.lightbox-outer-container')
    const lightboxCloseBtn = this.querySelector('.lightbox-close-btn')

    lightboxTrigger.addEventListener('click', () => {
      lightbox.classList.add('active')

      document.addEventListener('keydown', handleKeydown)
    })

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox || event.target === lightboxOuterContainer) {
        lightbox.classList.remove('active')

        document.removeEventListener('keydown', handleKeydown)
      }
    })

    lightboxCloseBtn.addEventListener('click', () => {
      lightbox.classList.remove('active')

      document.removeEventListener('keydown', handleKeydown)
    })

    function handleKeydown(event) {
      if (event.keyCode === 27) {
        lightbox.classList.remove('active')
      }
    }
  }
}

customElements.define('image-lightbox', ImageLightbox)
