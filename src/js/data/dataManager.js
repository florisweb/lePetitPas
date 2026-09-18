import LocalDB from './localDB.js';

export default class DataManager {
	type;
	#dataToObject;
	_data = [];
	isSetUp;

	get data() {
		return this._data;
	}

	set data(_data) {
		this._data = _data;
		this.writeData();
	}

	set(_data) {
		this._data = _data;
		return this.writeData();
	}
	
	remove(_id) {
		this._data = this._data.filter((_item) => _item.id !== _id);
		return this.writeData();
	}

	#resolveSetUp;
	constructor({type, dataToObject}) {
		this.isSetUp = new Promise((resolve) => this.#resolveSetUp = resolve);
		this.type = type;
		this.#dataToObject = dataToObject;
		LocalDB.ready().then(() => this.setup());
	}

	async setup() {
		let response = await LocalDB.getData(this.type);
		if (!response) return console.warn('An error accured while loading ', this.type, response);		
		this.importData(response, false);
		this.#resolveSetUp();
		this.isSetUp = true;
	}

	importData(_data, _write = true) {
		this._data = _data.map(dataPoint => this.#dataToObject(dataPoint));
		if (_write) return this.writeData();
	}


	async writeData() {
		return LocalDB.setData(this.type, this._data.map(t => t.export()));
	}


	async clear() {
		this._data = [];
		return this.writeData();
	}
}

