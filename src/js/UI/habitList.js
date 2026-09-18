import HabitManager from '../habitManager.js';
import HabitElement from './customElements/habit.js';
import HabitCreateButtonElement from './customElements/HabitCreateButton.js';
// Create a class for the element
export default class HabitList extends HTMLElement {
  static observedAttributes = [];
  #contentHolder;
  
  constructor() {
    super();
    console.log('hey');
    // this.attachShadow({ mode: 'open' });
    // this.shadowRoot.innerHTML = ``;
    
  }


  connectedCallback() {
    console.log("Custom element added to page.");

    this.#updateContents();
  }

  #updateContents() {

    let habits = HabitManager.getHabitsOnDate(new Date());
    for (let habit of habits)
    {
      this.append(new HabitElement(habit));
    }
    this.append(new HabitCreateButtonElement());
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