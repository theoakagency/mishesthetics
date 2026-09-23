import CartForm from 'module.cart-form'
import { EVENTS } from 'util.events'

if (document.body.classList.contains('template-cart')) {
  var cartPageForm = document.getElementById('CartPageForm')
  if (cartPageForm) {
    var cartForm = new CartForm(cartPageForm)

    document.addEventListener(EVENTS.ajaxProductAdded, () => cartForm.buildCart())
  }
}
