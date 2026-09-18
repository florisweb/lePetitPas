export default class Habit {
	name = '' + Math.random();
	type = 'vulcano';  // Vulcano, Rose...
	valueType = 'check'; // check: 0, 1. Count: 0 ... n, 


	createDate = new Date();

	todoOnDate(_date) {
		return true; // TODO
	}

}