import App from '../../app.js';
// Create a class for the element
export default class HabitElement extends HTMLElement {
  static observedAttributes = ["curState"];
  #habit;
  #date;
  get habit() {
    return this.#habit;
  }

  constructor(_habit, _date) {
    super();
    // this.attachShadow({ mode: 'open' });
    // this.shadowRoot.innerHTML = ``;
    this.#date = _date || new Date();
    this.#habit = _habit;
  }


  connectedCallback() {
    this.innerHTML = `
      <div class="statusHolder">
        <div class="statusRing"></div>
      </div>
      <div class="title">Piano spelen</div>
      <div class="subTitle">15:00 - 5 day streak</div>
    `;
    this.#fillData();
    this.querySelector('.statusHolder').addEventListener('click', () => {
      let oldState = this.getAttribute('curState');
      let newState;
      
      switch (this.habit.valueType)
      {
        case "check":
          newState = oldState === 'true' ? false : true;
          break;
        case "count":
          let curState = parseInt(oldState) ?? 0;
          newState = curState + 1;
          if (newState > this.habit.valueTypeConfig.maxCount) newState = 0;
          break;
      }

      this.setAttribute('curState', newState);
      this.#habit.setStateWithAnimation(newState, this.#date);

      this.#fillData();
    });

    this.addEventListener('click', (_e) => {
      if (_e.target.className.includes('status')) return;
      this.dispatchEvent(
        new CustomEvent("onBodyClick", {
          detail: this,
          bubbles: true,
          composed: true
        })
      );
    });
  }
  #fillData() {
    this.querySelector('.title').innerHTML = this.#habit.name; // FIXME
    this.querySelector('.subTitle').innerHTML = this.#habit.getStreakLengthOnDate(this.#date) + ' day streak'; // FIXME
    this.setAttribute('curState', this.#habit.getStateOnDate(this.#date));
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