import * as THREE from 'three';
import { Perlin, random } from './random.js';
import Planet from './planet.js';


export default class Vulcano {
	#mesh;
	#lavaMesh;
	#vulcMesh;
	get mesh() {return this.#mesh};
	get relPosition() {
		const planRot = [this.#planet.group.rotation.y, this.#planet.group.rotation.x, this.#planet.group.rotation.z]
		return [
			this.#planet.baseRadius * Math.sin(this.#position[1] + planRot[1]) * Math.cos(this.#position[0] - planRot[0]),
			this.#planet.baseRadius * Math.cos(this.#position[1] + planRot[1]),
			this.#planet.baseRadius * Math.sin(this.#position[1] + planRot[1]) * Math.sin(this.#position[0] - planRot[0])
		];
	}
	#position;
	#planet;

	#height;
	#radius;
	#creationTime = Date.now() + Math.random() * 1000;

	constructor({radius, height}, _planet) {
		this.#planet = _planet;
		this.#height = height;
		this.#radius = radius;
		this.#position = [random() * Math.PI * 2, (random() * 0.5 + 0.25) * Math.PI];

		// Ensure that the position of the vulcano matches well with the segment grid of the planet -> TODO: does not work well yet
		this.#position[0] = Math.round(this.#position[0] / (Math.PI / Planet.segCount)) * (Math.PI / Planet.segCount);
		this.#position[1] = Math.round(this.#position[1] / (Math.PI / Planet.segCount)) * (Math.PI / Planet.segCount);


		this.#generateMesh({radius, height});
	}

	#animateCreation() {
		let dt = new Date() - this.#creationTime;
		const perc = Math.min(dt / 5000, 1);
		
		const bendingPointPerc = 0.8;
		const popupPercShare = 0.5; // Specify what percentage of the animation represents the popup;
		const emissivePercShare = 0.5;

		let popupPerc = 1 / (1 + Math.exp(-(perc / popupPercShare - 0.5) * 10))
		this.#mesh.scale.x = popupPerc;
		this.#mesh.scale.y = popupPerc;
		this.#mesh.scale.z = popupPerc;

		let emissivePerc = 1 / (1 + Math.exp(((perc - (1 - emissivePercShare)) / emissivePercShare) * 10))
		this.#vulcMesh.material.emissiveIntensity = 3 * emissivePerc;
	}

	#vulcRadialFunction(theta, phi) {
		const patchSize = this.#radius * 2;
		const xArcLength = patchSize / this.#planet.baseRadius;

		let radius = this.#planet.radialFunction(theta, phi);

		const rTheta = theta - this.#position[0]; // Relative theta
		const rPhi = phi - this.#position[1]; // Relative phi

		const patchRadius = this.#radius / (this.#planet.baseRadius); // Convert to units of angles
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
		radius += this.#height * Math.min((topWidth + 1) * (1 - Math.min(curEdgeFrac, 1)), 1);	

		return radius;
	}

	#lavaRadialFunction(theta, phi) {
		let radius = this.#planet.radialFunction(theta, phi) + 0.5 * this.#height;
		return radius;
	}

	#generateGeometry({radius, height, segDensityMultiplier}, radialFunction) {
		const patchSize = radius * 2;
		const segDensity = Planet.segCount / (Math.PI * this.#planet.baseRadius) * segDensityMultiplier;

		const segCount = Math.round(patchSize * segDensity);
		const xArcLength = patchSize / this.#planet.baseRadius;
		const yArcLength = patchSize / this.#planet.baseRadius;


		const geometry = new THREE.BufferGeometry();
		const uvs = [];
		const vertices = [];
		const indices = [];

		// Generate vertices
		for (let y = 0; y <= segCount; y++) 
		{
			const rPhi = (y / segCount - 0.5) * yArcLength; // 0 to π (top to bottom)
			const phi = this.#position[1] + rPhi;
			for (let x = 0; x <= segCount; x++) 
			{
				const rTheta = (x / segCount - 0.5) * xArcLength; // 0 to 2π (around) | temp + 1
				const theta = this.#position[0] + rTheta;
				// Get radius from the custom function
				const radius = radialFunction(theta, phi);

				// Convert spherical coordinates to Cartesian
				const posX = radius * Math.sin(phi) * Math.cos(theta);
				const posY = radius * Math.cos(phi);
				const posZ = radius * Math.sin(phi) * Math.sin(theta);

				vertices.push(posX, posY, posZ);
				uvs.push(x / segCount, y / segCount);
			}
		}

		for (let y = 0; y < segCount; y++) 
		{
			for (let x = 0; x < segCount; x++) 
			{
				const a = y * (segCount + 1) + x;
				const b = a + segCount + 1;
				indices.push(a, b, a + 1); 
				indices.push(a + 1, b, b + 1);
			}
		}
		
		geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
		geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
		geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
		geometry.computeVertexNormals();
		return geometry;
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


	#generateMesh({radius, height}) {
		const vulcTexture = this.#createTexture();
		let vulcGeo = this.#generateGeometry({radius, height, segDensityMultiplier: 4}, (theta, phi) => this.#vulcRadialFunction(theta, phi));
		// let vulcMaterial = new THREE.MeshLambertMaterial({
		// 	emissive: 0xff5000,
		// 	color: 0xffffff
		// });
		let vulcMaterial = new THREE.MeshLambertMaterial({
			map: vulcTexture,
		});


		vulcMaterial.side = THREE.DoubleSide; // Fix cliping issues
		this.#vulcMesh = new THREE.Mesh(vulcGeo, vulcMaterial);

		this.#vulcMesh.castShadow = true;
		this.#vulcMesh.receiveShadow = true;


		let lavaGeo = this.#generateGeometry({radius: radius * 0.3, height, segDensityMultiplier: 10}, (theta, phi) => this.#lavaRadialFunction(theta, phi));
		let lavaMaterial = new THREE.MeshLambertMaterial({
			emissive: 0xff5000, 
			emissiveIntensity: 1.9,
			color: 0xff5000, 
			toneMapped: false
		});
		lavaMaterial.side = THREE.DoubleSide; // Fix cliping issues
		this.#lavaMesh = new THREE.Mesh(lavaGeo, lavaMaterial);
		window.lavaMesh = this.#lavaMesh;

		this.#vulcMesh.castShadow = true;
		this.#vulcMesh.receiveShadow = true;
		

		this.#mesh = new THREE.Group();
		this.#mesh.add(this.#vulcMesh);
		this.#mesh.add(this.#lavaMesh);
		this.#mesh.position.x = 0;
		this.#mesh.position.z = 0;
		this.#mesh.position.y = 0;
	}

	update() {
		this.#lavaMesh.material.emissiveIntensity = 1.85 + (1 + Math.sin(Date.now() / 1000 * 3)) / 2 * 0.01 + (1 + Math.sin(Date.now() / 1000)) / 2 * 0.01;
		this.#animateCreation();
	}
}



