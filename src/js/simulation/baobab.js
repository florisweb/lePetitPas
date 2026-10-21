import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { Perlin, random } from '../random.js';
import Planet from './planet.js';
import { generatePatchGeometry, generateStemGeometry } from './geometryGenerator.js';
import { generateHillTexture } from './textureGenerator.js';
import PlanetObject from './planetObject.js'
import { animateSigmoidally } from '../animator.js';


export default class Baobab extends PlanetObject {
	#mesh;
	#hillMesh;
	#stemMesh;
	#treeTopMesh;


	get mesh() {return this.#mesh};
	habit;

	
	#hillHeight = 0.7;
	#hillRadius = 4.0;
	#stemLength = 4;
	#stemRadius = 1;

	#creationTime = Date.now() + Math.random() * 1000;

	constructor({position}, _planet, _habit) {
		super(position, _planet);
		this.habit = _habit;

		this.#generateMesh();
	}
	


	#generateHillMesh() {
		const patchSize = this.#hillRadius * 2;
		const segDensity = Planet.segCount / (Math.PI * this._planet.baseRadius) * 3.0;
		let geometry = generatePatchGeometry((theta, phi) => this.#hillRadialFunction(theta, phi), [patchSize, patchSize], this.position, segDensity, this._planet.baseRadius);
		
		let material = new THREE.MeshLambertMaterial({
			map: generateHillTexture(),
		});


		material.side = THREE.DoubleSide; // Fix cliping issues
		let mesh = new THREE.Mesh(geometry, material);

		mesh.castShadow = true;
		mesh.receiveShadow = true;
		return mesh;
	}
	#hillRadialFunction(theta, phi) {
		const patchSize = this.#hillRadius * 2;
		const xArcLength = patchSize / this._planet.baseRadius;

		let radius = this._planet.radialFunction(theta, phi);

		const rTheta = theta - this.position[0]; // Relative theta
		const rPhi = phi - this.position[1]; // Relative phi

		const patchRadius = this.#hillRadius / (this._planet.baseRadius); // Convert to units of angles
		const volcanoRadius = patchRadius;

		let distFromCenter = Math.abs(
			 Math.sqrt(
				(rTheta % (2 * Math.PI))**2 + 
				(rPhi % (2 * Math.PI))**2
			)
		);
		
		const baseWidth = 0.7 * volcanoRadius;
		const topWidth = 0.2 * volcanoRadius;
		let curEdgeFrac = (distFromCenter - (volcanoRadius - baseWidth)) / baseWidth;
		radius += this.#hillHeight * Math.min((topWidth + 1) * (1 - curEdgeFrac), 1);	

		return radius;
	}



