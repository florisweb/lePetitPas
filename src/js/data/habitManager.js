
import DataManager from './dataManager.js';
import Habit from './habit.js';

const HabitManager = new class extends DataManager {
	constructor() {
		super({type: "habits", dataToObject: (data) => new Habit(data)});
		window.HabitManager = this;
	}


	getHabitsOnDate(_date) {
		return this._data.filter((h) => h.todoOnDate(_date));
	}

}



export default HabitManager;