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
  }

  connectedCallback() {
    this.classList.add('habitStateDial')
    this.innerHTML = `
      <div class='progressRing backgroundTrack'></div>
      <div class='progressRing percVisualizer'></div>
    `; 

    this.#updateClipPath(this.#curPerc);
  }
  updateState(_habit, _date) {
    let state = _habit.getStateOnDate(_date);
    let perc = 0;
    if (state == Habit.HABIT_SKIPPED_VALUE)
    {
      perc = 1;
    } else {
      perc = _habit.getCompletionPercOnDate(_date);
    }

    this.animateToPerc(perc);
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
}

customElements.define("habit-state-dial", HabitStateDial);