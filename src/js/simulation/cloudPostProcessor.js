import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { random } from '../random.js';

class CloudShader extends ShaderPass {
	constructor(_config, _simulation) {
		super(_config)
		this.simulation = _simulation;
		this.light = _simulation.sun.mesh;
		this.camera = _simulation.camera.camera;
	}
	render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
		this.uniforms.depthTexture.value = readBuffer.depthTexture;

		this.camera.updateMatrixWorld();
		this.uniforms.invProjection.value.copy(this.camera.projectionMatrixInverse);
		this.uniforms.cameraWorld.value.copy(this.camera.matrixWorld);
		this.uniforms.cloudCameraPosition.value.setFromMatrixPosition(this.camera.matrixWorld);
		this.uniforms.lightPosition.value = this.light.position;
		super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
	}
}

export default class CloudPostProcessor {
	_pixelPass;
	#composer;
	_cloudTexture;
	_cloudTexture_fine;
	_cloudBoxSize = 120; //500;
	_cloudSubBoxCountPerAxis = 5; // Per axis: so x^3 = actual count
	#planetRadPadding = 0.5; // Defines the area around the planet in units planet radius where no cloud points can be placed

	// async #createCloudTexture() {
	// 	let points = [];
	// 	const cloudPointCount = 5000;
	// 	let pointsData = new Float32Array(cloudPointCount * 4);
	// 	const innerRad = (20 / this._cloudBoxSize) * (1 + this.#planetRadPadding);
	// 	const outerRad = 1.0;
	// 	for (let i = 0; i < cloudPointCount; i++) 
	// 	{	
	// 		const cloudScalar = random()**5 * 0.4 + 0.1;
	// 		const theta = random() * 2 * Math.PI;
	// 		const phi = (random() * 0.1 + 0.5) * Math.PI; // Only allow clouds in the bottom half 
	// 		const radius = (outerRad - innerRad) * random() + innerRad;
			
	// 		pointsData[i * 4 + 0] = radius * Math.sin(phi) * Math.cos(theta) + 0.5;
	// 		pointsData[i * 4 + 1] = radius * Math.cos(phi) + 0.5;
	// 		pointsData[i * 4 + 2] = radius * Math.sin(phi) * Math.sin(theta) + 0.5;
	// 		pointsData[i * 4 + 3] = cloudScalar; // Cloud scalar
	// 	}

	// 	const pointTexture = new THREE.DataTexture(
	// 	  pointsData,
	// 	  cloudPointCount, 1,
	// 	  THREE.RGBAFormat,
	// 	  THREE.FloatType
	// 	);
	// 	pointTexture.needsUpdate = true;

	
	// 	const size = 64;
	// 	const target = new THREE.WebGL3DRenderTarget(size, size, size);
	// 	target.texture.minFilter = THREE.LinearFilter;
	// 	target.texture.magFilter = THREE.LinearFilter;
	// 	target.texture.format = THREE.RedFormat;
	// 	target.texture.wrapS = THREE.ClampToEdgeWrapping;
	// 	target.texture.wrapT = THREE.ClampToEdgeWrapping;
	// 	target.texture.wrapR = THREE.ClampToEdgeWrapping;
		
	// 	const sliceMaterial = new THREE.ShaderMaterial({
	// 	  uniforms: {
	// 	    sliceZ: {value: 0},
	// 	    resolution: {value: new THREE.Vector2(size, size)},
	// 	    cloudPointCount: {value: cloudPointCount},
	// 	    cloudPointTexture: {value: pointTexture}
	// 	  },
	// 	  vertexShader: `
	// 	    varying vec2 vUv;

	// 	    void main() {
	// 	      vUv = uv;
	// 	      gl_Position = vec4(position.xy, 0.0, 1.0);
	// 	    }
	// 	  `,
	// 	  fragmentShader: `
	// 	    varying vec2 vUv;
	// 	    uniform float sliceZ;
	// 	    uniform vec2 resolution;
	// 	    uniform int cloudPointCount;
	// 	    uniform sampler2D cloudPointTexture;
	// 	    // float maxDist = 1.0;
	// 	    float maxDist = 0.5;

