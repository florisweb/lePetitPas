
import HabitManager from '../data/habitManager.js';
import DatePlus from '../datePlus.js';
import HabitList from './habitList.js';
// Create a class for the element
export default class HabitOverviewPanel extends HTMLElement {
  static observedAttributes = ["openState"];

  #openStateResolver;

  #habit;
  #date = new Date();

  get openState() {
    return this.getAttribute('openState') === 'true';
  }
  set openState(_openState) {
    this.setAttribute('openState', _openState);
  }
  
  constructor() {
    super();
  }

  open(_habit, _date) {
    this.#habit = _habit;
    this.#date = _date;
    this.stateDial = new HabitStateDialConstructors[_habit.valueType];
    this.append(this.stateDial);
    this.#update();

    App.curOpenPanel = this;
    return new Promise((resolve) => this.#openStateResolver = resolve);
  }
  close() {
    if (!this.openState) return;
    this.openState = false;
    this.#habit?.planetObject.deFocus();
    this.#openStateResolver(false);
    this.stateDial.remove();
  }

  connectedCallback() {
    this.classList.add('UIPanel');
    this.openState = false;
    this.innerHTML = `
      <img class='habitIconHolder'>
      <div class='habitNameHolder panelTitle'></div>
    `;
  }

  #update() {
   
  }
}

customElements.define("habit-overview-panel", HabitOverviewPanel);