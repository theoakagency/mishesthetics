import { executeJSmodules } from 'util.misc'

document.addEventListener('shopify:section:load', function (event) {
  const sectionId = event.detail.sectionId
  const scripts = document.querySelectorAll(`[data-section-id="${sectionId}"] script[type="module"]`)
  executeJSmodules(scripts)
})
