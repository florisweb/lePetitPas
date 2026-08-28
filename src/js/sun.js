import * as THREE from 'three';


export default class Sun {
	#mesh;
	#light;
	#sunDistance = 1000;
	#sunAngle = 0;
	#sunSpeed = 0.003;


	constructor() {
		const sunColour = 0xffff00;
		this.#light = new THREE.SpotLight(0xffeeeee, this.#sunDistance**2 * 1);
		this.#light.castShadow = true;
		this.#light.shadow.mapSize.width = 1024 * 4;
		this.#light.shadow.mapSize.height = 1024 * 4;
		this.#light.shadow.camera.near = 50;
		this.#light.shadow.camera.far = 5000;
		this.#light.shadow.camera.fov = 5;
		this.#light.shadow.bias = -0.01;  // Start with a small negative value
		this.#light.shadow.normalBias = 0.02;  // Helps with detailed geometry

		this.#light.shadow.camera.left = -20;
		this.#light.shadow.camera.right = 20;
		this.#light.shadow.camera.top = 20;
		this.#light.shadow.camera.bottom = -20;


		const sunRad = 10;
		const sunGeo = new THREE.SphereGeometry(sunRad, 50, 50);

		const sunMaterial = new THREE.MeshStandardMaterial({
			emissive: sunColour,        // Yellow glow
			emissiveIntensity: 5,      // Brightness of the glow
			color: sunColour,            // Base color
			toneMapped: false          // Important for bloom
		});
		this.#mesh = new THREE.Mesh(sunGeo, sunMaterial);
		this.#mesh.position.set(0, 0, this.#sunDistance);

		this.#light.position.copy(this.#mesh.position);
	}

	addToScene(scene) {
		scene.add(this.#mesh);
		scene.add(this.#light);
	}
	update() {
		this.#sunAngle += this.#sunSpeed;
		this.#sunAngle = this.#sunAngle % (2 * Math.PI);
		this.#mesh.position.set(Math.sin(this.#sunAngle) * this.#sunDistance, 0, Math.cos(this.#sunAngle) * this.#sunDistance);
		this.#light.position.copy(this.#mesh.position);
	}
}


