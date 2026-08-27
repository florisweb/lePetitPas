import * as THREE from 'three';


export default class Star {
	#mesh;
	#light;

	constructor() {
		const starRad = (Math.random() * 0.2 + 0.1) * 5;
		const starGeo = new THREE.SphereGeometry(starRad, 5, 5);

		const color = Math.round(((Math.random() * 55 + 200) << 16) + ((Math.random() * 55 + 200) << 8) + (Math.random() * 120 + 135));
		const starMaterial = new THREE.MeshStandardMaterial({
		  emissive: color,        // Yellow glow
		  emissiveIntensity: 200000,      // Brightness of the glow
		  color: color,            // Base color
			toneMapped: false          // Important for bloom
		});
		this.#mesh = new THREE.Mesh(starGeo, starMaterial);


		const starDistance = 1000;
		const phi = Math.random() * Math.PI;
		const theta = Math.random() * Math.PI * 2;
		this.#mesh.position.x = starDistance * Math.sin(phi) * Math.cos(theta);
		this.#mesh.position.y = starDistance * Math.cos(phi);
		this.#mesh.position.z = starDistance * Math.sin(phi) * Math.sin(theta);
		

		// this.#mesh.position.z = 25;
		// this.#mesh.position.x = 15;


		this.#light = new THREE.PointLight(0xffff00, 1, 10000);
		this.#light.position.copy(this.#mesh.position);
	}
	addToScene(scene) {
		scene.add(this.#mesh);
		// scene.add(this.#light);
	}
}


