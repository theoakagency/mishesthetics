import { EVENTS } from 'util.events'

class ActiveTags extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()
    this.querySelectorAll('.tag-list a').forEach((tag) => {
      tag.addEventListener('click', this.onTagClick.bind(this), { signal: this.abortController.signal })
    })
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  onTagClick(evt) {
    const el = evt.target

    this.dispatchEvent(new Event('filter:selected', { bubbles: true }))

    evt.preventDefault()
    this.dispatchEvent(
      new CustomEvent(EVENTS.ajaxCollectionRender, { detail: { newUrl: new URL(el.href) }, bubbles: true })
    )
  }
}

customElements.define('active-tags', ActiveTags)
