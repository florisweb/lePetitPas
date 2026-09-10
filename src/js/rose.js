import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';



import { Perlin, random } from './random.js';
import Planet from './planet.js';
import { generatePatchGeometry } from './geometryGenerator.js';
import PlanetObject from './planetObject.js'

export default class Rose extends PlanetObject {
	#mesh;
	#hillMesh;
	#stemMesh;
	#flowerMesh;


	get mesh() {return this.#mesh};

	
	#hillHeight = 0.7;
	#hillRadius = 2.0;
	#stemLength = 4;
	#stemRadius = 0.1;

	#flowerHeight = 1.5;
	#flowerRad = 1.2;
	#creationTime = Date.now() + Math.random() * 1000;

	constructor({}, _planet) {
		// let position = [random() * Math.PI * 2, (random() * 0.2 + 0) * Math.PI];
		let position = [random() * Math.PI * 2, (random() * 0.5 + 0.25) * Math.PI];
		super(position, _planet)


		this.#generateMesh();
	}
	



	#generateHillMesh() {
		const patchSize = this.#hillRadius * 2;
		const segDensity = Planet.segCount / (Math.PI * this._planet.baseRadius) * 3.0;
		let geometry = generatePatchGeometry((theta, phi) => this.#hillRadialFunction(theta, phi), [patchSize, patchSize], this.position, segDensity, this._planet.baseRadius);
		
		let material = new THREE.MeshLambertMaterial({
			map: this.#createHillTexture(),
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




	#stemRadFunc(_yFrac) {
		return (_yFrac * 0.6 + 0.4) * this.#stemRadius;
	}
	#stemOffsetFunc(_yFrac) {
		return [Math.cos(_yFrac * 2 * Math.PI) * 0.15, Math.sin(_yFrac * Math.PI) * 0.1]; // offset in xz plane
	}

	#createStemGeometry(_height, _thickness) {
		const radialSegments = 16;
		const heightSegments = 32;

		const geometry = new THREE.BufferGeometry();
		const uvs = [];
		const vertices = [];
		const indices = [];


		// Generate vertices
		for (let y = 0; y <= heightSegments; y++) 
		{
			const curYFrac = y / heightSegments;
			const radius = this.#stemRadFunc(1 - curYFrac); // Invert mapping such that yFrac = 1 is at the top 
			const offset = this.#stemOffsetFunc(1 - curYFrac);

			for (let x = 0; x <= radialSegments; x++) 
			{
				const theta = x / radialSegments * 2 * Math.PI;

				const posX = radius * Math.cos(theta) + offset[0];
				const posY = curYFrac * _height;
				const posZ = radius * Math.sin(theta) + offset[1];

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

	
	#createStemMesh() {
		let geometry = this.#createStemGeometry(this.#stemLength);
		let material = new THREE.MeshLambertMaterial({color: 0x50c040});

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




	#createFlowerMesh() {
		const topStemOffset = this.#stemOffsetFunc(1);
		const topStemOffsetDy = this.#stemOffsetFunc(1 + 0.01);
		let stemNormal = new THREE.Vector3(topStemOffsetDy[0] - topStemOffset[0], 0.01 * this.#flowerHeight, topStemOffsetDy[1] - topStemOffset[1]).normalize();

		const innerPetalCount = 3;
		const layerCount = 3;
		// const layerCount = 1;
		const innerRadius = this.#flowerRad / layerCount;
		const petalOverlapFrac = 0.6;
		const petalArcLength = innerRadius * 2 * Math.PI / (innerPetalCount * (1 - petalOverlapFrac));
		let geometries = [];
		for (let l = 0; l < layerCount; l++)
		{
			const radius = (l + 1) * innerRadius;
			const height = ((layerCount - l) / layerCount * 0.2 + 0.8) * this.#flowerHeight;
			const petalCount = radius / innerRadius * innerPetalCount;
			// const petalCount = 1;
			const curArc = radius * 2 * Math.PI;
			const dTheta = petalArcLength / curArc * 2 * Math.PI;

			for (let p = 0; p < petalCount; p++)
			{
				let curGeo = this.#createPetalGeometry(radius, height, dTheta, l / layerCount);
				curGeo.rotateY(p * dTheta);
				geometries.push(curGeo);
			}
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

		const normal = new THREE.Vector3(
			Math.sin(this.position[1]) * Math.cos(this.position[0]), 
			Math.cos(this.position[1]), 
			Math.sin(this.position[1]) * Math.sin(this.position[0])
		);

		const quaternion = new THREE.Quaternion();
		quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal.addScaledVector(stemNormal, 1));
		mesh.quaternion.copy(quaternion);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		return mesh;
	}



	#generateMesh() {
		this.#hillMesh = this.#generateHillMesh();
		this.#stemMesh = this.#createStemMesh();
		this.#flowerMesh = this.#createFlowerMesh();


		this.#mesh = new THREE.Group();
		this.#mesh.add(this.#hillMesh);
		this.#mesh.add(this.#stemMesh);
		this.#mesh.add(this.#flowerMesh);
		this.#mesh.position.x = 0;
		this.#mesh.position.z = 0;
		this.#mesh.position.y = 0;
	}

	update() {
		
	}
}



