import Modals from 'module.modal'

class PasswordHeader extends HTMLElement {
  constructor() {
    super()

    if (!document.querySelector('#LoginModal')) return

    const passwordModal = new Modals('LoginModal', 'login-modal', {
      focusIdOnOpen: 'password',
      solid: true
    })

    // Open modal if errors exist
    if (document.querySelectorAll('.errors').length) passwordModal.open()
  }
}

customElements.define('password-header', PasswordHeader)
