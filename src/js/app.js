import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Star from './star.js';
import Sun from './sun.js';
import Planet from './planet.js';
import { Perlin, random } from './random.js';

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
scene.background = new THREE.Color(0x000010); // Deep dark blue
// scene.fog = new THREE.Fog( 0xaaaaaa, 0, 150);
// scene.fog = new THREE.Fog( 0x333333, 0, 150);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;  // Better filtering

window.renderer = renderer;
// renderer.setClearColor('#e5e5e5');
renderer.setClearColor('#000000');
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);
window.addEventListener('resize', () => resize());

function resize() {
	renderer.setSize(renderer.domElement.offsetWidth, renderer.domElement.offsetHeight);
	
	Camera.aspect = renderer.domElement.width / renderer.domElement.height;
	Camera.updateProjectionMatrix();
}
window.resize = resize;




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




document.body.onscroll = (_e) => {
	let scroller = document.getElementById('scroller');
	if (!scroller) return;
	renderer.domElement.style.height = Math.round(scroller.getBoundingClientRect().y + 30) + 'px';
	// renderer.domElement.height = Math.round(scroller.getBoundingClientRect().y + 30);
	resize();
};

const sun = new Sun();
sun.addToScene(scene);

const planet = new Planet();
planet.addToScene(scene);


const stars = [];
for (let i = 0; i < 500; i++)
{
	const star = new Star();
	star.addToScene(scene);
	stars.push(star);
}

const controls = new OrbitControls( Camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.2;
window.controls = controls;



// 3. Set up bloom post-processing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, Camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,    // strength
  0.1,    // radius
  // 0.85    // threshold
  0.5    // threshold
);
composer.addPass(bloomPass);






function update() {
	planet.update();
	sun.update();
	for (let star of stars) star.update();


	controls.update();
	// renderer.render(scene, Camera);
	composer.render();
	requestAnimationFrame(update);
}
update();



export default App;