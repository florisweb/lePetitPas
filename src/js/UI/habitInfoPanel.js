
import HabitManager from '../data/habitManager.js';
import DatePlus from '../datePlus.js';
import HabitList from './habitList.js';
// Create a class for the element
export default class HabitInfoPanel extends HTMLElement {
  static observedAttributes = ["openState"];

  #openStateResolver;

  #habit;
  set habit(_habit) {
    this.#habit = _habit;
    this.#update();
  }
  get habit() {
    return this.#habit;
  }
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
    this.habit = _habit;
    this.#date = _date;
    App.curOpenPanel = this;
    return new Promise((resolve) => this.#openStateResolver = resolve);
  }
  close() {
    this.openState = false;
    this.#openStateResolver(false);
  }


  connectedCallback() {
    this.classList.add('UIPanel');
    this.openState = false;
    this.innerHTML = `
      <img class='habitIconHolder'>
      <div class='habitNameHolder panelTitle'></div>
      <button class='editButton' filled>edit</button>
      <button class='deleteButton' filled>delete</button>
      <button class='skipButton' filled>Skip</button>
    `;
    this.querySelector('.skipButton').addEventListener('click', () => this.habit.setSkipStateOnDate(this.#date));
    this.querySelector('.deleteButton').addEventListener('click', async () => {
      await HabitManager.remove(this.habit.id)
      this.close();
    });
    this.querySelector('.editButton').addEventListener('click', async () => {
      let habit = await App.habitEditPanel.openEdit(this.habit);
      if (!habit) return;
      this.habit = habit;
      App.curOpenPanel = this;
    });
  }

  async #update() {
    this.querySelector('.habitNameHolder').innerHTML = this.habit.name;
    this.querySelector('.habitIconHolder').setAttribute('src', this.habit.type === 'vulcano' ? './images/vulcanoIcon.png' : './images/roseIcon.png');
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

customElements.define("habit-info-panel", HabitInfoPanel);