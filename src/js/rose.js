import * as THREE from 'three';
import { Perlin, random } from './random.js';
import Planet from './planet.js';
import { generatePatchGeometry } from './geometryGenerator.js';
import PlanetObject from './planetObject.js'

export default class Rose extends PlanetObject {
	#mesh;
	#hillMesh;

	get mesh() {return this.#mesh};

	
	#hillHeight = 0.7;
	#hillRadius = 2.0;
	#creationTime = Date.now() + Math.random() * 1000;

	constructor({}, _planet) {
		let position = [random() * Math.PI * 2, (random() * 0.5 + 0.25) * Math.PI];
		super(position, _planet)


		this.#generateMesh();
	}
	

	#hillRadialFunction(theta, phi) {
		const patchSize = this.#hillRadius * 2;
		const xArcLength = patchSize / this._planet.baseRadius;

		let radius = this._planet.radialFunction(theta, phi);

		const rTheta = theta - this.position[0]; // Relative theta
		const rPhi = phi - this.position[1]; // Relative phi

		const patchRadius = this.#hillRadius / (this._planet.baseRadius); // Convert to units of angles
		const vulcanoRadius = patchRadius;

		let distFromCenter = Math.abs(
			 Math.sqrt(
				(rTheta % (2 * Math.PI))**2 + 
				(rPhi % (2 * Math.PI))**2
			)
		);
		
		const baseWidth = 0.7 * vulcanoRadius;
		const topWidth = 0.2 * vulcanoRadius;
		let curEdgeFrac = (distFromCenter - (vulcanoRadius - baseWidth)) / baseWidth;
		radius += this.#hillHeight * Math.min((topWidth + 1) * (1 - curEdgeFrac), 1);	

		return radius;
	}

	#generateHillGeometry(radialFunction) {
		const patchSize = this.#hillRadius * 2;
		const segDensity = Planet.segCount / (Math.PI * this._planet.baseRadius) * 3.0;
		return generatePatchGeometry((theta, phi) => this.#hillRadialFunction(theta, phi), [patchSize, patchSize], this.position, segDensity, this._planet.baseRadius);
	}

	#createHillTexture() {
		const canvas = document.createElement('canvas');
		canvas.width = 128;
		canvas.height = 128;
		const ctx = canvas.getContext('2d');

		const minRadPerc = 0.2;
		for (let x = 0; x < canvas.width; x++)
		{
			let rx = (x - canvas.width / 2) / canvas.width;
			for (let y = 0; y < canvas.height; y++)
			{
				let ry = (y - canvas.height / 2) / canvas.height;
				let dist = Math.sqrt(rx**2 + ry**2) * Math.sqrt(2);
				const colorP = 1 - 1 / (1 + Math.exp(10 * (dist - 0.5))) + 0.2 * (1 + Perlin.get(rx * 5, ry * 5));

				ctx.fillStyle = 'rgb(' + Math.round(colorP * 195 + 40) + ', ' +  Math.round(colorP * 100 + 135) + ', ' + Math.round(colorP * 215 + 20) + ')';

				ctx.fillRect(x, y, 1, 1);
			}
		}
	
		const texture = new THREE.CanvasTexture(canvas);
		return texture;
	}


	#generateMesh() {
		let hillGeo = this.#generateHillGeometry();
		
		let hillMaterial = new THREE.MeshLambertMaterial({
			map: this.#createHillTexture(),
		});


		hillMaterial.side = THREE.DoubleSide; // Fix cliping issues
		this.#hillMesh = new THREE.Mesh(hillGeo, hillMaterial);

		this.#hillMesh.castShadow = true;
		this.#hillMesh.receiveShadow = true;


		this.#mesh = new THREE.Group();
		this.#mesh.add(this.#hillMesh);
		this.#mesh.position.x = 0;
		this.#mesh.position.z = 0;
		this.#mesh.position.y = 0;
	}

	update() {
		
	}
}



