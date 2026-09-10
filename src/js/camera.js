import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default class Camera {
	controls;
	camera;
	#renderer;
	constructor({renderer}) {
		window.camera = this;
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
		this.controls.enablePan = false;
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.autoRotate = true;
		this.controls.autoRotateSpeed = 0.2;
		this.controls.minZoom = 5;
	}

	update() {
		this.controls.update();
	}
	
	onResize() {
		this.camera.aspect = this.#renderer.domElement.width / this.#renderer.domElement.height;
		this.camera.updateProjectionMatrix();
	}

	zoomToObject(_obj) {
		let dPhi = camera.controls.getPolarAngle() - _obj.absoluteAnglePos[1];
		camera.controls.rotateUp(dPhi);

		let theta = -(camera.controls.getAzimuthalAngle() - 0.5 * Math.PI); // Convert azimuth angle to our angle system
		let dTheta = -(theta - _obj.absoluteAnglePos[0]);
		if (dTheta < -Math.PI) dTheta += Math.PI * 2;
		if (dTheta > Math.PI) dTheta -= Math.PI * 2;

		camera.controls.rotateLeft(dTheta);
	}
}


