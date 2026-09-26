
import HabitManager from '../data/habitManager.js';
import DatePlus from '../datePlus.js';
import HabitList from './habitList.js';
import { HabitStateDialConstructors } from './customElements/habitStateDials.js';
import App from '../app.js';


export default class HabitInfoPanel extends HTMLElement {
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
      <div class='habitDescriptionHolder'></div>
      <img src='./images/editIcon.png' class='headerButton editButton'>
      <img src='./images/removeIcon.png' class='headerButton deleteButton'>
      <div class='buttonHolder'>
        <button class='infoButton'>Info</button>
        <button class='skipButton'>Skip</button>
        <button class='completeButton' filled>Complete</button>
      </div>
    `;



    this.stateDial = this.querySelector('habit-state-dial');
    

    this.querySelector('.infoButton').addEventListener('click', async () => {
      await App.habitOverviewPanel.open(this.#habit, this.#date);
      App.curOpenPanel = this;
    });

    this.querySelector('.skipButton').addEventListener('click', async () => {
      await this.#habit.setSkipStateOnDate(this.#date);
      this.#update();
    });
    this.querySelector('.completeButton').addEventListener('click', async () => {
      await this.#habit.setStateWithAnimation(true, this.#date); // TEMP
      this.#update();
    });

    this.querySelector('.deleteButton').addEventListener('click', async () => {
      await this.#habit.delete();
      this.close();
    });
    this.querySelector('.editButton').addEventListener('click', async () => {
      let habit = await App.habitEditPanel.openEdit(this.#habit);
      App.curOpenPanel = this;
      if (!habit) return;
      this.#habit = habit;
      this.#update();
    });
  }

  #update() {
    this.#habit.planetObject?.focus();
    this.stateDial.updateState(this.#habit, this.#date);

    this.querySelector('.habitNameHolder').innerHTML = this.#habit.name;
    this.querySelector('.habitDescriptionHolder').innerHTML = this.#habit.description;

    let src = '';
    switch (this.#habit.type) {
      case "inactiveVulcano": src = './images/inactiveVulcanoIcon.png'; break;
      case "rose": src = './images/roseIcon.png'; break;
      default:
      case "activeVulcano": src = './images/activeVulcanoIcon.png'; break;
    }
    this.querySelector('.habitIconHolder').setAttribute('src', src);
  }
}

customElements.define("habit-info-panel", HabitInfoPanel);