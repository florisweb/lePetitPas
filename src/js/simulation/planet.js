import * as THREE from 'three';
import { Perlin, random, noise3D } from '../random.js';
import { ActiveVolcano, InActiveVolcano } from './vulcanos.js';
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

		this.#group = new THREE.Group();
		this.#group.add(this.#mesh);
		this.#group.add(this.#coreMesh);
	}


	update() {
		this.#animateCreation();
		for (let obj of this.objects) obj.update();
	}

	addHabitObject(_habit) {
		let objectConstructor;
		switch (_habit.type)
		{
			case "inactiveVolcano": objectConstructor = InActiveVolcano; break;
			case "rose": objectConstructor = Rose; break;
			default:
			case "activeVolcano": objectConstructor = ActiveVolcano; break;
		}

		let curObject = new objectConstructor(_habit.objectInfo, this);
		_habit.setPlanetObject(curObject);
		this.objects.push(curObject);
		this.#group.add(curObject.mesh);
		return curObject;
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

	#getRadAtVertIndex(_vertIndex) {
		let vertX = this.#mesh.geometry.attributes.position.getComponent(_vertIndex, 0);
		let vertY = this.#mesh.geometry.attributes.position.getComponent(_vertIndex, 1);
		let vertZ = this.#mesh.geometry.attributes.position.getComponent(_vertIndex, 2);
		return Math.sqrt(vertX**2 + vertY**2 + vertZ**2);
	}

	_interpolatedRadialFunction(_theta, _phi, _segCount = Planet.segCount) {
		// IMPORTANT: CAN ONLY BE USED AFTER PLANET GENERATION
		// Calculates the radius of the planet at a specific theta and phi by interpolating between points that fall on the _segCount-defined grid

		const widthSegments = _segCount * 2;
		const heightSegments = _segCount;
		
		const dTheta = 2 * Math.PI / (widthSegments + 1);
		const dPhi = Math.PI / heightSegments;
		const minTheta = Math.floor(_theta / dTheta) * dTheta;
		const minPhi = Math.floor(_phi / dPhi) * dPhi;

		let vertexIndex = Math.floor(_theta / dTheta) + (widthSegments + 1) * Math.floor(_phi / dPhi);
			
		let points = [
			this.#getRadAtVertIndex(vertexIndex),
			this.#getRadAtVertIndex(vertexIndex + 1),
			this.#getRadAtVertIndex(vertexIndex + 1 + (widthSegments + 1)),
			this.#getRadAtVertIndex(vertexIndex + (widthSegments + 1))
		]

		// From top left point
		let relThetaFrac = (_theta - minTheta) / dTheta;
		let relPhiFrac = (_phi - minPhi) / dPhi;

		// Because they lie on a grid of rectangles, we can decompose along theta and phi:
		let outVal = 0;
		if (relThetaFrac + relPhiFrac <= 1) { // Top left triangle
			let dRdTheta = (points[1] - points[0]);
			let dRdPhi = (points[3] - points[0]);
			outVal = points[0] + dRdPhi * relPhiFrac + dRdTheta * relThetaFrac;
		} else { // Bottom right triangle
			let dRdTheta = (points[2] - points[3]);
			let dRdPhi = (points[2] - points[1]);
			outVal = points[2] + dRdPhi * (1 - relPhiFrac) + dRdTheta * (1 - relThetaFrac);
		}

		return outVal;
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


