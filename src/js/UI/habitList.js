
import HabitElement from './customElements/habit.js';
import HabitCreateButtonElement from './customElements/HabitCreateButton.js';
// Create a class for the element
export default class HabitList extends HTMLElement {
  static observedAttributes = [];
  #contentHolder;
  #habits = [];
  #date = new Date();
  set date(_date) {
    this.#date = _date;
    this.#update();
  }

  set habits(_habits) {
    this.#habits = _habits || [];
    this.#update();
  }

  constructor(_habits) {
    super();
    // this.attachShadow({ mode: 'open' });
    // this.shadowRoot.innerHTML = ``;
    this.habits = _habits;
  }

  #update() {
    this.innerHTML = '';
    for (let habit of this.#habits)
    {
      this.append(new HabitElement(habit, this.#date));
    }
    this.append(new HabitCreateButtonElement());

  }


  connectedCallback() {
    console.log("Custom element added to page.");

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

customElements.define("habit-list", HabitList);