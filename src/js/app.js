import * as THREE from 'three';

import Star from './star.js';
import Sun from './sun.js';
import Planet from './planet.js';
import { random } from './random.js';
import Camera from './camera.js';


const App = new class {
	constructor() {
		window.App = this;

		this.setup().then(() => document.body.classList.remove('loading'));
	}

	async setup() {
		
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
	Camera.onResize();
}
window.resize = resize;






document.body.onscroll = (_e) => {
	let scroller = document.getElementById('scroller');
	if (!scroller) return;
	renderer.domElement.style.height = Math.round(scroller.getBoundingClientRect().y + 30) + 'px';
	// renderer.domElement.height = Math.round(scroller.getBoundingClientRect().y + 30);
	resize();
};


const camera = new Camera({renderer});

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






// 3. Set up bloom post-processing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera.camera);
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


	camera.update();
	// renderer.render(scene, camera.camera);
	composer.render();
	requestAnimationFrame(update);
}
update();



export default App;