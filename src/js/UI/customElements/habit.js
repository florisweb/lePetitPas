// Create a class for the element
export default class HabitElement extends HTMLElement {
  static observedAttributes = ["finished"];
  #habit;
  constructor(_habit) {
    super();
    // this.attachShadow({ mode: 'open' });
    // this.shadowRoot.innerHTML = ``;
    this.#habit = _habit;
  }


  connectedCallback() {
    console.log("Custom element added to page.");

    this.innerHTML = `
      <div class="statusHolder">
        <div class="statusRing"></div>
      </div>
      <div class="title">Piano spelen</div>
      <div class="subTitle">15:00 - 5 day streak</div>
    `;
    this.#fillData();
    this.querySelector('.statusHolder').addEventListener('click', () => {
      this.setAttribute('finished', this.getAttribute('finished') === 'true' ? false : true);
    })

  }
  #fillData() {
    this.querySelector('.title').innerHTML = this.#habit.name; // FIXME
  }

  disconnectedCallback() {
    console.log("Custom element removed from page.");
  }

  connectedMoveCallback() {
    console.log("Custom element moved with moveBefore()");
  }

  adoptedCallback() {
    console.log("Custom element moved to new page.");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`Attribute ${name} has changed.`);
  }
}

customElements.define("habit-element", HabitElement);