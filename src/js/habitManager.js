import Habit from './habit.js';
const HabitManager = new class {
	#habits = [new Habit(), new Habit()];

	getHabitsOnDate(_date) {
		return this.#habits.filter((h) => h.todoOnDate(_date));
	}


	constructor() {

	}



}


export default HabitManager;