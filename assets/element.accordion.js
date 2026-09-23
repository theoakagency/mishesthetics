class AccordionToggle extends HTMLElement {
  constructor() {
    super()
    this.details = this.querySelector('details')
    this.summary = this.querySelector('summary')

    this.addEventListener('keydown', this.handleKeyDown)
  }

  handleKeyDown = (event) => {
    if (event.key === 'Escape' && this.details.open) {
      event.preventDefault()

      this.details.open = false
      this.summary.focus()
    }
  }
}

customElements.define('accordion-toggle', AccordionToggle)
