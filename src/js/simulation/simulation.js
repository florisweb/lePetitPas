import * as THREE from 'three';

import Star from './star.js';
import Sun from './sun.js';
import Planet from './planet.js';

import { random } from '../random.js';
import Camera from './camera.js';
import SpotLight from './spotLight.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { animateSigmoidally } from '../animator.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import CloudPostProcessor from './cloudPostProcessor.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';


import VolcanoParticleEffect from './volcanoParticleEffect.js';

export default class Simulation {
	#App;
	camera;
	composer;
	scene;

	spotLight;
	sun;
	planet;
	stars = [];

	#volcanoParticleEffect; // temp

	constructor(_app) {
		this.#App = _app;
		this.spotLight = new SpotLight();
	}

	async setup() {
		this.camera = new Camera({renderer, simulation: this});
		this.#setUpScene();
		this.spotLight.addToScene(this.scene);

		this.#volcanoParticleEffect = new VolcanoParticleEffect({renderer});
		this.#volcanoParticleEffect.addToScene(this.scene);


		this.#defineComposer();


		this.update();
		renderer.domElement.addEventListener('click', () => this.#App.habitInfoPanel.close());
		document.body.appendChild(renderer.domElement);
		window.addEventListener('resize', () => this.resize());
		this.resize();
	}

	resize(_resizeDuration = 300) {
		let panel = document.querySelector('.UIPanel[openState="true"]');
		if (panel) 
		{
			let panelHeight = panel.offsetHeight - 40;
			document.documentElement.style.setProperty('--panelHeight', panelHeight + 'px');

			const targetTop = -0.5 * panelHeight;
			let prevTop = parseInt(renderer.domElement.style.top) || targetTop; // If no value is found, assume that we are already in the right spot
			animateSigmoidally(_resizeDuration, (_perc) => {
				renderer.domElement.style.top = (prevTop * (1 - _perc) + targetTop * _perc) + 'px'
			});
		}
		
		renderer.setSize(renderer.domElement.offsetWidth, renderer.domElement.offsetHeight, false); // FIXME
		this.camera.onResize();
	}

	update() {
		this.planet.update();
		this.sun.update();
		for (let star of this.stars) star.update();

		if (this.planet.objects.length > 0)
		{
			this.#volcanoParticleEffect.update(this);
		}

		this.camera.update();
		this.composer.render();

		requestAnimationFrame(() => this.update());
	}

	#defineComposer() {
		// this.#composer = new EffectComposer(renderer);
		// const renderPass = new RenderPass(this.scene, this.camera.camera);
		// this.#composer.addPass(renderPass);
		// this.cloudPostProcessor.addToComposer(this.#composer);
		// this.#composer.addPass(new OutputPass());


		const target = new THREE.WebGLRenderTarget(
		  window.innerWidth,
		  window.innerHeight
		);

		target.depthTexture = new THREE.DepthTexture(
		  window.innerWidth,
		  window.innerHeight,
		  THREE.UnsignedIntType
		);
		this.composer = new EffectComposer(renderer, target);

		this.cloudPostProcessor = new CloudPostProcessor({renderer, composer: this.composer, simulation: this});


		const renderPass = new RenderPass(this.scene, this.camera.camera);
		this.composer.addPass(renderPass);
		this.cloudPostProcessor.addToComposer(this.composer);
		this.composer.addPass(new OutputPass());



		// const bloomPass = new UnrealBloomPass(
		//   new THREE.Vector2(window.innerWidth, window.innerHeight),
		//   0.5,    // strength
		//   0.01,    // radius
		//   // 0.85    // threshold
		//   0.5    // threshold
		// );
		// this.#composer.addPass(bloomPass);

	}


	#setUpScene() {
		this.scene = new THREE.Scene();
		// this.scene.background = new THREE.Color(0x000010); // Dark mode
		// this.scene.background = new THREE.Color(0x101010);
		// this.scene.background = new THREE.Color(0xfffffa); // Light mode
		this.scene.background = new THREE.Color(0xF3E0C8); // Cream
		


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

		const dist = 100;
		const intensity = 4000; // 400 
		for (let a = 0; a < Math.PI * 2; a += Math.PI * 2 / 3)
		{
			let spotLight = new THREE.SpotLight( 0xffffff, intensity );
			spotLight.position.set( Math.cos(a) * dist, 0, Math.sin(a) * dist );
			spotLight.castShadow = true;
			spotLight.lookAt(0, 0, 0);
			spotLight.shadow.bias = -0.00001; 
			spotLight.shadow.normalBias = -2;
			this.scene.add(spotLight);
		}

		let spotLight = new THREE.SpotLight( 0xffffff, intensity );
		spotLight.position.set(0, dist, 0 );
		spotLight.castShadow = true;
		spotLight.lookAt(0, 0, 0);
		spotLight.shadow.bias = -0.00001; 
		spotLight.shadow.normalBias = -2;
		this.scene.add(spotLight);

		spotLight = new THREE.SpotLight( 0xffffff, intensity );
		spotLight.position.set(0, -dist, 0 );
		spotLight.castShadow = true;
		spotLight.lookAt(0, 0, 0);
		spotLight.shadow.bias = -0.00001; 
		spotLight.shadow.normalBias = -2;
		this.scene.add(spotLight);
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


