import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default class Camera {
	controls;
	camera;
	#renderer;
	constructor({renderer}) {
		this.#renderer = renderer;
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);

		this.camera.position.x = 70;
		this.camera.position.y = 0;
		this.camera.position.z = 0;
		this.camera.lookAt(0, 0, 0);


		this.controls = new OrbitControls( this.camera, renderer.domElement );
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.autoRotate = true;
		this.controls.autoRotateSpeed = 0.2;
	}

	update() {
		this.controls.update();
	}
	
	onResize() {
		this.camera.aspect = this.#renderer.domElement.width / this.#renderer.domElement.height;
		this.camera.updateProjectionMatrix();
	}
}