	// 	    vec4 getPoint(int i) {
	// 	      return texelFetch(cloudPointTexture, ivec2(i, 0), 0);
	// 	    }

	// 	    void main() {
	//       	float minDist = maxDist;
	//     		vec3 curVoxPos = vec3(vUv.x, vUv.y, sliceZ);
	//       	for (int p = 0; p < cloudPointCount; p++)
	// 	    	{
	//     			vec4 curPoint = vec4(getPoint(p));
	//     			float curDist = distance(vec3(curPoint), curVoxPos) / curPoint.w;
	//     			if (curDist > minDist) continue;
	//     			minDist = curDist;
	// 	    	}

	// 	  		float normDist = (maxDist - minDist) / maxDist;
	// 	    	gl_FragColor = vec4(pow(normDist, 3.0));
	// 	    }
	// 	  `
	// 	});

	// 	const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), sliceMaterial);
	// 	const sliceScene = new THREE.Scene();
	// 	sliceScene.add(quad);

	// 	const camera = new THREE.Camera();

	// 	for (let z = 0; z < size; z++) {
	// 	  sliceMaterial.uniforms.sliceZ.value = z / (size - 1);

	// 	  renderer.setRenderTarget(target, z);
	// 	  renderer.render(sliceScene, camera);
	// 	}

	// 	renderer.setRenderTarget(null);
	// 	this._cloudTexture = target.texture;
	// }


	#createCloudTexture(_boxCountPerAxix = this._cloudSubBoxCountPerAxis) {
		let pointsData = new Float32Array(_boxCountPerAxix**3 * 4);
		const boxSize = this._cloudBoxSize / _boxCountPerAxix;
		for (let x = 0; x < this._cloudSubBoxCountPerAxis; x++)
		{
			for (let y = 0; y < _boxCountPerAxix; y++)
			{
				for (let z = 0; z < _boxCountPerAxix; z++)
				{	
					const index = x + y * _boxCountPerAxix + z * _boxCountPerAxix**2;

					// Point relative to box
					pointsData[index * 4 + 0] = (random() * boxSize) / this._cloudBoxSize;
					pointsData[index * 4 + 1] = (random() * boxSize) / this._cloudBoxSize;
					pointsData[index * 4 + 2] = (random() * boxSize) / this._cloudBoxSize;
					// pointsData[index * 4 + 0] = 0; 
					// pointsData[index * 4 + 1] = 0; 
					// pointsData[index * 4 + 2] = 0; 
					pointsData[index * 4 + 3] = 0.0;
				}
			}
		}

		const pointTexture = new THREE.DataTexture(
		  pointsData,
		  pointsData.length / 4, 1,
		  THREE.RGBAFormat,
		  THREE.FloatType
		);
		pointTexture.needsUpdate = true;

	
		const size = 64;
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
		    size: {value: new THREE.Vector3(size)},
		    boxCountPerAxis: {value: _boxCountPerAxix},
		    cloudPointCount: {value: Math.round(pointsData.length / 4)},
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
		    uniform vec3 size;
		    uniform int boxCountPerAxis; 
		    uniform int cloudPointCount;
		    uniform sampler2D cloudPointTexture;
		    float maxDist = 1.0;

		    vec4 getPoint(int i) {
		      return texelFetch(cloudPointTexture, ivec2(i, 0), 0);
		    }

		    vec3 getRelPoint(vec3 curBoxPos, vec3 deltaBox) {
		  		int x = int(curBoxPos.x + deltaBox.x) % boxCountPerAxis;
		  		int y = int(curBoxPos.y + deltaBox.y) % boxCountPerAxis;
		  		int z = int(curBoxPos.z + deltaBox.z) % boxCountPerAxis;
		  		
		  		int curIndex = x + y * boxCountPerAxis + z * boxCountPerAxis * boxCountPerAxis;
		  		return vec3(getPoint(curIndex)) + deltaBox * 1.0 / float(boxCountPerAxis); // Find point relative to its box and transform that to the curBoxes frame of reference
		    }

