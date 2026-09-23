import AjaxRenderer from 'util.ajax-renderer'
import { debounce, executeJSmodules } from 'util.misc'
import { EVENTS } from 'util.events'

class ItemGrid extends HTMLElement {
  constructor() {
    super()
    this.isAnimating = false
    this.abortController = new AbortController()

    this.selectors = {
      productGrid: '.product-grid',

      collectionGrid: '.collection-grid__wrapper',
      sidebar: '#CollectionSidebar',
      filterBar: '.collection-filter',
      toggle: 'accordion-toggle'
    }

    this.sectionId = this.getAttribute('data-section-id')
    this.enableScrollToTop = this.getAttribute('scroll-to-top') !== 'false'
    this.ajaxRenderer = new AjaxRenderer({
      sections: [{ sectionId: this.sectionId, nodeId: 'AjaxContent' }],
      onReplace: this.onReplaceAjaxContent.bind(this)
    })

    this.isStickyHeader = false
    this.resizeObserver = null
    this.siteHeader = null
  }

  connectedCallback() {
    this.abortController = new AbortController()
    this.init()

    this.siteHeader = document.querySelector('.site-header')
    this.initResizeObserver()

    if (document.querySelector('header[data-sticky="true"]')) {
      this.setFilterStickyPosition()
    }

    document.addEventListener(EVENTS.stickyHeaderChange, this.handleStickyHeaderChange.bind(this), {
      signal: this.abortController.signal
    })

    document.addEventListener(EVENTS.toggleMobileFilters, this.handleToggleMobileFilters.bind(this), {
      signal: this.abortController.signal
    })
  }

  disconnectedCallback() {
    this.abortController.abort()

    if (this.headerStickyChangeListener) {
      document.removeEventListener('headerStickyChange', this.headerStickyChangeListener)
    }

    this.resizeObserver?.disconnect()
  }

