import DataObject from './dataObject.js';
import HabitManager from './habitManager.js';


export default class Habit extends DataObject {
	static HABIT_SKIPPED_VALUE = "HABIT_SKIPPED";

	id = Math.round(Math.random() * 100000000);
	name = '';
	description = '';

	type = 'activeVulcano';  // activeVulcano, inactiveVulcano, rose...
	objectInfo = { // Specifies the information for rendering the planet object
		position: [0, 0],
	}

	valueType = 'check'; // check: 0, 1. count: 0 ... n, 
	valueTypeConfig = {};

	#stateHistory = []; // Format: {date, value}
	createDate = new Date();

	#planetObject;
	get planetObject() {
		return this.#planetObject;
	}

	get curState() {
		return this.getStateOnDate(new Date());
	}

	set curState(_newState) {
		return this.setStateOnDate(_newState, new Date())
	}

	setStateWithAnimation(_newState, _date = new Date()) {
		this.setStateOnDate(_newState, _date)
		this.#planetObject.playStateChangeAnimation(_newState);
	}
	
	panToPlanetObject() {
		camera.panToObject(this.#planetObject); // TODO proper link
	}
	resetStateHistory() {
		this.#stateHistory = [];
		HabitManager.update(this);
	}

	get curStreakLength() {
		return this.getStreakLengthOnDate(new Date());
	}
	get daysSinceLastCompletion() {
		let hist = this.#stateHistory.sort((a, b) => a.date < b.date);
		if (!hist[0]) return Infinity;
		return (new Date() - hist[0].date) / 1000 / 60 / 60 / 24;
	}

	getStreakLengthOnDate(_date) {
		let curPointerDate = new Date(_date.getTime() - 24 * 60 * 60 * 1000);
		let streakLength = 0;
		let curStateItem = this.#findLatestStateItemOnDate(curPointerDate);
		while (curStateItem?.value)
		{
			if (curStateItem.value !== Habit.HABIT_SKIPPED_VALUE) streakLength++;
			curPointerDate = new Date(curPointerDate.getTime() - 24 * 60 * 60 * 1000);
			curStateItem = this.#findLatestStateItemOnDate(curPointerDate);
		}

		let curState = this.getStateOnDate(_date);
		if (curState && curState !== Habit.HABIT_SKIPPED_VALUE) streakLength++;
		return streakLength;
	}

	#findLatestStateItemOnDate(_date) {
		let hist = this.#stateHistory.sort((a, b) => a.date < b.date);

		_date.setHours(0);
		_date.setMinutes(0);
		_date.setSeconds(0);
		_date.setMilliseconds(0);

		for (let hItem of hist)
		{
			if (hItem.date < _date.getTime()) continue;
			if (hItem.date >= _date.getTime() + 24 * 60 * 60 * 1000) continue;
			return hItem;
		}
	}

	getStateOnDate(_date) {
		let foundHistItem = this.#findLatestStateItemOnDate(_date);
		if (!foundHistItem)
		{
			switch (this.valueType)
			{
				case "check": return false;
			}
		} else {
			return foundHistItem.value;
		}
	}
	setStateOnDate(_newState, _date = new Date()) {
		let foundHistItem = this.#findLatestStateItemOnDate(_date);
		if (foundHistItem) // Update today's stateitem if it exists
		{
			foundHistItem.value = _newState;
		} else {
			this.#stateHistory.push({
				date: _date.getTime(),
				value: _newState
			});
		}
		HabitManager.update(this);
	}

	setSkipStateOnDate(_date) {
		return this.setStateOnDate(Habit.HABIT_SKIPPED_VALUE, _date);
	}



	constructor({id, name, description, type, valueType, valueTypeConfig, createDate, stateHistory, objectInfo} = {}) {
		super();
		this.id = id ?? this.id;
		this.name = name ?? this.name;
		this.description = description ?? this.description;
		this.type = type ?? this.type;
		this.valueType = valueType ?? this.valueType;
		this.valueTypeConfig = valueTypeConfig ?? this.valueTypeConfig;
		this.createDate = new Date(createDate) ?? this.createDate;
		this.#stateHistory = stateHistory || [];

		if (objectInfo)
		{
			this.objectInfo = objectInfo;
		} else {
			// this.objectInfo.position = [random() * Math.PI * 2, (random() * 0.3 + 0.1) * Math.PI];
			// let position = [random() * Math.PI * 2, (random() * 0.5 + 0.25) * Math.PI];
			this.objectInfo.position = [Math.random() * Math.PI * 2, (Math.random() * 0.3 + 0.1) * Math.PI];

			// --- Vulcano ---
			this.objectInfo.radius = 4;
			this.objectInfo.height = 5;
		}
	}

	setPlanetObject(_planetObject) {
		this.#planetObject = _planetObject;
		let perc = 0;
		if (this.curState) 
		{
			perc = 1;
		} else {
			perc = Math.max((7 - this.daysSinceLastCompletion) / 7 * 0.5, 0);
		}
		this.#planetObject.animateMeshToCompletionState(perc);
	}

	todoOnDate(_date) {
		return true; // TODO
	}

	export() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			type: this.type,
			valueType: this.valueType,
			valueTypeConfig: this.valueTypeConfig,
			createDate: this.createDate.getTime(),
			stateHistory: this.#stateHistory,
			objectInfo: this.objectInfo
		}
	}

}
window.Habit = Habit;