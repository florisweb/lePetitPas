import DataObject from './dataObject.js';
export default class Habit extends DataObject {
	name = '' + Math.random();
	type = 'vulcano';  // Vulcano, Rose...
	valueType = 'check'; // check: 0, 1. Count: 0 ... n, 


	createDate = new Date();

	constructor() {
		super();
		console.log('create habit', ...arguments);
	}

	todoOnDate(_date) {
		return true; // TODO
	}

	export() {
		return {
			name: this.name,
			type: this.type,
			valueType: this.valueType,
			createDate: this.createDate.getTime(),
		}
	}

}
window.Habit = Habit;