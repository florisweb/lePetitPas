
import HabitManager from '../data/habitManager.js';
import DatePlus from '../datePlus.js';
import HabitList from './habitList.js';
import { HabitStateSectionConstructors } from './customElements/habitStateSections.js';
import App from '../app.js';
import QuestionPopup from './customElements/questionPopup.js';


export default class HabitInfoPanel extends HTMLElement {
  static observedAttributes = ["openState"];

  #openStateResolver;
  #youSureDeletePopup;

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

    this.#youSureDeletePopup = new QuestionPopup();
    this.#youSureDeletePopup.positiveButtonText = 'Delete';
  }

  open(_habit, _date) {
    this.#habit = _habit;
    this.#date = _date;
    this.stateSection = new HabitStateSectionConstructors[_habit.valueType];
    this.stateSection.addEventListener('stateChange', async (_e) => {
      await this.#habit.setStateWithAnimation(_e.detail);
      this.#update();
    });
    this.append(this.stateSection);
    this.#update();

    App.curOpenPanel = this;
    return new Promise((resolve) => this.#openStateResolver = resolve);
  }
  close() {
    if (!this.openState) return;
    this.openState = false;
    this.#habit?.planetObject.deFocus();
    this.#openStateResolver(false);
    this.stateSection.remove();
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
      </div>
    `;


    document.body.append(this.#youSureDeletePopup);

    this.querySelector('.infoButton').addEventListener('click', async () => {
      await App.habitOverviewPanel.open(this.#habit, this.#date);
      App.curOpenPanel = this;
    });

    this.querySelector('.skipButton').addEventListener('click', async () => {
      await this.#habit.setSkipStateOnDate(this.#date);
      this.#update();
    });

    this.querySelector('.deleteButton').addEventListener('click', async () => {
      this.#youSureDeletePopup.title = 'Are you sure?';
      this.#youSureDeletePopup.text = `Are you sure you want to delete ${this.#habit.name}? This action is irreversible.`;
      let answer = await this.#youSureDeletePopup.open();
      if (!answer) return;
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
    this.stateSection.updateState(this.#habit, this.#date);

    this.querySelector('.habitNameHolder').innerHTML = this.#habit.name;
    this.querySelector('.habitDescriptionHolder').innerHTML = this.#habit.description;

    let src = '';
    switch (this.#habit.type) {
      case "inactiveVolcano": src = './images/inactiveVolcanoIcon.png'; break;
      case "rose": src = './images/roseIcon.png'; break;
      default:
      case "activeVolcano": src = './images/activeVolcanoIcon.png'; break;
    }
    this.querySelector('.habitIconHolder').setAttribute('src', src);
  }
}

customElements.define("habit-info-panel", HabitInfoPanel);