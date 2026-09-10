import Planet from './planet.js';


export default class PlanetObject {
	get relPosition() {
		const planRot = [this._planet.group.rotation.y, this._planet.group.rotation.x, this._planet.group.rotation.z]
		return [
			this._planet.baseRadius * Math.sin(this.position[1] + planRot[1]) * Math.cos(this.position[0] - planRot[0]),
			this._planet.baseRadius * Math.cos(this.position[1] + planRot[1]),
			this._planet.baseRadius * Math.sin(this.position[1] + planRot[1]) * Math.sin(this.position[0] - planRot[0])
		];
	}
	position = []; // Position defined in 2D polar coordinates: (theta, phi)
	_planet;


	constructor(_position, _planet) {
		this._planet = _planet;
		
		// Ensure that the position of the object matches well with the segment grid of the planet -> TODO: does not work well yet
		this.position[0] = Math.round(_position[0] / (Math.PI / Planet.segCount)) * (Math.PI / Planet.segCount);
		this.position[1] = Math.round(_position[1] / (Math.PI / Planet.segCount)) * (Math.PI / Planet.segCount);
	}

	update() {	
	}
}



