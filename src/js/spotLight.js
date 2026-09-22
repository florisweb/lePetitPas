import * as THREE from 'three';

export default class SpotLight {
	#light;
	#distance = 100;
	
	constructor() {
		this.#light = new THREE.SpotLight( 0xffffff, 10000 );

		this.#light.position.set(0, 0, 0)
		this.#light.castShadow = true;
		this.#light.penumbra = 0.5;      // soft edge: 0–1

		this.#light.lookAt(0, 0, 0);
		this.#light.shadow.bias = -0.00001; 
		this.#light.shadow.normalBias = -2;
	}
	get mesh() {
		return this.#light;
	}

	highlight(_anglePos, _radius = 7) {
		const posX = this.#distance * Math.sin(_anglePos[1]) * Math.cos(_anglePos[0]);
		const posY = this.#distance * Math.cos(_anglePos[1]);
		const posZ = this.#distance * Math.sin(_anglePos[1]) * Math.sin(_anglePos[0]);

		this.#light.position.set(posX, posY, posZ);
		this.#light.lookAt(0, 0, 0);

		this.#light.angle = Math.atan(_radius / this.#distance);

	}
	hide() {
		this.#light.position.set(0, 0, 0);

	}
	addToScene(scene) {
		scene.add(this.#light);
	}	
}


