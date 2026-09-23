import { EVENTS } from 'util.events'

class SortBy extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()
    this.sortSelect = this.querySelector('select')
    this.sortBtns = this.querySelectorAll('.filter-sort')

    if (this.sortSelect) {
      this.defaultSort = this.getDefaultSortValue()
      this.sortSelect.addEventListener(
        'change',
        (evt) => {
          this.dispatchEvent(
            new CustomEvent(EVENTS.sortSelected, {
              detail: { sortValue: evt.target.value ?? this.defaultSort },
              bubbles: true
            })
          )
        },
        { signal: this.abortController.signal }
      )
    } else if (this.sortBtns.length) {
      this.sortBtns.forEach((btn) => {
        btn.addEventListener('click', this.handleSortButtonClick.bind(this), { signal: this.abortController.signal })
      })
    }
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  getDefaultSortValue() {
    return this.sortSelect.getAttribute('data-default-sortby')
  }

  handleSortButtonClick(evt) {
    const btn = evt.currentTarget
    this.dispatchEvent(new Event('filter:selected', { bubbles: true }))
    const sortValue = btn.dataset.value
    this.dispatchEvent(new CustomEvent(EVENTS.sortSelected, { detail: { sortValue }, bubbles: true }))
  }
}

customElements.define('sort-by', SortBy)
