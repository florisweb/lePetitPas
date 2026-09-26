export default class ProgressDial extends HTMLElement {
  #progressBar;
  #curPerc = 0;

  connectedCallback() {
    this.classList.add('habitStateDial')
    this.innerHTML = `
       <svg viewBox="0 0 100 100">
        <circle
          class="progressBackground"
          cx="50"
          cy="50"
          r="40"
          pathLength="100"
        />

        <circle
          class="progressBar"
          cx="50"
          cy="50"
          r="40"
          pathLength="100"
        />
      </svg>
    `; 
    this.#progressBar = this.querySelector('.progressBar');
    this.animateToPerc(this.#curPerc);
  }


  animateToPerc(_perc, _duration = 300) {
    this.#curPerc = _perc;
    if (!this.#progressBar) return;
    this.#progressBar.style.transition = `stroke-dasharray ${_duration}ms ease`;
    this.#progressBar.style.strokeDasharray = `${Math.round(_perc * 100)} 100`;
  }
}

customElements.define("progress-dial", ProgressDial);
