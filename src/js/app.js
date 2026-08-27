import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


import Perlin from './perlin.js';
window.Perlin = Perlin;

const App = new class {
	

	constructor() {
		window.App = this;

		this.setup().then(() => document.body.classList.remove('loading'));
	}

	async setup() {
		
	}

	update(_dt) {
		
	}

	get scene() {
		return scene;
	}
	get camera() {
		return Camera;
	}
	get renderer() {
		return renderer;
	}
}

function sfc32(a, b, c, d) {
  return function() {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

const seedgen = () => (Math.random()*2**32)>>>0;
const seeds = [
	1780232005.7055693,
	1136128467.3685474,
	3203140060.045385,
	2691260000.207778,
];
seeds[0] *= Math.random();
seeds[1] *= Math.random();
seeds[2] *= Math.random();
seeds[3] *= Math.random();
const random = sfc32(...seeds);
window.random = random;



const scene = new THREE.Scene();
// scene.fog = new THREE.Fog( 0xaaaaaa, 0, 150);
// scene.fog = new THREE.Fog( 0x333333, 0, 150);
const renderer = new THREE.WebGLRenderer({antialias: true});


// renderer.setClearColor('#e5e5e5');
renderer.setClearColor('#000000');
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);
window.addEventListener('resize', function() {
	// Camera.resize();
	Camera.aspect = window.innerWidth / window.innerHeight;
	Camera.updateProjectionMatrix();
});





const Camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
Camera.position.x = 70;
Camera.position.y = 0;
Camera.position.z = 0;
Camera.lookAt(0, 0, 0);


const sunDistance = 10000;
let sunLight = new THREE.PointLight(0xffffff, sunDistance**2 * 1, 0, 2);
sunLight.position.set(0, 0, sunDistance);
scene.add(sunLight);
window.sunLight = sunLight;

// let ambientLight = new THREE.AmbientLight(0xffffff, .1);
// scene.add(ambientLight);








// function generatePLanetGeometry(baseRadius, widthSegments = 32, heightSegments = 16) {
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


function generatePLanetGeometry(radiusFunction, widthSegments = 32, heightSegments = 16) {
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


// const segCount = 100;
const segCount = 100;
const planetRad = 20;

function calcPlanetPerlin(theta, phi, targetWavelength) {
	const relCircumference = Math.sin(phi);
	const realWavelength = targetWavelength / relCircumference;
	const fittedFreq = Math.round(1/realWavelength); // 1 / wavelength should be an integer to wrap nicely

	return Perlin.get(theta / Math.PI / 2 * fittedFreq, phi / Math.PI * fittedFreq);

}
const planetRadialFunc = (theta, phi) => {
	let baseRad = planetRad * (
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



const planetGeo = generatePLanetGeometry(planetRadialFunc, segCount * 2, segCount);
// const planetGeo = generatePLanetGeometry(planetRad, segCount * 2, segCount);

let material = new THREE.MeshLambertMaterial({color: 0xffffff});
// let material = new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: false});
// let material = new THREE.MeshNormalMaterial();
material.side = THREE.DoubleSide; // Fix cliping issues



let planetMesh = new THREE.Mesh(planetGeo, material);
// let planetMesh = new THREE.Mesh(wireframeGeo, material);


planetMesh.position.x = 0;
planetMesh.position.z = 0;
planetMesh.position.y = 0;

scene.add(planetMesh);
window.planetMesh = planetMesh;






const starGeo = new THREE.SphereGeometry(5, 16, 16);
let starMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
let starMesh = new THREE.Mesh(starGeo, starMaterial);
starMesh.position.z = 25;
starMesh.position.x = 15;
scene.add(starMesh);

window.starMesh = starMesh;

window.THREE = THREE;

const controls = new OrbitControls( Camera, renderer.domElement );




let sunAngle = 0;
// planetMesh.rotateX((Math.random() * 2 - 1) * Math.PI);
planetMesh.rotateZ(-0.1 * Math.PI);

function update() {
	sunAngle += 0.01;
	sunAngle = sunAngle % (2 * Math.PI);


	sunLight.position.set(Math.sin(sunAngle) * sunDistance, 0, Math.cos(sunAngle) * sunDistance);

	planetMesh.rotateY(-0.01);

	controls.update();
	renderer.render(scene, Camera);
	requestAnimationFrame(update);
}
update();



export default App;