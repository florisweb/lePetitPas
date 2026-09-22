import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { animateSigmoidally } from '../animator.js';

export default class Camera {
	static defaultZoomLevel = 70;
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


	putObjectInFocus(_obj, _angle = 0.1 * Math.PI) { // Looks at object from this angle (0 = from the top)
		// Update target
		let targetPos = _obj.calcPosAtRad(planet.baseRadius); // Position we want to have in the centre of the screen
		let animateTime = this.zoomTo(35); 
		this.#animateTargetPos(new THREE.Vector3(...targetPos), animateTime);
		let maxLoops = 1;

		let zoomToLoop = () => {
			let dPhi = this.controls.getPolarAngle() - _angle - _obj.absoluteAnglePos[1];
			this.controls.rotateUp(dPhi);

			let theta = -(this.controls.getAzimuthalAngle() - 0.5 * Math.PI); // Convert azimuth angle to our angle system
			let dTheta = -(theta - _obj.absoluteAnglePos[0]);
			if (dTheta < -Math.PI) dTheta += Math.PI * 2;
			if (dTheta > Math.PI) dTheta -= Math.PI * 2;

			this.controls.rotateLeft(dTheta);

			maxLoops--;
			if (maxLoops <= 0) return;
			setTimeout(zoomToLoop(), 500);
		}
		zoomToLoop();
	}
	deFocus() {
		let newPos = new THREE.Vector3(0, 0, 0);
		let animateTime = this.zoomTo(Camera.defaultZoomLevel);
		this.#animateTargetPos(newPos, animateTime);
	}
	#animateTargetPos(_newPos, _time=200) {
		let oldPos = this.controls.target;
		 
		let delta = _newPos.clone();
		delta.sub(oldPos);
		animateSigmoidally(_time, (_perc) => {
			let curPos = oldPos.clone();
			curPos.add(delta.clone().multiplyScalar(_perc));
			this.controls.target = curPos;
		}); 
	}

	panToObject(_obj, _customZoomLevel = Camera.defaultZoomLevel) {
		let dPhi = this.controls.getPolarAngle() - _obj.absoluteAnglePos[1];
		this.controls.rotateUp(dPhi);

		let theta = -(this.controls.getAzimuthalAngle() - 0.5 * Math.PI); // Convert azimuth angle to our angle system
		let dTheta = -(theta - _obj.absoluteAnglePos[0]);
		if (dTheta < -Math.PI) dTheta += Math.PI * 2;
		if (dTheta > Math.PI) dTheta -= Math.PI * 2;

		this.controls.rotateLeft(dTheta);
		this.zoomTo(_customZoomLevel);
	}

	zoomTo(_distance) {
		let initialDist = this.camera.position.distanceTo(new THREE.Vector3(0, 0, 0))
		const dDist = _distance - initialDist;
		let startTime = new Date();
		let panDuration = 200 + 5 * Math.abs(dDist);
		
		animateSigmoidally(panDuration, (_perc) => {
			this.camera.position.setLength(initialDist * (1 - _perc) + _distance * _perc);	
		});
		return panDuration;
	}
}


