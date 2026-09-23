import * as THREE from 'three';
import { Perlin, random } from '../random.js';
import Planet from './planet.js';
import { generatePatchGeometry } from './geometryGenerator.js';
import PlanetObject from './planetObject.js'


export default class BaseVulcano extends PlanetObject {
	_mesh;
	_vulcMesh;
	get mesh() {return this._mesh};
	
	_height;
	_radius;
	#creationTime = Date.now() + Math.random() * 1000;

	constructor({position, radius, height}, _planet) {
		super(position, _planet)
		this._height = height;
		this._radius = radius;
	}

	_animateCreation() {
		let dt = new Date() - this.#creationTime;
		const perc = Math.min(dt / 5000, 1);
		
		const bendingPointPerc = 0.8;
		const popupPercShare = 0.5; // Specify what percentage of the animation represents the popup;
		const emissivePercShare = 0.5;

		let popupPerc = 1 / (1 + Math.exp(-(perc / popupPercShare - 0.5) * 10))
		this._mesh.scale.x = popupPerc;
		this._mesh.scale.y = popupPerc;
		this._mesh.scale.z = popupPerc;

		let emissivePerc = 1 / (1 + Math.exp(((perc - (1 - emissivePercShare)) / emissivePercShare) * 10))
		this._vulcMesh.material.emissiveIntensity = 3 * emissivePerc;
	}

	_vulcRadialFunction(theta, phi) {
		const patchSize = this._radius * 2;
		const xArcLength = patchSize / this._planet.baseRadius;

		let radius = this._planet.radialFunction(theta, phi);

		const rTheta = theta - this.position[0]; // Relative theta
		const rPhi = phi - this.position[1]; // Relative phi

		const patchRadius = this._radius / (this._planet.baseRadius); // Convert to units of angles
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
		if (curEdgeFrac < 0) curEdgeFrac = -10 * curEdgeFrac; // Make the hole in the vulcano steeper
		radius += this._height * Math.min((topWidth + 1) * (1 - Math.min(curEdgeFrac, 1)), 1);	

		return radius;
	}


	_generateGeometry({radius, segDensityMultiplier}, radialFunction) {
		const patchSize = radius * 2;
		const segDensity = Planet.segCount / (Math.PI * this._planet.baseRadius) * segDensityMultiplier;
		return generatePatchGeometry((theta, phi) => radialFunction(theta, phi), [patchSize, patchSize], this.position, segDensity, this._planet.baseRadius);
	}

	#createTexture() {
		const canvas = document.createElement('canvas');
		canvas.width = 128;
		canvas.height = 128;
		const ctx = canvas.getContext('2d');

		const minRadPerc = 0.3;
		for (let x = 0; x < canvas.width; x++)
		{
			let rx = (x - canvas.width / 2) / canvas.width;
			for (let y = 0; y < canvas.height; y++)
			{
				let ry = (y - canvas.height / 2) / canvas.height;
				let dist = Math.sqrt(rx**2 + ry**2) * Math.sqrt(2);
				const colorP = 1 / (1 + Math.exp(10 * (dist - 0.5))) + 0.2 * (1 + Perlin.get(rx * 5, ry * 5));
				let color = Math.round((1 - Math.min(colorP, 1)) * 235 + 20);

				ctx.fillStyle = 'rgb(' + color + ', ' + color + ', ' + color + ')';

				ctx.fillRect(x, y, 1, 1);
			}
		}
	
		const texture = new THREE.CanvasTexture(canvas);
		return texture;
	}

	_generateVulcMesh({radius}) {
		const vulcTexture = this.#createTexture();
		let vulcGeo = this._generateGeometry({radius, segDensityMultiplier: 4}, (theta, phi) => this._vulcRadialFunction(theta, phi));
		let vulcMaterial = new THREE.MeshLambertMaterial({
			map: vulcTexture,
		});

		vulcMaterial.side = THREE.DoubleSide; // Fix cliping issues
		this._vulcMesh = new THREE.Mesh(vulcGeo, vulcMaterial);

		this._vulcMesh.castShadow = true;
		this._vulcMesh.receiveShadow = true;
		return this._vulcMesh;
	}

	_generateMesh({radius, height}) {}

	update() {
		this._animateCreation();
	}
}





export class ActiveVulcano extends BaseVulcano {
	#lavaMesh;
	constructor({position, radius, height}, _planet) {
		super(...arguments);
		this._generateMesh({radius, height});
	}

	update() {
		super.update();
		this.#lavaMesh.material.emissiveIntensity = 1.85 + (1 + Math.sin(Date.now() / 1000 * 3)) / 2 * 0.01 + (1 + Math.sin(Date.now() / 1000)) / 2 * 0.01;
	}

	_generateMesh({radius, height}) {
		this._vulcMesh = this._generateVulcMesh({radius});
		this.#lavaMesh = this.#generateLavaMesh({radius});

		this._mesh = new THREE.Group();
		this._mesh.add(this._vulcMesh);
		this._mesh.add(this.#lavaMesh);
		this._mesh.position.x = 0;
		this._mesh.position.z = 0;
		this._mesh.position.y = 0;
	}

	#generateLavaMesh({radius}) {
		let lavaGeo = this._generateGeometry({radius: radius * 0.3, segDensityMultiplier: 10}, (theta, phi) => this.#lavaRadialFunction(theta, phi));
		let lavaMaterial = new THREE.MeshLambertMaterial({
			emissive: 0xff5000, 
			emissiveIntensity: 1.9,
			color: 0xff5000, 
			toneMapped: false
		});
		lavaMaterial.side = THREE.DoubleSide;
		this.#lavaMesh = new THREE.Mesh(lavaGeo, lavaMaterial);
		return this.#lavaMesh;
	}

	#lavaRadialFunction(theta, phi) {
		let radius = this._planet.radialFunction(theta, phi) + 0.5 * this._height;
		return radius;
	}
}

export class InActiveVulcano extends BaseVulcano {
	constructor({position, radius, height}, _planet) {
		super(...arguments);
		this._generateMesh({radius, height});
	}


	_generateMesh({radius, height}) {
		this._vulcMesh = this._generateVulcMesh({radius});

	
		this._mesh = new THREE.Group();
		this._mesh.add(this._vulcMesh);
		this._mesh.position.x = 0;
		this._mesh.position.z = 0;
		this._mesh.position.y = 0;
	}
}






