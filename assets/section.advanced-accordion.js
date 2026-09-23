import { HTMLThemeElement } from 'element.theme'

class AdvancedAccordion extends HTMLThemeElement {
  constructor() {
    super()
    this.accordion = this.querySelector('.advanced-accordion')
  }

  onSectionLoad() {
    this.accordion.setAttribute('open', '')
  }

  onBlockSelect() {
    this.accordion.setAttribute('open', '')
  }
}

customElements.define('advanced-accordion', AdvancedAccordion)