  initResizeObserver() {
    if (!this.resizeObserver && this.siteHeader) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.isStickyHeader) {
          this.setFilterStickyPosition()
        }
      })

      this.resizeObserver.observe(this.siteHeader)
    }
  }

  handleToggleMobileFilters(evt) {
    const { isOpen } = evt.detail

    if (isOpen) {
      document.dispatchEvent(
        new CustomEvent(EVENTS.sizeDrawer, {
          detail: { heights: [document.querySelector(this.selectors.filterBar).offsetHeight] }
        })
      )

      // Scroll to top of filter bar when opened
      let scrollTo = this.getScrollFilterTop()
      window.scrollTo({ top: scrollTo, behavior: 'smooth' })
    }
  }

  init() {
    this.initSort()
    this.initFilters()
    this.initPriceRange()
    this.initGridOptions()
  }

  handleStickyHeaderChange(evt) {
    this.isStickyHeader = evt.detail.isSticky

    if (this.isStickyHeader) {
      this.setFilterStickyPosition()
    }
  }

  initSort() {
    this.queryParams = new URLSearchParams(window.location.search)

    document.addEventListener(EVENTS.sortSelected, (evt) => {
      this.onSortChange(evt.detail.sortValue)
    })
  }

  onSortChange(sortValue = null) {
    this.queryParams = new URLSearchParams(window.location.search)

    if (sortValue) {
      this.queryParams.set('sort_by', sortValue)
    }

    this.queryParams.delete('page')
    window.location.search = this.queryParams.toString()
  }

  initGridOptions() {
    this.grid = this.querySelector(this.selectors.productGrid)
    document.addEventListener(EVENTS.viewChange, this.handleViewChange.bind(this), {
      signal: this.abortController.signal
    })
  }

  handleViewChange(evt) {
    this.grid.dataset.view = evt.detail.newView
  }

  initFilters() {
    const filterBar = document.querySelectorAll(this.selectors.filterBar)

    if (!filterBar.length) {
      return
    }

    this.bindBackButton()

    this.dispatchEvent(new CustomEvent(EVENTS.headerStickyCheck), { bubbles: true })
    if (this.isStickyHeader) {
      this.setFilterStickyPosition()

      document.addEventListener('headerStickyChange', debounce(500, this.setFilterStickyPosition.bind(this)), {
        signal: this.abortController.signal
      })
    }

    document.addEventListener(EVENTS.ajaxCollectionRender, this.handleAjaxCollectionRender.bind(this), {
      signal: this.abortController.signal
    })
  }

  initPriceRange() {
    document.addEventListener('price-range:change', this.onPriceRangeChange.bind(this), {
      once: true,
      signal: this.abortController.signal
    })
  }

  onPriceRangeChange(event) {
    this.renderFromFormData(event.detail)
  }

  handleAjaxCollectionRender(evt) {
    if (this.isAnimating) {
      return
    }

    this.isAnimating = true

    this.updateScroll(true)
    this.startLoading()

    if (evt.detail?.formData instanceof FormData) {
      this.renderFromFormData(evt.detail.formData)
    }

    if (evt.detail?.newUrl instanceof URL) {
      this.renderCollectionPage(evt.detail.newUrl.searchParams)
    }
  }

  onReplaceAjaxContent(newDom, section) {
    const openCollapsibleIds = this.fetchOpenCollapsibleFilters()

    openCollapsibleIds.forEach((selector) => {
      newDom.querySelectorAll(`[data-collapsible-id=${selector}] > details`).forEach((el) => (el.open = true))
    })

    const newContentEl = newDom.getElementById(section.nodeId)
    if (!newContentEl) {
      return
    }

    document.getElementById(section.nodeId).innerHTML = newContentEl.innerHTML

    const page = document.getElementById(section.nodeId)
    const countEl = page.querySelector('.collection-filter__item--count')
    if (countEl) {
      const count = countEl.innerText
      document.querySelectorAll('[data-collection-count]').forEach((el) => {
        el.innerText = count
      })
    }

    // Execute JS modules after the content is replaced
    const scripts = this.querySelectorAll(`#${section.nodeId} script[type="module"]`)
    executeJSmodules(scripts)
  }

  renderFromFormData(formData) {
    const searchParams = new URLSearchParams(formData)
    this.renderCollectionPage(searchParams)
  }

  renderCollectionPage(searchParams, updateURLHash = true) {
    this.ajaxRenderer.renderPage(window.location.pathname, searchParams, updateURLHash).then(() => {
      this.init()
      this.updateScroll(false)

      this.dispatchEvent(new CustomEvent('collection:reloaded', { bubbles: true }))

      this.isAnimating = false
    })
  }

  updateScroll(animate) {
    if (!this.enableScrollToTop) {
      return
    }

    let scrollTo = document.getElementById('AjaxContent').offsetTop

    // Scroll below the sticky header
    if (this.isStickyHeader && this.siteHeader) {
      scrollTo = scrollTo - this.siteHeader.offsetHeight
    }

    if (!matchMedia('(max-width: 768px)').matches) {
      scrollTo -= 10
    }

    if (animate) {
      window.scrollTo({ top: scrollTo, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: scrollTo })
    }
  }

  bindBackButton() {
    window.removeEventListener('popstate', this._popStateHandler)
    this._popStateHandler = (state) => {
      if (state) {
        const newUrl = new URL(window.location.href)
        this.renderCollectionPage(newUrl.searchParams, false)
      }
    }

    window.addEventListener('popstate', this._popStateHandler, { signal: this.abortController.signal })
  }

  fetchOpenCollapsibleFilters() {
    const openDesktopCollapsible = Array.from(
      document.querySelectorAll(`${this.selectors.sidebar} ${this.selectors.toggle} > details[open]`)
    )

    const openMobileCollapsible = Array.from(
      document.querySelectorAll(`${this.selectors.sidebar} ${this.selectors.toggle} > details[open]`)
    )

    return [...openDesktopCollapsible, ...openMobileCollapsible].map((toggle) =>
      toggle.closest(this.selectors.toggle).getAttribute('data-collapsible-id')
    )
  }

  setFilterStickyPosition() {
    const headerHeight = this.siteHeader ? this.siteHeader.offsetHeight - 1 : 0
    document.querySelector(this.selectors.filterBar).style.top = headerHeight + 'px'

    const stickySidebar = this.querySelector('[data-sticky-sidebar]')
    if (stickySidebar) {
      stickySidebar.style.top = headerHeight + 30 + 'px'
    }
  }

  startLoading() {
    this.querySelector(this.selectors.collectionGrid).classList.add('unload')
  }

  forceReload() {
    this.init()
  }

  getScrollFilterTop() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop
    let elTop = document.querySelector(this.selectors.filterBar).getBoundingClientRect().top
    return elTop + scrollTop
  }
}

customElements.define('item-grid', ItemGrid)
