import HabitManager from '../data/habitManager.js';
import DatePlus from '../datePlus.js';
import HabitList from './habitList.js';
// Create a class for the element
export default class HabitListPanel extends HTMLElement {
  static observedAttributes = [];
  #habitList;
  #date = new DatePlus();
  set date(_date) {
    this.#date = new DatePlus(_date);
    this.#update();
  }
  get date() {
    return this.#date;
  }
  
  constructor() {
    super();
    this.#habitList = new HabitList([]);
  }


  connectedCallback() {
    this.innerHTML = `
      <div class='dateHolder'>test</div>
    `;
    this.append(this.#habitList);
    this.#update();
  }

  async #update() {
    await HabitManager.isSetUp;
    this.#habitList.date = this.#date;
    this.#habitList.habits = HabitManager.getHabitsOnDate(this.#date);
    this.querySelector('.dateHolder').innerHTML = this.#date.getDayName() + ' ' + this.#date.getDate() + ' ' + this.#date.getMonthName();
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

customElements.define("habit-list-panel", HabitListPanel);