import HabitManager from '../data/habitManager.js';
import DatePlus from '../datePlus.js';
import HabitList from './habitList.js';
// Create a class for the element
export default class HabitListPanel extends HTMLElement {
  static observedAttributes = [];
  #prevHabitList;
  #curHabitList;
  #nextHabitList;
  #habitLists = [];

  #date = new DatePlus();
  set date(_date) {
    console.log('set date', _date);
    this.#date = new DatePlus(_date);
    this.#update();
  }
  get date() {
    return this.#date;
  }

  get openState() {
    return this.getAttribute('openState') === 'true';
  }
  set openState(_openState) {
    this.setAttribute('openState', _openState);
  }

  open() {
    App.curOpenPanel = this;
  }

  
  constructor() {
    super();
    this.#prevHabitList = new HabitList([]);
    this.#curHabitList = new HabitList([]);
    this.#curHabitList.addEventListener('onBodyClick', async (_event) => { // Bubbles form habits 
      await App.habitInfoPanel.open(_event.detail.habit);
      this.open();
      this.#update();
    });
    this.#curHabitList.addEventListener('onHabitCreateButtonClick', () => {console.log('onHabitCreate-bubbled', this)});

    this.#nextHabitList = new HabitList([]);
    this.#habitLists = [this.#prevHabitList, this.#curHabitList, this.#nextHabitList];
  }


  async connectedCallback() {
    this.classList.add('UIPanel');

    this.innerHTML = `
      <div class='tabHolder'>
        <div class='dayTab prev'>
          <div class='dateHolder panelTitle'></div>
        </div>
        <div class='dayTab cur'>
          <div class='dateHolder panelTitle'></div>
        </div>
        <div class='dayTab next'>
          <div class='dateHolder panelTitle'></div>
        </div>
      </div>
    `;
    for (let i = 0; i < this.#habitLists.length; i++)
    {
      this.querySelectorAll('.dayTab')[i].append(this.#habitLists[i]);
    }
    
    this.addEventListener('scroll', () => this.#onScroll());
    this.scrollLeft = 1 / 3 * this.scrollWidth;
    await HabitManager.isSetUp;
    this.#update();
  }

  #update() {  
    for (let i = 0; i < this.#habitLists.length; i++)
    {
      let curDate = new DatePlus(this.#date.getTime() + (i - 1) * 24 * 60 * 60 * 1000);
      this.#habitLists[i].date = curDate;
      this.#habitLists[i].habits = HabitManager.getHabitsOnDate(curDate);
      this.querySelectorAll('.dayTab .dateHolder')[i].innerHTML = curDate.getDayName() + ' ' + curDate.getDate() + ' ' + curDate.getMonthName();
    }
  }

  #onScroll() {
    let perc = this.scrollLeft / this.scrollWidth;
    const margin = 0.001;
    if (perc < margin)
    {
      this.scrollLeft = 1 / 3 * this.scrollWidth;
      this.date = new DatePlus(this.#date.getTime() - 24 * 60 * 60 * 1000);
    } else if (perc > 2 / 3 - margin)
    {
      this.scrollLeft = 1 / 3 * this.scrollWidth;
      this.date = new DatePlus(this.#date.getTime() + 24 * 60 * 60 * 1000);
    }
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