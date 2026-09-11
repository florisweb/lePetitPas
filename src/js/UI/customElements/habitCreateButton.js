
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
  }
}

customElements.define("habit-create-button", HabitCreateButtonElement);