export default class ProgressDial extends HTMLElement {
  #progressBar;

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
  }


  animateToPerc(_perc, _duration = 300) {
    this.#progressBar.style.transition = `stroke-dasharray ${_duration}ms ease`;
    this.#progressBar.style.strokeDasharray = `${Math.round(_perc * 100)} 100`;
  }
}

customElements.define("progress-dial", ProgressDial);
