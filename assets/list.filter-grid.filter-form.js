import { EVENTS } from 'util.events'
import { debounce } from 'util.misc'

class FilterForm extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()
    this.form = this.querySelector('.filter-form')
    this.debouncedHandleInput = debounce(800, (evt) => this.handleInput(evt))
    this.form.addEventListener('input', this.debouncedHandleInput.bind(this), {
      signal: this.abortController.signal
    })
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  handleInput(evt) {
    this.dispatchEvent(new Event('filter:selected', { bubbles: true }))

    evt.preventDefault()

    const formData = new FormData(this.form)

    this.dispatchEvent(new CustomEvent(EVENTS.ajaxCollectionRender, { detail: { formData }, bubbles: true }))
  }
}

customElements.define('filter-form', FilterForm)