		    void main() {
	      	float minDist = maxDist;
	    		vec3 curVoxPos = vec3(vUv.x, vUv.y, sliceZ);
		  		vec3 curBoxIndexPos = floor(curVoxPos*vec3(boxCountPerAxis));
		  		vec3 curRelVoxPos = curVoxPos - curBoxIndexPos / vec3(boxCountPerAxis);  // Relative to curBox
		  		

		  		for (int dx = -1; dx < 2; dx++)
		    	{
				  	for (int dy = -1; dy < 2; dy++)
				    {
				  		for (int dz = -1; dz < 2; dz++)
				    	{
		  			  	vec3 curRelPoint = getRelPoint(curBoxIndexPos, vec3(dx, dy, dz));
		    				float curDist = distance(curRelPoint, curRelVoxPos);
			    			if (curDist > minDist) continue;
			    			minDist = curDist;
		    			}
		  			}
		    	}

		  		float normDist = (maxDist - minDist) / maxDist;
		    	gl_FragColor = vec4(pow(normDist, 3.0));
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
		return target.texture;
	}

	
	constructor({simulation, renderer, composer}) {
		this.#composer = composer;
		this._cloudTexture = this.#createCloudTexture(5);
		this._cloudTexture_fine = this.#createCloudTexture(5);


		// Particle rendering material
		this._pixelPass = new CloudShader({
			uniforms: {
			    tDiffuse: {value: null},
			    depthTexture: {value: null},
			    invProjection: {value: new THREE.Matrix4()},
			    cameraWorld: {value: new THREE.Matrix4()},
			    cloudCameraPosition: {value: new THREE.Vector3()},
			    cloudTexture: {value: null},
			    cloudTexture_fine: {value: null},
			    cloudBoxSize: {value: this._cloudBoxSize},
			    minDensity: {value: 0.69}, 
			    densityScalar: {value: 1.4},
			    cloudLightPenetrationCoeff: {value: 1.0},
			    lightPosition: {value: new THREE.Vector3()},

			    cloudLightAbsorption: {value: 20.0},
			    cloudLightCoef: {value: 8.6},

			    fineTextureDensityScalar: {value: 0.0}, //0.5
 			    fineTextureScalar: {value: 2.8},
			    fineTextureOffset: {value: new THREE.Vector3(0.0)}, // Change over time to give the idea of drifting clouds?
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
				uniform sampler3D cloudTexture;
				uniform sampler3D cloudTexture_fine;

		    varying vec2 vUv;

		    uniform mat4 invProjection;
				uniform mat4 cameraWorld;
				uniform vec3 cloudCameraPosition;
				uniform vec3 lightPosition;


				uniform float cloudBoxSize;
				uniform float minDensity;
				uniform float densityScalar;
				uniform float cloudLightAbsorption; // Controls how much light is lost due to the clouds
				uniform float cloudLightCoef; // Controls how much the sun's light can penetrate the cloud
				uniform float cloudLightPenetrationCoeff;


				uniform float fineTextureDensityScalar; // In units normal density texture
				uniform float fineTextureScalar;
				uniform vec3 fineTextureOffset;

		    vec3 worldToTexturePos(vec3 worldPos) {
					return mod(worldPos / cloudBoxSize + vec3(0.5), vec3(1.0));
		    }
				vec3 worldPositionFromDepth(vec2 uv, float depth) {
				  vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
				  vec4 view = invProjection * clip;
				  view /= view.w;

				  return (cameraWorld * view).xyz;
				}

				// float sampleCloudDensity(vec3 position) {
				// 	vec3 normalizedPosition = worldToTexturePos(position);
				// 	if (length(normalizedPosition - vec3(0.5)) > 0.5) return 0.0;

				// 	float textureVal = texture(cloudTexture, normalizedPosition).r;
					
				// 	float density = max(0.0, textureVal - minDensity) * densityScalar / (1.0 - minDensity);
				// 	float distNorm = distance(position, vec3(0.5)) / cloudBoxSize * 2.0;
				// 	return density * pow(1.0 - distNorm, 3.0); // Give the cloudBox a fuzzy edge
				// }


				float sampleCloudDensity(vec3 position) {
					vec3 normalizedPosition = worldToTexturePos(position);
					vec3 normalizedPosition_fine = worldToTexturePos((position + fineTextureOffset) * fineTextureScalar);
					if (length(normalizedPosition - vec3(0.5)) > 0.5) return 0.0;
					// if (length(normalizedPosition - vec3(0.5)) < 0.2) return 0.0; // Minimum cloud-free area around planet
					if (abs(normalizedPosition.y - 0.45) > 0.1) return 0.0; // Define vertical box

					float textureVal = texture(cloudTexture, normalizedPosition).r;
					float textureVal_fine = texture(cloudTexture_fine, normalizedPosition_fine).r;

					float curDensity = (textureVal + textureVal_fine * fineTextureDensityScalar) / (1.0 + fineTextureDensityScalar);
					
					float density = max(0.0, curDensity - minDensity) * densityScalar / (1.0 - minDensity);
					float distNorm = distance(position, vec3(0.5)) / cloudBoxSize * 2.0;
					return density * pow(1.0 - distNorm, 3.0); // Give the cloudBox a fuzzy edge
				}

				float densityToLight(vec3 position) {
					vec3 ray = lightPosition - position;
					float maxDistance = length(ray);
					vec3 rayDirection = ray / maxDistance;
					float curDist = 0.0;
					float maxDist = min(maxDistance, cloudBoxSize); // Only check within the cloudBox
					float stepSize = maxDist / 20.0; // /x: defines the amount of samples

					float totalDensity = 0.0;
					while (curDist < maxDist)
					{	
						vec3 curPos = rayDirection * curDist + position;
						float curDensity = sampleCloudDensity(curPos);
						totalDensity += curDensity * stepSize;
						curDist += stepSize;
					}
					return totalDensity;
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
					float stepSize = maxDist / 100.0; // /x: defines the amount of samples

					float lightEnergy = 0.0;
					float transmittance = 1.0;
					while (curDist < maxDist)
					{	
						vec3 curPos = rayDirection * curDist + cloudCameraPosition;
						float curDensity = sampleCloudDensity(curPos);
						if (curDensity > 0.0) {
							float lightTransmittance = exp(-cloudLightPenetrationCoeff * densityToLight(curPos));
							lightEnergy += curDensity * stepSize * transmittance * lightTransmittance * cloudLightCoef; // Calculate how much light is added to the path by scattering in it from the light source
							transmittance *= exp(-curDensity * stepSize * cloudLightAbsorption); // Calculate how much light goes through the cloud (direct ray, so how well can you look through the cloud)

							if (transmittance < 0.01) { // Minor effect as most light is lost anyway
								break;
							}
						}

						curDist += stepSize;
					}
					lightEnergy = min(max(lightEnergy, 0.0), 1.0); // Clamp
				
					vec3 cloudColor = lightEnergy * vec3(1.0, 0.8, 0.7);
					vec3 cloudBaseColor = vec3(0.05);
					// gl_FragColor = vec4(color.rgb * transmittance + cloudColor + (1.0 - transmittance) * (1.0 - lightEnergy) * cloudBaseColor, 1.0);
					gl_FragColor = vec4(
						color.rgb * transmittance + 
						(1.0 - transmittance) * (
							cloudColor * lightEnergy + 
							cloudBaseColor * (1.0 - lightEnergy)
						), 
						1.0
					);
		    }
			`
		}, simulation);
		
		this._pixelPass.uniforms.cloudTexture.value = this._cloudTexture;
		this._pixelPass.uniforms.cloudTexture_fine.value = this._cloudTexture_fine;
	}

	addToComposer(_composer) {
		_composer.addPass(this._pixelPass);
	}

	update(_simulation) {

	}
}


