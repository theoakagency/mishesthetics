class PriceRange extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()
    this.querySelectorAll('input').forEach((element) => {
      element.addEventListener('change', this.onRangeChange.bind(this), { signal: this.abortController.signal })
      element.addEventListener('keydown', this.onKeyDown.bind(this), { signal: this.abortController.signal })
    })
    this.setMinAndMaxValues()
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget)
    this.setMinAndMaxValues()
  }

  onKeyDown(event) {
    if (event.metaKey) return

    const pattern = /[0-9]|\.|,|'| |Tab|Backspace|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Delete|Escape/
    if (!event.key.match(pattern)) event.preventDefault()
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input')
    const minInput = inputs[0]
    const maxInput = inputs[1]
    if (maxInput.value) minInput.setAttribute('data-max', maxInput.value)
    if (minInput.value) maxInput.setAttribute('data-min', minInput.value)
    if (minInput.value === '') maxInput.setAttribute('data-min', 0)
    if (maxInput.value === '') minInput.setAttribute('data-max', maxInput.getAttribute('data-max'))
  }

  adjustToValidValues(input) {
    const value = Number(input.value)
    const min = Number(input.getAttribute('data-min'))
    const max = Number(input.getAttribute('data-max'))

    if (value < min) input.value = min
    if (value > max) input.value = max
  }
}

customElements.define('price-range-text', PriceRange)
