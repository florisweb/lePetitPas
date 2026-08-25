import * as THREE from 'three';
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


const scene = new THREE.Scene();
// scene.fog = new THREE.Fog( 0xaaaaaa, 0, 150);
// scene.fog = new THREE.Fog( 0x333333, 0, 150);
const renderer = new THREE.WebGLRenderer({antialias: true});


// renderer.setClearColor('#e5e5e5');
renderer.setClearColor('#000000');
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);
window.addEventListener('resize', function() {
	// World.renderer.setSize(window.innerWidth, window.innerHeight);
	

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

// let ambientLight = new THREE.AmbientLight(0xffffff, .01);
// scene.add(ambientLight);





const blockSize = 1;

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
			const theta = (x / widthSegments) * Math.PI * 2; // 0 to 2π (around)

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

	geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
	geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
	geometry.computeVertexNormals();

	return geometry;
}



function _perlin(_frequency) {
	this.f = _frequency; 
	this.get = function(theta, phi) { // Input: 0 - 2pi, 0 - pi
		const u = theta / (2 * Math.PI);
		const v = phi / Math.PI;

		const compFreqU = this.f * Math.sin(phi)**0.2;
		
		return Perlin.get(u * compFreqU, v * this.f) * Math.abs(Math.sin(theta)) * Math.abs(Math.sin(phi));
	}
}
let Perlin1 = new _perlin(5);
let Perlin2 = new _perlin(15);
let Perlin3 = new _perlin(50);
window.Perlin1 = Perlin1;
window.Perlin2 = Perlin2;
window.Perlin3 = Perlin3;



const segCount = 100;
const planetRad = 20;
const planetRadialFunc = (theta, phi) => (1 + 
	Perlin1.get(theta, phi) * 0.1 + 
	Perlin2.get(theta, phi) * 0.07 + 
	Perlin3.get(theta, phi) * 0.03
	) * planetRad;

const planetGeo = generatePLanetGeometry(planetRadialFunc, segCount * 2, segCount);


let material = new THREE.MeshLambertMaterial({color: 0xffffff});
// let material = new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: false});
// let material = new THREE.MeshNormalMaterial();

let planetMesh = new THREE.Mesh(planetGeo, material);

planetMesh.position.x = 0;
planetMesh.position.z = 0;
planetMesh.position.y = 0;

scene.add(planetMesh);
window.planetMesh = planetMesh;


let sunAngle = 0;
planetMesh.rotateX((Math.random() * 2 - 1) * Math.PI);

function update() {
	sunAngle += 0.01;
	sunAngle = sunAngle % (2 * Math.PI);


	sunLight.position.set(Math.sin(sunAngle) * sunDistance, 0, Math.cos(sunAngle) * sunDistance);

	planetMesh.rotateY(0.01);


	renderer.render(scene, Camera);
	requestAnimationFrame(update);
}
update();



export default App;