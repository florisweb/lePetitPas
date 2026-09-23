import * as THREE from 'three';

import Star from './star.js';
import Sun from './sun.js';
import Planet from './planet.js';
import { random } from '../random.js';
import Camera from './camera.js';
import SpotLight from './spotLight.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';



import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';


import VulcanoParticleEffect from './vulcanoParticleEffect.js';

export default class Simulation {
	#App;
	camera;
	#composer;
	scene;

	spotLight;
	sun;
	planet;
	stars = [];

	#vulcanoParticleEffect; // temp

	constructor(_app) {
		this.#App = _app;
		this.spotLight = new SpotLight();
	}

	async setup() {
		this.camera = new Camera({renderer, simulation: this});
		this.#setUpScene();
		this.spotLight.addToScene(this.scene);

		this.#vulcanoParticleEffect = new VulcanoParticleEffect({renderer});
		this.#vulcanoParticleEffect.addToScene(this.scene);



		this.#defineComposer();

		



		this.update();
		renderer.domElement.addEventListener('click', () => this.#App.habitInfoPanel.close());
		document.body.appendChild(renderer.domElement);
		window.addEventListener('resize', () => this.resize());
		this.resize();
	}

	resize() {
		let panel = document.querySelector('habit-list-panel');
		if (panel) document.documentElement.style.setProperty('--panelHeight', panel.offsetHeight + 'px');

		renderer.setSize(renderer.domElement.offsetWidth, renderer.domElement.offsetHeight, false); // FIXME
		this.camera.onResize();
	}

	update() {
		this.planet.update();
		this.sun.update();
		for (let star of this.stars) star.update();

		if (this.planet.objects.length > 0)
		{
			this.#vulcanoParticleEffect.update(this);
		}



		this.camera.update();
		// renderer.render(scene, camera.camera);
		this.#composer.render();


		// let centerPos = new THREE.Vector3(0, 0, 0);
		// let center = centerPos.project(camera.camera);	
		// for (let i = 0; i < trackedElements.length; i++)
		// {
		// 	let absPos = new THREE.Vector3(...planet.objects[i].relPosition).multiplyScalar(1.2);
		// 	let relPxPos = absPos.project(camera.camera);
		// 	const attachedOnLeft = relPxPos.x < 0;
			
		// 	const objX = (1 + relPxPos.x) / 2 * renderer.domElement.width;
		// 	const objY = (1 - relPxPos.y) / 2 * renderer.domElement.height;
		// 	const labelX = objX + 50 * (attachedOnLeft ? -1 : 1);

		// 	trackedElements[i].style.left = labelX + 'px';
		// 	trackedElements[i].style.top = objY + 'px';

			
		// 	let dz = (center.z - relPxPos.z);
		// 	trackedElements[i].classList.toggle('hide', dz < 0 || center.z > 0.9985 || center.z < 0.995);
		// 	trackedElements[i].classList.toggle('attachedOnLeft', attachedOnLeft);
		// }

		requestAnimationFrame(() => this.update());
	}

	#defineComposer() {
		this.#composer = new EffectComposer(renderer);
		const renderPass = new RenderPass(this.scene, this.camera.camera);
		this.#composer.addPass(renderPass);

		const bloomPass = new UnrealBloomPass(
		  new THREE.Vector2(window.innerWidth, window.innerHeight),
		  0.5,    // strength
		  0.01,    // radius
		  // 0.85    // threshold
		  0.5    // threshold
		);
		this.#composer.addPass(bloomPass);
	}


	#setUpScene() {


		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000010); // Deep dark blue

		this.#defineLighting();

		this.planet = new Planet();
		this.planet.addToScene(this.scene);


		for (let i = 0; i < 500; i++)
		{
			const star = new Star();
			star.addToScene(this.scene);
			this.stars.push(star);
		}
	}

	#defineLighting() {
		this.sun = new Sun({camera: this.camera});
		this.sun.addToScene(this.scene);
		window.sun = this.sun;

		for (let a = 0; a < Math.PI * 2; a += Math.PI * 2 / 3)
		{
			const spotLight = new THREE.SpotLight( 0xffffff, 400 );
			const dist = 100;
			spotLight.position.set( Math.cos(a) * dist, 0, Math.sin(a) * dist );
			spotLight.castShadow = true;
			spotLight.lookAt(0, 0, 0);
			spotLight.shadow.bias = -0.00001; 
			spotLight.shadow.normalBias = -2;
			this.scene.add(spotLight);
		}
	}
}


// scene.fog = new THREE.Fog( 0xaaaaaa, 0, 150);
// scene.fog = new THREE.Fog( 0x333333, 0, 150);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;  // Better filtering

window.renderer = renderer;
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.setClearColor('#000000');



document.body.onscroll = (_e) => {
	let scroller = document.getElementById('scroller');
	if (!scroller) return;
	renderer.domElement.style.height = Math.round(scroller.getBoundingClientRect().y + 30) + 'px';
	// renderer.domElement.height = Math.round(scroller.getBoundingClientRect().y + 30);
	resize();
};










window.THREE = THREE;


// const trackedElements = document.querySelectorAll('.panel.tracked');
// for (let i = 0; i < trackedElements.length; i++)
// {
// 	trackedElements[i].addEventListener('click', () => camera.panToObject(planet.objects[i]));
// }


