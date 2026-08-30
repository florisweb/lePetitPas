import * as THREE from 'three';
import { Perlin, random } from './random.js';


// function generatePlanetGeometry(baseRadius, widthSegments = 32, heightSegments = 16) {
// 	const geometry = new THREE.BufferGeometry();
// 	const vertices = [];
// 	const indices = [];
// 	const maxSlope = 5; // 0.1 per unit distance


// 	const dy = Math.PI / heightSegments; // Approx: for a unit sphere

// 	const freq = 10000;
// 	function generateRad(theta, phi) {
// 		const dx = 2 * Math.PI * Math.sin(phi) / widthSegments; // Approx: for a unit sphere
// 		return (1 + Perlin.get(theta / Math.PI / 2 * freq * dx, phi / Math.PI * freq * dy)) * 0.5;// random() * 0.5;
// 	}

// 	const topRadius = baseRadius + generateRad(0, 0);
// 	const bottomRadius = baseRadius + generateRad(0, Math.PI);
// 	const radiiTable = [];

	
// 	for (let y = 0; y <= heightSegments; y++) 
// 	{
// 		const phi = (y / heightSegments) * Math.PI; // 0 to π (top to bottom)
// 		radiiTable[y] = [];
// 		// let leftHeight;
// 		for (let x = 0; x <= widthSegments; x++) 
// 		{
// 			const theta = (x / widthSegments) * Math.PI * 2; // 0 to 2π (around)

// 			// Obtain neighbours to get constraints
// 			const topHeight = y > 0 ? (radiiTable[y - 1][x]) : topRadius;
// 			const bottomHeight = y < heightSegments ? 0 : bottomRadius;
// 			const leftHeight = x > 0 ? radiiTable[y][x - 1] : 0; // 0 = not defined yet
// 			const rightHeight = x < widthSegments ? 0 : radiiTable[y][0]; // 0 = not defined yet

// 			const dx = 2 * Math.PI * Math.sin(phi) / widthSegments; // Approx: for a unit sphere

// 			let trialRad = baseRadius + generateRad(theta, phi);

// 			if (dx > 1e-10)
// 			{
// 				let allowed = (Math.abs(trialRad - topHeight) < maxSlope * dy) &&
// 								(bottomHeight != 0 ? (Math.abs(trialRad - bottomHeight) < maxSlope * dy) : true) &&
// 								(leftHeight != 0 ? (Math.abs(trialRad - leftHeight) < maxSlope * dx) : true) &&
// 								(rightHeight != 0 ? (Math.abs(trialRad - rightHeight) < maxSlope * dx) : true);
// 				let tries = 0;
// 				while (!allowed && tries < 200)
// 				{
// 					trialRad += (Math.random() * 2 - 1) * 0.01;
// 					allowed = (Math.abs(trialRad - topHeight) < maxSlope * dy) &&
// 								(bottomHeight != 0 ? (Math.abs(trialRad - bottomHeight) < maxSlope * dy) : true) &&
// 								(leftHeight != 0 ? (Math.abs(trialRad - leftHeight) < maxSlope * dx) : true) &&
// 								(rightHeight != 0 ? (Math.abs(trialRad - rightHeight) < maxSlope * dx) : true);
// 					tries++;
// 				}
// 				if (tries === 200) console.log('not good')
// 			}

// 			radiiTable[y][x] = trialRad;


// 			if (x === widthSegments) radiiTable[y][x] = radiiTable[y][0]; // Ensure it is cyclical 
// 			if (y === 0) radiiTable[y][x] = topRadius // Ensure the top only has one height
// 			if (y === heightSegments) radiiTable[y][x] = bottomRadius // Ensure the bottom only has one height
// 		}	
// 	}
// 	window.radiiTable = radiiTable;


	

// 	// Generate vertices
// 	for (let y = 0; y <= heightSegments; y++) 
// 	{
// 		const phi = (y / heightSegments) * Math.PI; // 0 to π (top to bottom)

// 		for (let x = 0; x <= widthSegments; x++) 
// 		{
// 			const theta = (x / widthSegments) * Math.PI * 2; // 0 to 2π (around)

// 			// Get radius from the custom function
// 			const radius = radiiTable[y][x];

// 			// Convert spherical coordinates to Cartesian
// 			const posX = radius * Math.sin(phi) * Math.cos(theta);
// 			const posY = radius * Math.cos(phi);
// 			const posZ = radius * Math.sin(phi) * Math.sin(theta);

// 			vertices.push(posX, posY, posZ);
// 		}
// 	}

// 	// Generate indices for triangles
// 	for (let y = 0; y < heightSegments; y++) 
// 	{
// 		for (let x = 0; x < widthSegments; x++) 
// 		{
// 			const a = y * (widthSegments + 1) + x;
// 			const b = a + widthSegments + 1;

// 			// First triangle
// 			indices.push(a, b, a + 1); // 
// 			// Second triangle
// 			indices.push(a + 1, b, b + 1);
// 		}
// 	}

// 	geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
// 	geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
// 	geometry.computeVertexNormals();

// 	return geometry;
// }