	#stemRadFunc(_yFrac) {
		return (_yFrac * 0.6 + 0.4) * this.#stemRadius;
	}
	#stemOffsetFunc(_yFrac) {
		return [Math.cos(_yFrac * 2 * Math.PI) * 0.1, Math.sin(_yFrac * Math.PI) * 0.05]; // offset in xz plane
	}


	#createStemMesh() {
		let geometry = generateStemGeometry(p => this.#stemRadFunc(p), p => this.#stemOffsetFunc(p), this.#stemLength);
		let material = new THREE.MeshLambertMaterial({color: 0xBC4F1F});

		material.side = THREE.DoubleSide; // Fix cliping issues
		let mesh = new THREE.Mesh(geometry, material);
		let pos = this.calcPosAtRad(this._planet.baseRadius);
		mesh.position.x = pos[0];
		mesh.position.y = pos[1];
		mesh.position.z = pos[2];

		const normal = new THREE.Vector3(
			Math.sin(this.position[1]) * Math.cos(this.position[0]), 
			Math.cos(this.position[1]), 
			Math.sin(this.position[1]) * Math.sin(this.position[0])
		);

		const quaternion = new THREE.Quaternion();
		quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
		mesh.quaternion.copy(quaternion);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		return mesh;
	}




	#createPetalGeometry(_radius, _height, _dTheta, _ringFrac) {
		const dTheta = _dTheta; // Angle over which the petal curves

		const radialSegments = 16;
		const heightSegments = 32;

		const geometry = new THREE.BufferGeometry();
		const uvs = [];
		const vertices = [];
		const indices = [];


		
		const topStemRad = this.#stemRadFunc(1);

		// const radFunc = (yFrac, thetaFrac) => (Math.sin(yFrac * Math.PI * 0.25) * 0.7 + 0.1 * thetaFrac) * petalRad + topStemRad;
		// const radFunc = (yFrac, thetaFrac) => (Math.sin(yFrac * Math.PI * 0.25) * 0.7 + 0.1 * thetaFrac) * _radius;
		const petalFlare = 0.2; // How much a petal twists inwards over its radial axis
		const radFunc = (yFrac, thetaFrac, ringFrac) => (
			(
				(1 - Math.cos(2.5 * yFrac * (ringFrac * 0.3 + 0.7))) * 0.5 + 
				Math.sin(3.15 * yFrac) * 0.5
			) * (1 - petalFlare)
			+ petalFlare * thetaFrac
		) * _radius
				

		// Generate vertices
		for (let y = 0; y <= heightSegments; y++) 
		{
			const curYFrac = y / heightSegments;
			

			for (let x = 0; x <= radialSegments; x++) 
			{
				const theta = x / radialSegments * dTheta;
				const radius = radFunc(curYFrac, x / radialSegments, _ringFrac); // Invert mapping such that yFrac = 1 is at the top 

				const posX = radius * Math.cos(theta);
				const posY = curYFrac * _height * (0.8 + 0.2 * Math.sin(x / radialSegments * Math.PI));
				const posZ = radius * Math.sin(theta);

				vertices.push(posX, posY, posZ);
				uvs.push(x / radialSegments, curYFrac);
			}
		}

		for (let y = 0; y < heightSegments; y++) 
		{
			for (let x = 0; x < radialSegments; x++) 
			{
				const a = y * (radialSegments + 1) + x;
				const b = a + radialSegments + 1;
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




	#createBranchGeometry(_generationsToTip, _subBranchCount, _radius, _curLength, _startPos, _startNormal) {
		let geometries = [];		

		const nextGenerationRadius = 0.7 * _radius;
		const nextGenLength = 0.7 * _curLength;
		let curGeo = generateStemGeometry(p => _radius * p + nextGenerationRadius * (1 - p), p => [0, 0], _curLength);		
	
		const quaternion = new THREE.Quaternion();
		quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _startNormal);
		curGeo.applyQuaternion(quaternion);

		curGeo.translate(..._startPos); // Set branch at right position

		let branchEndPos = _startPos.clone().addScaledVector(_startNormal.clone().normalize().multiplyScalar(_curLength), 1); // Move position for subbranches
		geometries.push(curGeo);

		if (_generationsToTip <= 0) return geometries; // Add some leaves etc?


		const n = _startNormal.clone();
		
		// Define a plane perpendicular to the normal n
		const helper = Math.abs(n.y) < 0.99
		  ? new THREE.Vector3(0, 1, 0)
		  : new THREE.Vector3(1, 0, 0);

		const t = helper
		  .addScaledVector(n, -helper.dot(n))
		  .normalize();
		const u = new THREE.Vector3().crossVectors(n, t).normalize();

		// Define a circle from which to sample our next branch normals
		const theta = 0.2 * Math.PI;
		const circleRadius = Math.sin(theta);
		const circleCenter = n.clone().multiplyScalar(Math.cos(theta));

		for (let b = 0; b < _subBranchCount; b++)
		{
			const phi = 2 * Math.PI * b / _subBranchCount;
		  	let curNormal = circleCenter.clone()
			    .addScaledVector(t, circleRadius * Math.cos(phi))
			    .addScaledVector(u, circleRadius * Math.sin(phi));
			geometries = geometries.concat(this.#createBranchGeometry(_generationsToTip - 1, _subBranchCount, nextGenerationRadius, nextGenLength, branchEndPos, curNormal));
		}

		return geometries;
	}


	#createTreeTopMesh() {
		const topStemOffset = this.#stemOffsetFunc(1);
		const trunkNormal = new THREE.Vector3(
			Math.sin(this.position[1]) * Math.cos(this.position[0]), 
			Math.cos(this.position[1]), 
			Math.sin(this.position[1]) * Math.sin(this.position[0])
		);


		const generations = 4;
		const branchesPerGen = 3; 
		const baseRadius = 0.3 * this.#stemRadius;
		const baseLength = 2;
		let geometries = [];
		
		let startPos = new THREE.Vector3(0, 0, 0);
		

		
		const n = trunkNormal.clone();
		
		// Define a plane perpendicular to the normal n
		const helper = Math.abs(n.y) < 0.99
		  ? new THREE.Vector3(0, 1, 0)
		  : new THREE.Vector3(1, 0, 0);

		const t = helper
		  .addScaledVector(n, -helper.dot(n))
		  .normalize();
		const u = new THREE.Vector3().crossVectors(n, t).normalize();


		// Define a circle from which to sample our next branch normals
		const theta = 0.2 * Math.PI;
		const circleRadius = Math.sin(theta);
		const circleCenter = n.clone().multiplyScalar(Math.cos(theta));
		
		for (let b = 0; b < branchesPerGen; b++)
		{	
			const phi = 2 * Math.PI * b / branchesPerGen;
		  	let curNormal = circleCenter.clone()
			    .addScaledVector(t, circleRadius * Math.cos(phi))
			    .addScaledVector(u, circleRadius * Math.sin(phi));
			// curNormal.randomDirection()
			geometries = geometries.concat(this.#createBranchGeometry(generations, branchesPerGen, baseRadius, baseLength, startPos, curNormal));
		}
	

		let geometry = mergeGeometries(geometries);
		geometry.translate(topStemOffset[0], 0, topStemOffset[1]);


		let material = new THREE.MeshLambertMaterial({color: 0xc05040});

		material.side = THREE.DoubleSide; // Fix cliping issues
		let mesh = new THREE.Mesh(geometry, material);
		let pos = this.calcPosAtRad(this._planet.baseRadius + this.#stemLength); // TODO 
		mesh.position.x = pos[0];
		mesh.position.y = pos[1];
		mesh.position.z = pos[2];
		
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		return mesh;
	}
	

	#generateMesh() {
		this.#hillMesh = this.#generateHillMesh();
		this.#stemMesh = this.#createStemMesh();
		this.#treeTopMesh = this.#createTreeTopMesh();


		this.#mesh = new THREE.Group();
		this.#mesh.add(this.#hillMesh);
		this.#mesh.add(this.#stemMesh);
		this.#mesh.add(this.#treeTopMesh);
		this.#mesh.position.x = 0;
		this.#mesh.position.z = 0;
		this.#mesh.position.y = 0;
	}

	update() {

	}

	animateMeshToCompletionState(_perc) {
		
	}
}






function orientFlowerHead(planetNormal, theta, phi) {
	const n = planetNormal.clone().normalize();

	// Choose a fixed reference direction.
	// This defines where theta = 0 is.
	const reference = Math.abs(n.y) < 0.999
		? new THREE.Vector3(0, 1, 0)
		: new THREE.Vector3(1, 0, 0);

	// Two axes tangent to the planet at this point
	const tangentX = new THREE.Vector3()
		.crossVectors(reference, n)
		.normalize();

	const tangentY = new THREE.Vector3()
		.crossVectors(n, tangentX)
		.normalize();

	// Direction around the planet's local tangent plane
	const tangentDirection = tangentX.clone()
		.multiplyScalar(Math.cos(theta))
		.add(
		  tangentY.clone().multiplyScalar(Math.sin(theta))
		);

	// Combine horizontal tilt and outward/upward direction
	const flowerDirection = tangentDirection
		.multiplyScalar(Math.cos(phi))
		.add(
		  n.clone().multiplyScalar(Math.sin(phi))
		)
		.normalize();

	const rotation = new THREE.Quaternion()
		.setFromUnitVectors(
		  new THREE.Vector3(0, 1, 0),
		  flowerDirection
		);

	return rotation;
}