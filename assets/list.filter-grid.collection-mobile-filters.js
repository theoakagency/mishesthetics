import { unlockMobileScrolling, lockMobileScrolling } from 'util.a11y'
import { EVENTS } from 'util.events'
import { prepareTransition, executeJSmodules } from 'util.misc'

class CollectionMobileFilters extends HTMLElement {
  connectedCallback() {
    this.selectors = {
      filters: '.filter-wrapper',
      inlineWrapper: '#CollectionInlineFilterWrap',
      sortBtn: '.filter-sort',
      filterForm: '.filter-form'
    }
    this.config = {
      mobileFiltersInPlace: false,
      isOpen: false
    }

    this.mobileMediaQuery = window.matchMedia(`(max-width: 768px)`)

    this.handleMediaQueryChange = this.handleMediaQueryChange.bind(this)
    this.mobileMediaQuery.addListener(this.handleMediaQueryChange)
    this.handleMediaQueryChange(this.mobileMediaQuery)

    this.abortController = new AbortController()

    document.addEventListener(EVENTS.toggleMobileFilters, this.toggle.bind(this), {
      signal: this.abortController.signal
    })
    document.addEventListener('filter:selected', this.close.bind(this), {
      signal: this.abortController.signal
    })
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  processHTML(filters) {
    const filterForm = filters.querySelector(this.selectors.filterForm)
    const filterFormElements = Array.from(filterForm.elements)

    // Update form elements to have unique IDs and labels
    filterFormElements.forEach((el) => {
      const id = el.getAttribute('id')
      if (id) {
        const newId = `${id}-mobile`
        el.setAttribute('id', newId)
        const label = el.closest(`label[for="${id}"]`)
        if (label) {
          label.setAttribute('for', newId)
        }
      }
    })
  }

  async renderFiltersOnMobile() {
    if (this.config.mobileFiltersInPlace) {
      return
    }

    const filters = await this.getFilters()

    const inlineWrapper = this.querySelector(this.selectors.inlineWrapper)
    this.processHTML(filters)

    inlineWrapper.innerHTML = ''
    inlineWrapper.append(filters)

    // Execute JS modules after the filters are rendered
    const scripts = inlineWrapper.querySelectorAll('script[type="module"]')
    executeJSmodules(scripts)

    this.config.mobileFiltersInPlace = true
  }

  handleMediaQueryChange(mql) {
    if (mql.matches) {
      // Wait for ajax-renderer.js to make potential changes to URL parameters
      setTimeout(() => {
        this.renderFiltersOnMobile()
      }, 100)
    }
  }

  /*============================================================================
    Open and close filter drawer
  ==============================================================================*/
  toggle() {
    if (this.config.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  open() {
    const filters = this.querySelector(this.selectors.filters)

    prepareTransition(filters, () => filters.classList.add('is-active'))

    this.config.isOpen = true

    lockMobileScrolling()

    // Bind the keyup event handler
    this._keyupHandler = (evt) => {
      if (evt.keyCode === 27) {
        this.close()
      }
    }
    window.addEventListener('keyup', this._keyupHandler, {
      signal: this.abortController.signal
    })
  }

  close() {
    const filters = this.querySelector(this.selectors.filters)

    if (!filters) {
      return
    }

    prepareTransition(filters, () => filters.classList.remove('is-active'))

    this.config.isOpen = false

    unlockMobileScrolling()

    // Remove the keyup event handler
    window.removeEventListener('keyup', this._keyupHandler)
  }

  async getFilters() {
    const searchParams = window.location.search.slice(1)
    const url = `${window.location.pathname}?section_id=item-grid-filters&${searchParams}`
    const response = await fetch(url)

    if (!response.ok) {
      throw response
    }

    const responseText = await response.text()
    const html = new DOMParser().parseFromString(responseText, 'text/html')
    return html.querySelector(this.selectors.filters)
  }
}

customElements.define('collection-mobile-filters', CollectionMobileFilters)
