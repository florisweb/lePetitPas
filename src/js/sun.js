import * as THREE from 'three';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';


export default class Sun {
	#mesh;
	#light;
	#sunDistance = 1000;
	#sunRad = 30;
	#sunAngle = 0;
	#sunSpeed = 0.003;
	#lensflareElements = [];
	#lensFlareSizes = [256, 256, 60, 70]

	#camera;
	constructor({camera}) {
		this.#camera = camera;
		const sunColour = 0xffff33;
		// this.#light = new THREE.SpotLight(0xffeeeee, this.#sunDistance**2 * 1.5);
		this.#light = new THREE.SpotLight(0xffeeeee, this.#sunDistance**2 * 1.5);
		// TODO SunLight | https://threejs.org/docs/?q=sunlig#SunLight
		this.#light.castShadow = true;
		this.#light.shadow.mapSize.width = 1024 * 4;
		this.#light.shadow.mapSize.height = 1024 * 4;
		this.#light.shadow.camera.near = 50;
		this.#light.shadow.camera.far = 5000;
		this.#light.shadow.camera.fov = 5;


		// Vulcano has shadow
		this.#light.shadow.bias = -0.00001; 
		this.#light.shadow.normalBias = -2;

		// // Stable: vulcano does not have shadow		
		// this.#light.shadow.bias = -0.01;
		// this.#light.shadow.normalBias = 0.02;

		this.#light.shadow.camera.left = -20;
		this.#light.shadow.camera.right = 20;
		this.#light.shadow.camera.top = 20;
		this.#light.shadow.camera.bottom = -20;


		const sunGeo = new THREE.SphereGeometry(this.#sunRad, 50, 50);

		const sunMaterial = new THREE.MeshStandardMaterial({
			emissive: sunColour,        // Yellow glow
			emissiveIntensity: 5,      // Brightness of the glow
			color: sunColour,            // Base color
			toneMapped: false          // Important for bloom
		});
		this.#mesh = new THREE.Mesh(sunGeo, sunMaterial);
		this.#mesh.position.set(0, 0, this.#sunDistance);

		this.#light.position.copy(this.#mesh.position);



		const textureLoader = new THREE.TextureLoader();
		const textures = [
			textureLoader.load('https://threejs.org/examples/textures/lensflare/lensflare0.png'),
			textureLoader.load('https://threejs.org/examples/textures/lensflare/lensflare1.png'),
			textureLoader.load('https://threejs.org/examples/textures/lensflare/lensflare2.png'),
			textureLoader.load('https://threejs.org/examples/textures/lensflare/lensflare3.png')
		];
		const offsets = [0, 0.6, 1.6, 0];

		let lensflare = new Lensflare();
		for (let i = 0; i < textures.length; i++)
		{
			let element = new LensflareElement(textures[i],  this.#lensFlareSizes[i], offsets[i]);
			this.#lensflareElements.push(element);
			lensflare.addElement(element);
		}
		
		this.#light.add(lensflare);
	}


	addToScene(scene) {
		scene.add(this.#mesh);
		scene.add(this.#light);
	}
	update() {
		this.#sunAngle += this.#sunSpeed;
		this.#sunAngle = this.#sunAngle % (2 * Math.PI);
		this.#mesh.position.set(Math.sin(this.#sunAngle) * this.#sunDistance, 0, Math.cos(this.#sunAngle) * this.#sunDistance);
		this.#light.position.set(Math.sin(this.#sunAngle) * (this.#sunDistance - this.#sunRad), 0, Math.cos(this.#sunAngle) * (this.#sunDistance - this.#sunRad));


		const sunPos = this.#mesh.position.clone();
		const toSun = sunPos.normalize();
		const cameraDir = this.#camera.camera.position.clone().normalize();
		const alignment = toSun.dot(cameraDir);

		const flareStrength = 0.2 * (1 - Math.abs(alignment))**-1;
		console.log(alignment, flareStrength);
		
	  	this.#lensflareElements.forEach((element, i) => {
		    element.size = this.#lensFlareSizes[i] * (flareStrength);  // Grows as sun approaches edge
	  	});

	}
}


