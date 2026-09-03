import * as THREE from 'three';

import Star from './star.js';
import Sun from './sun.js';
import Planet from './planet.js';
import { random } from './random.js';
import Camera from './camera.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';


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
	console.log('resize');
	renderer.setSize(renderer.domElement.offsetWidth, renderer.domElement.offsetHeight);
	camera.onResize();
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
window.planet = planet;
planet.addToScene(scene);


const stars = [];
for (let i = 0; i < 500; i++)
{
	const star = new Star();
	star.addToScene(scene);
	stars.push(star);
}



























const WIDTH = 10;
const HEIGHT = 10;
const gpuCompute = new GPUComputationRenderer(WIDTH, HEIGHT, renderer);

// Position shader
const positionShader = `
  uniform float uDeltaTime;
  uniform float uTime;
  uniform vec3 vulcanoPos;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 pos = texture(texturePosition, uv);
    vec4 vel = texture(textureVelocity, uv);

    pos.xyz += vel.xyz * uDeltaTime * 60.0;    
		if (distance(pos, vec4(0.0)) < 20.0) 
		{
			vec3 vulcNormal = normalize(vulcanoPos);
			pos.xyz = vulcNormal * 19.9;
		}

    gl_FragColor = pos;
  }
`;

// Velocity shader
const velocityShader = `
	float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  uniform float uDeltaTime;
  uniform float uTime;
  uniform vec3 vulcanoPos;
	float g = 0.1;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 vel = texture(textureVelocity, uv);
		vec4 pos = texture(texturePosition, uv);
		
		vec3 gravNormal = -normalize(vec3(pos)); // Gravity to 0, 0, 0

		vel.xyz += gravNormal * g * uDeltaTime;
		vel.xyz *= 0.999;
		if (distance(pos, vec4(0.0)) < 20.0) 
		{
			vel.xyz = vec3(0.0);
			if (distance(vel.xyz, vec3(0.0)) < 0.1 && random(uv + uTime) > 0.8) 
			{
				vec3 vulcNormal = normalize(vulcanoPos);
				vel.xyz = vulcNormal * (0.66 + random(uv + uTime + 3.0) * 0.33) * g * 2.0;

		    vec3 arbitrary = abs(vulcNormal.x) < 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
				vec3 perp1 = normalize(cross(vulcNormal, arbitrary));
  		  vec3 perp2 = normalize(cross(vulcNormal, perp1));
				vec2 noise = normalize(vec2(1.0 - 2.0 * random(uv + uTime + 1.0), 1.0 - 2.0 * random(uv + uTime + 2.0))) * 0.03;
				vel.xyz += perp1.xyz * noise.x + perp2.xyz * noise.y;
			}
		}

    gl_FragColor = vel;
  }
`;

// Create textures
const positionTexture = gpuCompute.createTexture();
const positionArray = positionTexture.image.data;

for (let i = 0; i < positionArray.length; i += 4) {
  positionArray[i] = 0;
  positionArray[i + 1] = 0;
  positionArray[i + 2] = 0;
}
window.positionTexture = positionTexture;

window.positionArray = positionArray;
const velocityTexture = gpuCompute.createTexture();
const velocityArray = velocityTexture.image.data;

for (let i = 0; i < velocityArray.length; i += 4) {
  velocityArray[i] = 0;
  velocityArray[i + 1] = 0;
  velocityArray[i + 2] = 0;
}

// Add compute variables
const dtPosition = gpuCompute.addVariable('texturePosition', positionShader, positionTexture);
const dtVelocity = gpuCompute.addVariable('textureVelocity', velocityShader, velocityTexture);

gpuCompute.setVariableDependencies(dtPosition, [dtPosition, dtVelocity]);
gpuCompute.setVariableDependencies(dtVelocity, [dtVelocity, dtPosition]);

dtPosition.material.uniforms.uDeltaTime = { value: 0.016 };
dtPosition.material.uniforms.uTime = { value: 0 };
dtPosition.material.uniforms.vulcanoPos = { value: [0.0, 1.0, 0.0] };
dtVelocity.material.uniforms.uDeltaTime = { value: 0.016 };
dtVelocity.material.uniforms.uTime = { value: 0 };
dtVelocity.material.uniforms.vulcanoPos = { value: [0.0, 1.0, 0.0] };

gpuCompute.init();

// Particle rendering material
const particleShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    texturePosition: { value: null },
  },
  vertexShader: `
    uniform sampler2D texturePosition;
    
    varying vec3 vColor;

    void main() {
      vec4 pos = texture(texturePosition, uv);
  		float dist = (distance(pos, vec4(0.0)) - 21.0) / 3.0;

      
      vColor = vec3(0.3, 0.3, 0.3);

  		if (uv.x < 0.3)
			{
				// vColor = vec3(0.7, 0.3, 0.0);
  			vColor = vec3(0.5 + uv.y * 0.5, 0.2 - uv.y * 0.1, 0.0);
  			gl_PointSize = 2.0 * dist;
			} else {
  			gl_PointSize = 1.0 * dist;
			}

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos.xyz, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;

    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      // if (dist > 0.5) discard;
  		// if (vColor.x < 0.0) discard;
      
      gl_FragColor = vec4(vColor, (1.0 - 0.0) * (0.5 - dist));
    }
  `,
  transparent: true,
  emissiveIntensity: 2.0
});

// Particle geometry
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(WIDTH * HEIGHT * 3);
const uvs = new Float32Array(WIDTH * HEIGHT * 2);

let index = 0;
for (let j = 0; j < HEIGHT; j++) {
  for (let i = 0; i < WIDTH; i++) {
    positions[index * 3] = Math.random() * 5;
    positions[index * 3 + 1] = 0;
    positions[index * 3 + 2] = 10;
    uvs[index * 2] = i / WIDTH;
    uvs[index * 2 + 1] = j / HEIGHT;
    index++;
  }
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

const particles = new THREE.Points(particleGeometry, particleShaderMaterial);
window.particles = particles;
scene.add(particles);


window.particleShaderMaterial = particleShaderMaterial;




















// 3. Set up bloom post-processing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera.camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,    // strength
  0.01,    // radius
  // 0.85    // threshold
  0.5    // threshold
);
composer.addPass(bloomPass);





let time = 0;


function update() {
	planet.update();
	sun.update();
	for (let star of stars) star.update();


	const vulcPos = planet.vulcanos[0].relPosition;

	time += 0.016;

	dtPosition.material.uniforms.uDeltaTime.value = 0.016;
	dtPosition.material.uniforms.uTime.value = time;
	dtVelocity.material.uniforms.uDeltaTime.value = 0.016;
	dtVelocity.material.uniforms.uTime.value = time;
	dtVelocity.material.uniforms.vulcanoPos.value = vulcPos;
	dtPosition.material.uniforms.vulcanoPos.value = vulcPos;

	gpuCompute.compute();

	particleShaderMaterial.uniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget(dtPosition).texture;




	camera.update();
	// renderer.render(scene, camera.camera);
	composer.render();
	requestAnimationFrame(update);
}
update();



export default App;