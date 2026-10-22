import * as THREE from 'three';

import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
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
	#createCloudTexture() {
		const size = 128;
		const width = size;
		const height = size;
		const depth = size;
		const data = new Uint8Array(width * height * depth);
		const sharpness = 5;

		// Example: fill with a constant density.
		let points = [];
		for (let i = 0; i < 10; i++) points.push([0.5 + (1 - 2 * Math.random()) * 0.5 * 0.5, 0.5 + (1 - 2 * Math.random()) * 0.5 * 0.5, 0.5 + (1 - 2 * Math.random()) * 0.5 * 0.5]);

		for (let x = 0; x < width; x++)
		{
			for (let y = 0; y < height; y++)
			{
				for (let z = 0; z < depth; z++)
				{
					const index = x + width * y + width * height * z;
					let minDistSqrt = Infinity;

					for (let i = 0; i < points.length; i++)
					{
						let distSqrt = (points[i][0] - x/width)**2 + (points[i][1] - y/height)**2 + (points[i][2] - z/depth)**2;
						if (distSqrt > minDistSqrt) continue;
						minDistSqrt = distSqrt;
					}

					let density = Math.min(Math.max(0.05 - Math.sqrt(minDistSqrt), 0) * sharpness, 1);
					data[index] = Math.round(density * 255);
				}
			}
		}
		window.data = data;


		this._cloudTexture = new THREE.Data3DTexture(data, width, height, depth);
		this._cloudTexture.format = THREE.RedFormat;
		this._cloudTexture.type = THREE.UnsignedByteType;
		this._cloudTexture.minFilter = THREE.LinearFilter;
		this._cloudTexture.magFilter = THREE.LinearFilter;
		this._cloudTexture.wrapS = THREE.ClampToEdgeWrapping;
		this._cloudTexture.wrapT = THREE.ClampToEdgeWrapping;
		this._cloudTexture.wrapR = THREE.ClampToEdgeWrapping;
		this._cloudTexture.unpackAlignment = 1;
		this._cloudTexture.needsUpdate = true;
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
			    cloudTexture: {value: this._cloudTexture},
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
				float DensityScalar = 0.5;

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
		// this._pixelPass.uniforms.depthTexture.value = this.#composer.renderTarget1.depthTexture;
		
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


