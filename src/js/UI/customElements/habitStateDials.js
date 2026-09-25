import App from '../../app.js';
import { animateSigmoidally } from '../../animator.js';
import Habit from '../../data/habit.js';

export class HabitStateDial extends HTMLElement {
  constructor() {
    super();
  }
  #curPerc = 0;

  reset() {
    this.#curPerc = 0;
    this.classList.remove('habitSkipped');
  }

  connectedCallback() {
    this.classList.add('habitStateDial')
    this.innerHTML = `
      <div class='progressRing backgroundTrack'>
        <div class='valueHolder'></div>
        <div class='valueSubTextHolder'></div>
      </div>
      <div class='progressRing percVisualizer'></div>
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

export class HabitStateDial_check extends HabitStateDial {
  constructor() {
    super();
  }
  
  
  updateState(_habit, _date) {
    super.updateState(_habit, _date);
    let state = _habit.getStateOnDate(_date) ?? 0;
    if (state === Habit.HABIT_SKIPPED_VALUE) return;
    
    this.querySelector('.valueHolder').innerHTML = (state ? 1 : 0) + '/1';
    this.querySelector('.valueSubTextHolder').innerHTML = state ? 'COMPLETED' : '';
  }
}

customElements.define("habit-state-dial-check", HabitStateDial_check);


export class HabitStateDial_count extends HabitStateDial {
  constructor() {
    super();
  }
  
  updateState(_habit, _date) {
    super.updateState(_habit, _date);
    let state = _habit.getStateOnDate(_date) ?? 0;
    if (state === Habit.HABIT_SKIPPED_VALUE) return;
    
    this.querySelector('.valueHolder').innerHTML = state + '/' + _habit.valueTypeConfig.maxCount;
    this.querySelector('.valueSubTextHolder').innerHTML = state === _habit.valueTypeConfig.maxCount ? 'COMPLETED' : '';
  }
}

customElements.define("habit-state-dial-count", HabitStateDial_count);


export const HabitStateDialConstructors = {
  "check": HabitStateDial_check,
  "count": HabitStateDial_count,
}