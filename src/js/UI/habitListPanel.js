import HabitManager from '../data/habitManager.js';
import DatePlus from '../datePlus.js';
import HabitList from './habitList.js';
import App from '../app.js';
import HorizontalInfiniteScroller from './customElements/horizontalInfiniteScroller.js';


export default class HabitListPanel extends HTMLElement {
  static observedAttributes = [];

  #date = new DatePlus();
  set date(_date) {
    this.#date = new DatePlus(_date);
    this.pageHolder.resetRelOffset();
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

    this.pageHolder = new HorizontalInfiniteScroller({createPage: (_relPageIndex) => {
      let dateHolder = document.createElement('div');
      dateHolder.className = 'dateHolder panelTitle';
      let habitList = new HabitList([]);
      let pageContents = [
        dateHolder,
        habitList
      ];

      pageContents.infScroll_updateContents = (_relPos) => {
        let curDate = new DatePlus(this.#date.getTime() + _relPos * 24 * 60 * 60 * 1000);
        habitList.date = curDate;
        habitList.habits = HabitManager.getHabitsOnDate(curDate);
        dateHolder.innerHTML = curDate.getDayName() + ' ' + curDate.getDate() + ' ' + curDate.getMonthName();
      }

      return pageContents;
    }});
  }


  async connectedCallback() {
    this.classList.add('UIPanel');

    this.append(this.pageHolder);
    
    this.pageHolder.mainPage[1].addEventListener('onBodyClick', async (_event) => { // Bubbles form habits 
      let curDate = new DatePlus(this.#date.getTime() + this.pageHolder.curOffset * 24 * 60 * 60 * 1000);
      await App.habitInfoPanel.open(_event.detail.habit, curDate);
      this.open();
      this.#update();
    });

    this.pageHolder.mainPage[1].addEventListener('onHabitCreateButtonClick', async () => {
      let newHabit = await App.habitEditPanel.open();
      this.open();
      this.#update();

      if (!newHabit) return;
      let habitObject = App.simulation.planet.addHabitObject(newHabit); 
      App.simulation.camera.putObjectInFocus(habitObject);
      setTimeout(() => App.simulation.camera.deFocus(), 3500);
    });
  }

  #update() {
    this.pageHolder.update();
  }
}

customElements.define("habit-list-panel", HabitListPanel);