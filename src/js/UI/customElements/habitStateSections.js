import App from '../../app.js';
import { animateSigmoidally } from '../../animator.js';
import Habit from '../../data/habit.js';

export class HabitStateSection extends HTMLElement {
  constructor() {
    super();
  }
  #curPerc = 0;
  _curState;

  reset() {
    this.#curPerc = 0;
    this.classList.remove('habitSkipped');
  }

  connectedCallback() {
    this.classList.add('habitStateSection')
    this.innerHTML = `
      <div class='leftPanel'></div>
      <div class='progressRingHolder'>
        <div class='progressRing backgroundTrack'>
          <div class='valueHolder'></div>
          <div class='valueSubTextHolder'></div>
        </div>
        <div class='progressRing percVisualizer'></div>
      </div>
      <div class='rightPanel'></div>
    `; 
    this.#updateClipPath(this.#curPerc);
  }


  animateToPerc(_perc) {
    let oldPerc = this.#curPerc;
    this.#curPerc = _perc;
    let newPerc = _perc;
    animateSigmoidally(500, (_perc) => this.#updateClipPath(oldPerc + _perc * (newPerc - oldPerc)));
  }

  #updateClipPath(_perc) {
    let clipPath = 'polygon(50% 50%, ';
    let rad = 50; // %
    let maxAngle = 2 * Math.PI * _perc;
    const angleOffset = -0.5 * Math.PI;
    let stepSize = 0.01;
    for (let a = 0; a < maxAngle + stepSize; a += stepSize)
    {
      if (a !== 0) clipPath += ',';
      let curPos = [
        rad * (1 + Math.cos(a + angleOffset)),
        rad * (1 + Math.sin(a + angleOffset))
      ];
      clipPath += curPos[0] + '% ' + curPos[1] + '%';
    }
    this.querySelector('.progressRing.percVisualizer').style.clipPath = clipPath + ', 50% 50%)';
  }


  updateState(_habit, _date) {
    let state = _habit.getStateOnDate(_date);
    this._curState = state;
    let stateText = '';
    let stateSubText = '';

    this.classList.toggle('habitSkipped', state == Habit.HABIT_SKIPPED_VALUE);
    if (state === Habit.HABIT_SKIPPED_VALUE)
    {
      stateText = 'X';
      stateSubText = 'SKIPPED';
    }
    this.querySelector('.valueHolder').innerHTML = stateText;
    this.querySelector('.valueSubTextHolder').innerHTML = stateSubText;

    this.animateToPerc(_habit.getStatePercOnDate(_date));
  }
}

export class HabitStateSection_check extends HabitStateSection {
  constructor() {
    super();
  }
  
  connectedCallback() {
    super.connectedCallback();
    let leftPanel = this.querySelector('.leftPanel');
    let rightPanel = this.querySelector('.rightPanel');
    leftPanel.innerHTML = `<img class='iconButton' src='images/resetIcon.png'>`;
    rightPanel.innerHTML = `<img class='iconButton' src='images/checkIcon.png'>`;
    
    leftPanel.addEventListener('click', () => {
      this.dispatchEvent(
        new CustomEvent("stateChange", {detail: false})
      );
    });
    rightPanel.addEventListener('click', () => {
      this.dispatchEvent(
        new CustomEvent("stateChange", {detail: true})
      );
    });
  }
  
  updateState(_habit, _date) {
    super.updateState(_habit, _date);
    
    let state = _habit.getStateOnDate(_date) ?? false;
    this.querySelector('.leftPanel').classList.toggle('disabled', state === false);
    this.querySelector('.rightPanel').classList.toggle('disabled', state !== false);
    if (state === Habit.HABIT_SKIPPED_VALUE) return;
    
    this.querySelector('.valueHolder').innerHTML = (state ? 1 : 0) + '/1';
    this.querySelector('.valueSubTextHolder').innerHTML = state ? 'COMPLETED' : '';
  }
}

customElements.define("habit-state-section-check", HabitStateSection_check);


export class HabitStateSection_count extends HabitStateSection {
  constructor() {
    super();
  }
  connectedCallback() {
    super.connectedCallback();
    let leftPanel = this.querySelector('.leftPanel');
    let rightPanel = this.querySelector('.rightPanel');
    leftPanel.innerHTML = `<div class='textButton'>-</div>`;
    rightPanel.innerHTML = `<div class='textButton'>+</div>`;

    leftPanel.addEventListener('click', () => {
      this.dispatchEvent(
        new CustomEvent("stateChange", {detail: (this._curState ?? 0) - 1})
      );
    });
    rightPanel.addEventListener('click', () => {
      this.dispatchEvent(
        new CustomEvent("stateChange", {detail: (this._curState ?? 0) + 1})
      );
    });
  }


  
  updateState(_habit, _date) {
    super.updateState(_habit, _date);
    let state = _habit.getStateOnDate(_date) ?? 0;
    
    this.querySelector('.leftPanel').classList.toggle('disabled', state <= 0 || state === Habit.HABIT_SKIPPED_VALUE);
    this.querySelector('.rightPanel').classList.toggle('disabled', state >= _habit.valueTypeConfig.maxCount || state === Habit.HABIT_SKIPPED_VALUE);

    if (state === Habit.HABIT_SKIPPED_VALUE) return;
    
    this.querySelector('.valueHolder').innerHTML = state + '/' + _habit.valueTypeConfig.maxCount;
    this.querySelector('.valueSubTextHolder').innerHTML = state === _habit.valueTypeConfig.maxCount ? 'COMPLETED' : '';
  }
}

customElements.define("habit-state-section-count", HabitStateSection_count);


export const HabitStateSectionConstructors = {
  "check": HabitStateSection_check,
  "count": HabitStateSection_count,
}