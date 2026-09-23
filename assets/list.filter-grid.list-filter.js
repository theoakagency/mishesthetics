class FilterList extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()
    this.showMoreButton = this.querySelector('.js-show-more')
    this.showLessButton = this.querySelector('.js-show-less')

    this.showMoreButton?.addEventListener('click', this.showMore.bind(this), { signal: this.abortController.signal })
    this.showLessButton?.addEventListener('click', this.showLess.bind(this), { signal: this.abortController.signal })
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  showMore(evt) {
    evt.preventDefault()
    this.classList.add('show-all')
    this.showLessButton.setAttribute('aria-expanded', 'true')
    this.showMoreButton.setAttribute('aria-expanded', 'true')
    this.showLessButton.focus()
  }

  showLess(evt) {
    evt.preventDefault()
    this.classList.remove('show-all')
    this.showLessButton.setAttribute('aria-expanded', 'false')
    this.showMoreButton.setAttribute('aria-expanded', 'false')
    this.showMoreButton.focus()
  }
}

customElements.define('filter-list', FilterList)
