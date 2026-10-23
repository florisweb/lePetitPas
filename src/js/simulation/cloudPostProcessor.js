import * as THREE from 'three';

import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import * as THREE_webGPU from 'three/webgpu';
import {
  Fn, If, instanceIndex, storageTexture, textureStore,
  uvec3, vec4
} from 'three/tsl';

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
	async #createCloudTexture() {
		let points = [];
		const cloudPointCount = 200;
		for (let i = 0; i < cloudPointCount; i++) 
		{
			points.push(0.5 + (1 - 2 * Math.random()) * 0.5 * 0.5, 0.5 - 0.1 * Math.random(), 0.5 + (2 * Math.random()**2-1) * 0.5 * 0.5);
		}

		let pointsData = new Float32Array(points);
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
		    cloudPoints: {value: pointsData}
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
		    uniform float cloudPoints[` + 3 * cloudPointCount + `];
		    float cloudRad = 0.05;
		    float cloudSharpness = 1.0;

		    void main() {
		      	float minDist = 1.0;
		    	vec3 curVoxPos = vec3(vUv.x, vUv.y, sliceZ);
		      	for (int p = 0; p < cloudPointCount; p++)
			    {
		    		vec3 curPoint = vec3(cloudPoints[3 * p + 0], cloudPoints[3 * p + 1], cloudPoints[3 * p + 2]);
		    		float curDist = distance(curPoint, curVoxPos);
		    		if (curDist > minDist) continue;
		    		minDist = curDist;
			    }

		  		gl_FragColor = vec4(min(max(cloudRad - minDist, 0.0) * cloudSharpness, 1.0));
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
			    uniform sampler2D tDiffuse;
			    uniform sampler2D depthTexture;
			    varying vec2 vUv;
			    // uniform float zNear;
			    // uniform float zFar;

			    uniform mat4 invProjection;
				uniform mat4 cameraWorld;
				uniform vec3 cloudCameraPosition;

				uniform sampler3D cloudTexture;
				
				float minDensity = 0.0;
				float DensityScalar = 1.0;

				float cloudBoxSize = 500.0;

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
					
					float density = max(0.0, textureVal - minDensity) * DensityScalar;
					return density;
				}

			    void main() {
			      	vec4 color = texture2D(tDiffuse, vUv);
					
					
					float depth = texture2D(depthTexture, vUv).r;
					// float view = 1.0 - smoothstep(0.995, 1.0, depth);

		
					vec3 rayEndPos = worldPositionFromDepth(vUv, depth); // In world coords
					vec3 ray = rayEndPos - cloudCameraPosition;
					float maxDistance = length(ray);
					vec3 rayDirection = ray / maxDistance;


					float curDist = 0.0;
					float maxDist = min(maxDistance, 1000.0);
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
					


					// gl_FragColor = vec4(rayDirection.xyz, 1.0);


			  		// Aim: calculate distance from camera to fragment, and integrate over that through our cloud to change the colour

			  		// gl_FragColor = vec4(vec3(depth) * 0.5, 1.0);
			  	
			  		// gl_FragColor = vec4(vec3((color.r + color.g + color.b)/3.0), 1.0); // Greyscale
			  		// color * (0.5 + 0.2 * gl_FragCoord.x);
			    }
			`
		}, simulation.camera.camera);
		
		this._pixelPass.uniforms.cloudTexture.value = this._cloudTexture;

		// this._shaderMaterial = new THREE.ShaderMaterial({
		//   uniforms: {
		//     texturePosition: { value: null },
		//   },
		//   vertexShader: `
		//     uniform sampler2D texturePosition;
		    
		//     varying vec3 vColor;

		//     void main() {
		//        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		//     }
		//   `,
		//   fragmentShader: `
		//     varying vec3 vColor;

		//     void main() {
		//       	float dist = distance(gl_FragCoord.xy, vec2(0.5)) / 30.0;
		     
		      
		//   		gl_FragColor = vec4(1.0, 0.0, 0.0, max(1.0 - dist, 0.5));
		//     }
		//   `,
		//   transparent: true,
		//   emissiveIntensity: 2.0
		// });
	}

	addToComposer(_composer) {
		_composer.addPass(this._pixelPass);
	}

	update(_simulation) {
		// this._pixelPass.uniforms.depthTexture.value = this.#composer.renderTarget1.depthTexture;
		


		// const volcPos = _simulation.planet.objects[0].relPosition;

		// this.#time += 0.016;

		// this.#dtPosition.material.uniforms.uDeltaTime.value = 0.016;
		// this.#dtPosition.material.uniforms.uTime.value = this.#time;
		// this.#dtVelocity.material.uniforms.uDeltaTime.value = 0.016;
		// this.#dtVelocity.material.uniforms.uTime.value = this.#time;
		// this.#dtVelocity.material.uniforms.volcanoPos.value = volcPos;
		// this.#dtPosition.material.uniforms.volcanoPos.value = volcPos;

		// this._gpuCompute.compute();
		// this._particleShaderMaterial.uniforms.texturePosition.value = this._gpuCompute.getCurrentRenderTarget(this.#dtPosition).texture;
	}
}