function generatePlanetGeometry(radiusFunction, widthSegments = 32, heightSegments = 16) {
	const geometry = new THREE.BufferGeometry();
	const vertices = [];
	const indices = [];

	// Generate vertices
	for (let y = 0; y <= heightSegments; y++) 
	{
		const phi = (y / heightSegments) * Math.PI; // 0 to π (top to bottom)

		for (let x = 0; x <= widthSegments; x++) 
		{
			const theta = (x / (widthSegments + 1)) * Math.PI * 2; // 0 to 2π (around) | temp + 1

			// Get radius from the custom function
			const radius = radiusFunction(theta, phi);

			// Convert spherical coordinates to Cartesian
			const posX = radius * Math.sin(phi) * Math.cos(theta);
			const posY = radius * Math.cos(phi);
			const posZ = radius * Math.sin(phi) * Math.sin(theta);

			vertices.push(posX, posY, posZ);
		}
	}
	// Generate indices for triangles
	for (let y = 0; y < heightSegments; y++) 
	{
		for (let x = 0; x < widthSegments; x++) 
		{
			const a = y * (widthSegments + 1) + x;
			const b = a + widthSegments + 1;

			// First triangle
			indices.push(a, b, a + 1); // 
			// Second triangle
			indices.push(a + 1, b, b + 1);
		}
	}

	// Stitch the two ends together
	for (let y = 0; y < heightSegments; y++) 
	{
		const rt = y * (widthSegments + 1); // Right top of seam
		const lt = y * (widthSegments + 1) + widthSegments; // Left top of seam
		const rb = (y + 1) * (widthSegments + 1); // Right bottom of seam
		const lb = (y + 1) * (widthSegments + 1) + widthSegments; // Left bottom of seam
	
		indices.push(rt, lt, rb);
		indices.push(lt, lb, rb);
	}

	geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
	geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
	geometry.computeVertexNormals();

	return geometry;
}


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



class Vulcano {
	#mesh;
	get mesh() {return this.#mesh};
	#position;
	#planet;

	#height;
	#radius;
	constructor({radius, height}, _planet) {
		this.#planet = _planet;
		this.#height = height;
		this.#radius = radius;
		this.#position = [random() * Math.PI * 2, random() * Math.PI];
		console.log(this.#position[0], this.#position[1], 'dtheta', 2 * Math.PI / (2 * Planet.segCount));

		// Ensure that the position of the vulcano matches well with the segment grid of the planet
		this.#position[0] = Math.round(this.#position[0] / (Math.PI / Planet.segCount)) * (Math.PI / Planet.segCount);
		this.#position[1] = Math.round(this.#position[1] / (Math.PI / Planet.segCount)) * (Math.PI / Planet.segCount);

		console.log(this.#position[0], this.#position[1]);
		// integers on -> (y / heightSegments) * Math.PI; // 0 to π (top to bottom) -> so must be on Math.PI / heightSegments


		this.#generateMesh({radius, height});
	}

	#radialFunction(theta, phi) {
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

	#generateMesh({radius, height}) {
		const patchSize = radius * 2;
		const segDensity = Planet.segCount / (Math.PI * this.#planet.baseRadius) * 4;

		const segCount = Math.round(patchSize * segDensity);
		const xArcLength = patchSize / this.#planet.baseRadius;
		const yArcLength = patchSize / this.#planet.baseRadius;


		const geometry = new THREE.BufferGeometry();
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
				const radius = this.#radialFunction(theta, phi);

				// Convert spherical coordinates to Cartesian
				const posX = radius * Math.sin(phi) * Math.cos(theta);
				const posY = radius * Math.cos(phi);
				const posZ = radius * Math.sin(phi) * Math.sin(theta);

				vertices.push(posX, posY, posZ);
			}
		}
		// Generate indices for triangles
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
		geometry.computeVertexNormals();



		let material = new THREE.MeshLambertMaterial({color: 0xffffff});
		// let material = new THREE.MeshLambertMaterial({color: 0xff0000});
		material.side = THREE.DoubleSide; // Fix cliping issues

		this.#mesh = new THREE.Mesh(geometry, material);
		this.#mesh.castShadow = true;
		this.#mesh.receiveShadow = true;

		this.#mesh.position.x = 0;
		this.#mesh.position.z = 0;
		this.#mesh.position.y = 0;	
	}
}




export default class Planet {
	static segCount = 100;
	baseRadius = 20;

	#mesh;
	#group;
	#coreMesh;
	#creationTime = new Date();
	vulcanos = [];

	constructor() {
		this.#generateMesh();
		this.vulcanos.push(new Vulcano({radius: 4, height: 5}, this));

		this.#group = new THREE.Group();
		this.#group.add(this.#mesh);
		this.#group.add(this.#coreMesh);
		for (let vulc of this.vulcanos) this.#group.add(vulc.mesh);
	}


	update() {
		// this.#mesh.rotateY(-0.001);
		this.#group.rotateY(-0.001);
		this.#animateCreation();
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

		const coreGeometry = new THREE.SphereGeometry(this.baseRadius * 1.02 * 0.5, Planet.segCount * 2, Planet.segCount); // FIXME
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
		let perc = Math.min(dt / 100000, 1);
		let scale = 0.7 + 0.3 * Math.exp(-perc)
		this.#coreMesh.scale.x = scale;
		this.#coreMesh.scale.y = scale;
		this.#coreMesh.scale.z = scale;	
	}
}


