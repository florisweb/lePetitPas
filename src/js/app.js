import * as THREE from 'three';

import Star from './simulation/star.js';
import Sun from './simulation/sun.js';
import Planet from './simulation/planet.js';
import { random } from './random.js';
import Camera from './simulation/camera.js';
import SpotLight from './simulation/spotLight.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

import HabitList from './UI/habitList.js';
import HabitManager from './data/habitManager.js';

import Simulation from './simulation/simulation.js';

// --- Load Elements so they are registered to the DOM ---
import Popup from './UI/customElements/popup.js';
import HabitListPanel from './UI/habitListPanel.js';
import HabitInfoPanel from './UI/habitInfoPanel.js';
import HabitEditPanel from './UI/habitEditPanel.js';


const App = new class {
	#curOpenPanel;
	simulation;
	get curOpenPanel() {
		return this.#curOpenPanel;
	}
	set curOpenPanel(_panel) {
		if (this.#curOpenPanel) this.#curOpenPanel.openState = false;
		this.#curOpenPanel = _panel;
		this.#curOpenPanel.openState = true;
	}


	constructor() {
		window.App = this;
		this.habitListPanel = new HabitListPanel();
		this.habitInfoPanel = new HabitInfoPanel();
		this.habitEditPanel = new HabitEditPanel();
		this.curOpenPanel = this.habitListPanel;
		this.simulation = new Simulation(this);
	}

	async setup() {
		this.simulation.setup();
		await HabitManager.isSetUp;

		for (let habit of HabitManager.data) this.simulation.planet.addHabitObject(habit);	
		document.body.append(this.habitListPanel);
		document.body.append(this.habitInfoPanel);
		document.body.append(this.habitEditPanel);
	
		document.body.classList.remove('loading');
		renderer.domElement.addEventListener('click', () => this.habitInfoPanel.close());
	}
}





App.setup();


export default App;