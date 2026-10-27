/*
  Oak: before/after comparison slider (sections/before-after-slider.liquid).
  The range input sets the position for keyboard and screen reader users. Mouse, pen and touch drag on the
  frame instead, so the handle follows the pointer exactly and vertical swipes still scroll the page.
*/
if (!customElements.get('before-after-slider')) {
  class BeforeAfterSlider extends HTMLElement {
    connectedCallback() {
      this.range = this.querySelector('.ba-slider__range');
      this.frame = this.querySelector('.ba-slider__frame');
      if (!this.range || !this.frame) return;

      this.onInput = () => this.setPosition(this.range.value);
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerUp = this.onPointerUp.bind(this);

      this.range.addEventListener('input', this.onInput);
      this.frame.addEventListener('pointerdown', this.onPointerDown);
      this.frame.addEventListener('pointermove', this.onPointerMove);
      this.frame.addEventListener('pointerup', this.onPointerUp);
      this.frame.addEventListener('pointercancel', this.onPointerUp);

      this.setPosition(this.range.value);
    }

    disconnectedCallback() {
      if (!this.range || !this.frame) return;
      this.range.removeEventListener('input', this.onInput);
      this.frame.removeEventListener('pointerdown', this.onPointerDown);
      this.frame.removeEventListener('pointermove', this.onPointerMove);
      this.frame.removeEventListener('pointerup', this.onPointerUp);
      this.frame.removeEventListener('pointercancel', this.onPointerUp);
    }

    onPointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      this.pointerId = event.pointerId;
      this.moved = false;
      this.frame.setPointerCapture(event.pointerId);
      this.range.focus({ preventScroll: true });
      // A touch might be the start of a vertical scroll, so wait for it to move sideways or lift
      if (event.pointerType === 'mouse') this.updateFromPointer(event);
    }

    onPointerMove(event) {
      if (event.pointerId !== this.pointerId) return;
      this.moved = true;
      this.updateFromPointer(event);
    }

    onPointerUp(event) {
      if (event.pointerId !== this.pointerId) return;
      if (event.type === 'pointerup' && !this.moved) this.updateFromPointer(event);
      this.pointerId = null;
    }

    updateFromPointer(event) {
      const rect = this.frame.getBoundingClientRect();
      if (!rect.width) return;
      const percent = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
      this.range.value = percent;
      this.setPosition(percent);
    }

    setPosition(value) {
      this.style.setProperty('--ba-pos', `${value}%`);
    }
  }

  customElements.define('before-after-slider', BeforeAfterSlider);
}
