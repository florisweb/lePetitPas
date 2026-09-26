
import DatePlus from '../../datePlus.js';
// Create a class for the element
export default class CalendarMonthElement extends HTMLElement {
  static observedAttributes = [];

  
  #date;
  set date(_date) { // Only the month and year will be used
    this.#date = new DatePlus(_date);
    this.#date.setDate(1);
    this.#updateDayElements();
  }
  get date() {
    return this.#date;
  }

  #dayContentsBuilder = (_date, _inCurMonth) => {
    let element = document.createElement('div');
    element.innerHTML = _date.getDate();
    return element;
  };
  constructor({dayContentsBuilder} = {}) {
    super();
    this.#dayContentsBuilder = dayContentsBuilder || this.#dayContentsBuilder;
  }

 
  connectedCallback() {
    for (let d = 0; d < 7; d++)
    {
      let element = document.createElement('div');
      element.className = 'day header';
      element.innerHTML = DatePlus.dayNames[(d + 1) % 7].substr(0, 2);
      this.appendChild(element);
    } 

    for (let w = 0; w < 5; w++)
    {
      for (let d = 0; d < 7; d++)
      {
        let element = document.createElement('div');
        element.classList.add('day');
        this.appendChild(element);
      } 
    }
    this.date = new Date();
  }

  #updateDayElements() {
    let monthOffset = this.#date.getDay() - 1; // Start on monday
    if (monthOffset < 0) monthOffset += 7;
    const daysInMonth = this.#date.daysInMonth;

    let dayElements = this.querySelectorAll('.day:not(.header)');
    for (let i = 0; i < dayElements.length; i++)
    {
      let curDate = new Date(this.#date.getTime() + 1000 * 60 * 60 * 24 * (i - monthOffset));
      let inCurMonth = !(i < monthOffset || i >= monthOffset + daysInMonth);
      dayElements[i].classList.toggle('otherMonth', !inCurMonth);
      dayElements[i].innerHTML = ``;
      dayElements[i].append(this.#dayContentsBuilder(curDate, inCurMonth))
    }
  }


  update(_date) {
    this.date = _date;
  }
}


customElements.define("calendar-month", CalendarMonthElement);