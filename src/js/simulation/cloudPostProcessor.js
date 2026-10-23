import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

class CloudShader extends ShaderPass {
	constructor(_config, _camera) {
		super(_config)
		this.camera = _camera;
	}
	render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
		this.uniforms.depthTexture.value = readBuffer.depthTexture;

		this.camera.updateMatrixWorld();
		this.uniforms.invProjection.value.copy(this.camera.projectionMatrixInverse);
		this.uniforms.cameraWorld.value.copy(this.camera.matrixWorld);
		this.uniforms.cloudCameraPosition.value.setFromMatrixPosition(this.camera.matrixWorld);
		super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
	}
}

export default class CloudPostProcessor {
	_pixelPass;
	#composer;
	_cloudTexture;
	_cloudBoxSize = 500;
	#planetRadPadding = 0.5; // Defines the area around the planet in units planet radius where no cloud points can be placed

	async #createCloudTexture() {
		let points = [];
		const cloudPointCount = 50;
		let pointsData = new Float32Array(cloudPointCount * 4);
		const innerRad = (20 / this._cloudBoxSize) * (1 + this.#planetRadPadding);
		const outerRad = 0.5;
		for (let i = 0; i < cloudPointCount; i++) 
		{	
			let theta = Math.random() * 2 * Math.PI;
			let phi = (Math.random() * 0.5 + 0.5) * Math.PI; // Only allow clouds in the bottom half 
			let radius = (outerRad - innerRad) * Math.random() + innerRad;

			pointsData[i * 4 + 0] = radius * Math.sin(phi) * Math.cos(theta) + 0.5;
			pointsData[i * 4 + 1] = radius * Math.cos(phi) + 0.5;
			pointsData[i * 4 + 2] = radius * Math.sin(phi) * Math.sin(theta) + 0.5;
			pointsData[i * 4 + 3] = 0.0;
		}

		const pointTexture = new THREE.DataTexture(
		  pointsData,
		  cloudPointCount, 1,
		  THREE.RGBAFormat,
		  THREE.FloatType
		);
		pointTexture.needsUpdate = true;

		
		window.pointsData = pointsData;

		const size = 512;
		const target = new THREE.WebGL3DRenderTarget(size, size, size);
		target.texture.minFilter = THREE.LinearFilter;
		target.texture.magFilter = THREE.LinearFilter;
		target.texture.format = THREE.RedFormat;
		target.texture.wrapS = THREE.ClampToEdgeWrapping;
		target.texture.wrapT = THREE.ClampToEdgeWrapping;
		target.texture.wrapR = THREE.ClampToEdgeWrapping;
		
		const sliceMaterial = new THREE.ShaderMaterial({
		  uniforms: {
		    sliceZ: {value: 0},
		    resolution: {value: new THREE.Vector2(size, size)},
		    cloudPointCount: {value: cloudPointCount},
		    cloudPointTexture: {value: pointTexture}
		  },
		  vertexShader: `
		    varying vec2 vUv;

		    void main() {
		      vUv = uv;
		      gl_Position = vec4(position.xy, 0.0, 1.0);
		    }
		  `,
		  fragmentShader: `
		    varying vec2 vUv;
		    uniform float sliceZ;
		    uniform vec2 resolution;
		    uniform int cloudPointCount;
		    // uniform float cloudPoints[` + 3 * cloudPointCount + `];
		    uniform sampler2D cloudPointTexture;
		    float cloudRad = 1.0; // Defines the radius from a point at which the cloud density = 0
		    float cloudSharpness = 50.0;
		    float maxDist = 1.0;

		    vec4 getPoint(int i) {
		      return texelFetch(cloudPointTexture, ivec2(i, 0), 0);
		    }

		    void main() {
	      	float minDist = maxDist;
	    		vec3 curVoxPos = vec3(vUv.x, vUv.y, sliceZ);
	      	for (int p = 0; p < cloudPointCount; p++)
		    	{
	    			vec3 curPoint = vec3(getPoint(p));
	    			float curDist = distance(curPoint, curVoxPos);
	    			if (curDist > minDist) continue;
	    			minDist = curDist;
		    	}

		  		// gl_FragColor = vec4(min(max(cloudRad - minDist, 0.0) * cloudSharpness, 1.0));
		    	// gl_FragColor = vec4(min(max(cloudRad - minDist, 0.0) / cloudRad, 1.0));
		    	gl_FragColor = vec4((maxDist - minDist) / maxDist);
		    }
		  `
		});

		const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), sliceMaterial);
		const sliceScene = new THREE.Scene();
		sliceScene.add(quad);

		const camera = new THREE.Camera();

		for (let z = 0; z < size; z++) {
		  sliceMaterial.uniforms.sliceZ.value = z / (size - 1);

		  renderer.setRenderTarget(target, z);
		  renderer.render(sliceScene, camera);
		}

		renderer.setRenderTarget(null);
		this._cloudTexture = target.texture;
	}
	
	constructor({simulation, renderer, composer}) {
		this.#composer = composer;
		this.#createCloudTexture();


		// Particle rendering material
		this._pixelPass = new CloudShader({
			uniforms: {
			    tDiffuse: {value: null},
			    depthTexture: {value: null},
			    invProjection: {value: new THREE.Matrix4()},
			    cameraWorld: {value: new THREE.Matrix4()},
			    cloudCameraPosition: {value: new THREE.Vector3()},
			    cloudTexture: {value: null},
			    cloudBoxSize: {value: this._cloudBoxSize},
			    minDensity: {value: 0.8}, 
			    densityScalar: {value: 0.2},
			    // cloudTexture: {value: this._cloudTexture},
			    // zNear: {value: simulation.camera.camera.near},
			    // zFar: {value: simulation.camera.camera.far}
			},
			vertexShader: `
			    varying vec2 vUv;

			    void main() {
			      vUv = uv;
			      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			    }
			`,
			fragmentShader: `
			  uniform float cloudBoxSize;
			  uniform sampler2D tDiffuse;
			  uniform sampler2D depthTexture;

		    varying vec2 vUv;

		    uniform mat4 invProjection;
				uniform mat4 cameraWorld;
				uniform vec3 cloudCameraPosition;

				uniform sampler3D cloudTexture;
				
				uniform float minDensity;
				uniform float densityScalar;

		    vec3 worldToTexturePos(vec3 worldPos) {
					return (worldPos + cloudBoxSize / 2.0) / cloudBoxSize;
		    }
				vec3 worldPositionFromDepth(vec2 uv, float depth) {
				  vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
				  vec4 view = invProjection * clip;
				  view /= view.w;

				  return (cameraWorld * view).xyz;
				}

				float sampleCloudDensity(vec3 position) {
					vec3 normalizedPosition = worldToTexturePos(position);
					if (length(normalizedPosition - vec3(0.5)) > 0.5) return 0.0;

					float textureVal = texture(cloudTexture, normalizedPosition).r;
					
					float density = max(0.0, textureVal - minDensity) * densityScalar;
					return density;
				}

		    void main() {
	      	vec4 color = texture2D(tDiffuse, vUv);
					
					float depth = texture2D(depthTexture, vUv).r;
					vec3 rayEndPos = worldPositionFromDepth(vUv, depth); // In world coords
					vec3 ray = rayEndPos - cloudCameraPosition;
					float maxDistance = length(ray);
					vec3 rayDirection = ray / maxDistance;

					float curDist = 0.0;
					float maxDist = min(maxDistance, 2.0 * cloudBoxSize);
					float stepSize = maxDist / 200.0; // /x: defines the amount of samples

					float totalDensity = 0.0;
					while (curDist < maxDist)
					{	
						vec3 curPos = rayDirection * curDist + cloudCameraPosition;
						float curDensity = sampleCloudDensity(curPos);
						totalDensity += curDensity * stepSize;
						curDist += stepSize;
					}

					float transmittance = exp(-totalDensity);
					gl_FragColor = vec4(color.rgb * transmittance + (1.0 - transmittance) * vec3(1.0), 1.0);
		    }
			`
		}, simulation.camera.camera);
		
		this._pixelPass.uniforms.cloudTexture.value = this._cloudTexture;
	}

	addToComposer(_composer) {
		_composer.addPass(this._pixelPass);
	}

	update(_simulation) {

	}
}


