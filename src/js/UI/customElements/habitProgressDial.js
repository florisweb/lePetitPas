import ProgressDial from './progressDial.js';
export default class HabitProgressDial extends ProgressDial {
  
  update(_habit, _date) {
    if (!_habit) return;
    this.animateToPerc(_habit.getStatePercOnDate(_date));
    this.setAttribute('curState', _habit.getStateOnDate(_date));
    this.setAttribute('fullyCompleted', _habit.wasFullyCompletedOnDate(_date));
  }
}

customElements.define("habit-progress-dial", HabitProgressDial);
