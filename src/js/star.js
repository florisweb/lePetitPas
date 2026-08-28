import * as THREE from 'three';
import { random } from './random.js';

export default class Star {
	#mesh;
	#light;
	#twinkleOffset = random() * 100;
	#twinkleSpeed = (1 + random()) * 0.00001;

	constructor() {
		const starRad = (random() * 0.2 + 0.1) * 5;
		const starGeo = new THREE.SphereGeometry(starRad, 5, 5);

		const color = Math.round(((random() * 55 + 200) << 16) + ((random() * 55 + 200) << 8) + (random() * 120 + 135));
		const starMaterial = new THREE.MeshStandardMaterial({
		  emissive: color,        // Yellow glow
		  emissiveIntensity: 1,      // Brightness of the glow
		  color: color,            // Base color
			// toneMapped: false          // Important for bloom
		});
		this.#mesh = new THREE.Mesh(starGeo, starMaterial);


		const starDistance = 1000;
		const phi = random() * Math.PI;
		const theta = random() * Math.PI * 2;
		this.#mesh.position.x = starDistance * Math.sin(phi) * Math.cos(theta);
		this.#mesh.position.y = starDistance * Math.cos(phi);
		this.#mesh.position.z = starDistance * Math.sin(phi) * Math.sin(theta);
		
	}

	addToScene(scene) {
		scene.add(this.#mesh);
	}

	update() {
		const time = Date.now() * this.#twinkleSpeed + this.#twinkleOffset;
		const intensity = 0.5 + (1 + 
						0.6 * Math.sin(time * 0.5) +
						0.3 * Math.sin(time * 2.3) +
						0.1 * Math.sin(time * 5.7)) * 0.5;
    this.#mesh.material.emissiveIntensity = intensity;
	}
}


