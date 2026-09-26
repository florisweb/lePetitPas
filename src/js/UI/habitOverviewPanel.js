
import DatePlus from '../datePlus.js';

import CalendarMonthElement from './customElements/calendarMonth.js';
import HabitProgressDial from './customElements/habitProgressDial.js';

// Create a class for the element
export default class HabitOverviewPanel extends HTMLElement {
  static observedAttributes = ["openState"];

  #openStateResolver;
  #calendarMonth;

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
    this.#update();

    App.curOpenPanel = this;
    return new Promise((resolve) => this.#openStateResolver = resolve);
  }
  close() {
    if (!this.openState) return;
    this.openState = false;
    this.#openStateResolver(false);
  }

  connectedCallback() {
    this.classList.add('UIPanel');
    this.openState = false;
    this.innerHTML = `
      <img class='habitIconHolder'>
      <div class='habitNameHolder panelTitle'></div>
    `;

    this.#calendarMonth = new CalendarMonthElement({dayContentsBuilder: (_date, _inCurMonth) => {
      let element = document.createElement('div');
      element.classList.add('progessHolder')
      let dateHolder = document.createElement('div');
      dateHolder.classList.add('dateHolder');
      dateHolder.innerHTML = _date.getDate();
      element.append(dateHolder);
      let dial = new HabitProgressDial();
      element.append(dial);
      if (!this.#habit) return element;
      dial.update(this.#habit, _date);
      return element;
    }});
    this.append(this.#calendarMonth);
  }

  #update() {
   this.#calendarMonth.update(this.#date);
  }
}

customElements.define("habit-overview-panel", HabitOverviewPanel);