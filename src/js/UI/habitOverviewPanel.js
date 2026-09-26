
import DatePlus from '../datePlus.js';

import CalendarMonthElement from './customElements/calendarMonth.js';
import HabitProgressDial from './customElements/habitProgressDial.js';
import HorizontalInfiniteScroller from './customElements/horizontalInfiniteScroller.js';

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
    this.#date = new DatePlus(_date);
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
      <div class='calendarHolder'></div>
    `;


    this.pageHolder = new HorizontalInfiniteScroller({
      createPage: (_relPageIndex) => {
        let calendarMonth = new CalendarMonthElement({dayContentsBuilder: (_date, _inCurMonth) => {
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

        calendarMonth.infScroll_updateContents = (_relPos) => {
          let curDate = new DatePlus(this.#date);
          curDate.setMonth(curDate.getMonth() + _relPos);
          calendarMonth.update(curDate);
        }

        return calendarMonth;
      },
      onOffsetChange: (_newOffset) => {
        let curDate = new DatePlus(this.#date);
        curDate.setMonth(curDate.getMonth() + _newOffset);
        this.#updatePageTitle(curDate);
      }
    });

    this.querySelector('.calendarHolder').append(this.pageHolder);
  }

  #updatePageTitle(_date = this.#date) {
    this.querySelector('.habitNameHolder').innerHTML = 
      this.#habit.name + ' - ' + 
      _date.getMonthName() + ' ' + 
      (_date.getFullYear() !== this.#date.getFullYear() ? _date.getFullYear() : '');
  }

  #update() {
    this.pageHolder.update();
    this.#updatePageTitle(this.#date);

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

customElements.define("habit-overview-panel", HabitOverviewPanel);