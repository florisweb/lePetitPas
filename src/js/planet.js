import * as THREE from 'three';
import { Perlin, random } from './random.js';
import Vulcano from './vulcano.js';
import Rose from './rose.js';

import { generatePlanetGeometry } from './geometryGenerator.js';


let craters = [];
window.craters = craters;

for (let i = 0; i < 3 + Math.ceil(random() * 30); i++)
{
	craters.push({
		pos: [random() * 2 * Math.PI, random() * Math.PI], 
		rad: random() * 0.2 + 0.05, 
		height: 1 + random() * 0.5
	})
}


function calcPlanetPerlin(theta, phi, targetWavelength) {
	const relCircumference = Math.sin(phi);
	const realWavelength = targetWavelength / relCircumference;
	const fittedFreq = Math.round(1/realWavelength); // 1 / wavelength should be an integer to wrap nicely

	return Perlin.get(theta / Math.PI / 2 * fittedFreq, phi / Math.PI * fittedFreq);
}



export default class Planet {
	static segCount = 100;
	baseRadius = 20;

	#mesh;
	#group;
	#coreMesh;
	#creationTime = new Date();
	objects = [];
	get group() {
		return this.#group;
	}

	constructor() {
		this.#generateMesh();
		for (let i = 0; i < 1; i++) this.objects.push(new Vulcano({radius: 4, height: 5}, this));
		for (let i = 0; i < 1; i++) this.objects.push(new Rose({radius: 4, height: 5}, this));

		this.#group = new THREE.Group();
		this.#group.add(this.#mesh);
		this.#group.add(this.#coreMesh);
		for (let obj of this.objects) this.#group.add(obj.mesh);
	}


	update() {
		// this.#group.rotateY(-0.001);
		this.#group.rotateY(-0.0003);
		this.#animateCreation();
		for (let vulc of this.objects) vulc.update();
	}

	addToScene(scene) {
		scene.add(this.#group);
	}


	#generateMesh() {
		const geometry = generatePlanetGeometry((theta, phi) => this.radialFunction(theta, phi), Planet.segCount * 2, Planet.segCount);
		let material = new THREE.MeshLambertMaterial({color: 0xffffff});
		material.side = THREE.DoubleSide; // Fix cliping issues

		this.#mesh = new THREE.Mesh(geometry, material);
		this.#mesh.castShadow = true;
		this.#mesh.receiveShadow = true;

		this.#mesh.position.x = 0;
		this.#mesh.position.z = 0;
		this.#mesh.position.y = 0;
		this.#mesh.rotateZ(0.1 * random() * Math.PI * 2);

		const coreGeometry = new THREE.SphereGeometry(this.baseRadius * 1.02, Planet.segCount * 2, Planet.segCount);
		const coreMaterial = new THREE.MeshStandardMaterial({
			emissive: 0xff5000, 
			emissiveIntensity: 1.9,
			color: 0xff5000,            // Base color
			toneMapped: false          // Important for bloom
		});
		
		this.#coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
	}



	radialFunction(theta, phi)  {
		let baseRad = this.baseRadius * (
					1 
					+ 0.1 * calcPlanetPerlin(theta, phi, 0.05)
					+ 0.03 * calcPlanetPerlin(theta, phi, 0.01)
					+ 0.01 * calcPlanetPerlin(theta, phi, 0.001)
		);

		for (let c = 0; c < craters.length; c++)
		{
			const craterPos = craters[c].pos;
			const craterRad = craters[c].rad;
			const craterHeight = craters[c].height; 

			// planetRad
			// const centerDist = 1 * Math.acos(
			// 	Math.sin(craterPos[0]) * Math.sin(theta) + Math.cos(Math.abs(craterPos[1] - phi)) * Math.cos(craterPos[0]) * Math.cos(theta)
			// 	// Math.sin(craterPos[0]) * Math.sin(theta) + Math.cos(Math.abs(craterPos[1] - phi)) * Math.cos(craterPos[0]) * Math.cos(theta)
			// );
			// let dist = Math.abs(craterRad - centerDist);
			let dist = Math.abs(
				craterRad - Math.sqrt(
					((craterPos[0] - theta) % (2 * Math.PI))**2 + 
					((craterPos[1] - phi) % (2 * Math.PI))**2
				)
			);
			
		
			const baseWidth = 0.03;
			const widthPerc = 1;
			baseRad += craterHeight * Math.min((widthPerc + 1) * (1 - Math.min(Math.abs(dist / baseWidth), 1)), 1);	
		}
		return baseRad;
	}

	get coreMesh() {
		return this.#coreMesh;
	}


	#animateCreation() {
		let dt = new Date() - this.#creationTime;
		let perc = Math.min(dt / 5000, 1);
		let scale = 0.7 + 0.3 * Math.exp(-perc / 3)
		this.#coreMesh.scale.x = scale;
		this.#coreMesh.scale.y = scale;
		this.#coreMesh.scale.z = scale;
	}
}


