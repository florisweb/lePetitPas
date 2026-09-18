
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


	update(_habit) {
		let index = this._data.findIndex((h) => h.id === _habit.id);
		if (index === -1)
		{
			this._data.push(_habit);
		} else {
			this._data[index] = _habit;
		}
		this.writeData();
	}

}



export default HabitManager;