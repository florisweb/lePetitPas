import App from '../../app.js';

export default class HabitCreateButtonElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="statusHolder">
        <div class="statusRing">+</div>
      </div>
      <div class="title">Add habit</div>
    `;
    this.addEventListener('click', () => App.habitEditPanel.open());
  }
}

customElements.define("habit-create-button", HabitCreateButtonElement);