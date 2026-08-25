import * as THREE from 'three';


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
scene.fog = new THREE.Fog( 0xffffff, 0, 150 );
const renderer = new THREE.WebGLRenderer({antialias: true});


renderer.setClearColor('#e5e5e5');
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
Camera.position.x = 2;
Camera.position.y = 2;
Camera.position.z = 0;
Camera.lookAt(0, 0, 0);



let light = new THREE.PointLight(0xffffff, 300, 0, 2);
light.position.set(10, 5, 0);
scene.add(light);

// let ambientLight = new THREE.AmbientLight(0xffffff, .6);
// scene.add(ambientLight);






const blockSize = 1;
let cursorGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);

let material = new THREE.MeshLambertMaterial({color: 0xff0000});
let BuildMesh = new THREE.Mesh(cursorGeometry, material);

BuildMesh.position.x = -blockSize/2;
BuildMesh.position.z = -blockSize/2;
BuildMesh.position.y = -blockSize/2;

scene.add(BuildMesh);

renderer.render(scene, Camera);



export default App;