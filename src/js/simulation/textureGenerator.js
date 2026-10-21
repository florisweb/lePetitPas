import * as THREE from 'three';
import { Perlin, random } from '../random.js';


export function generateHillTexture() {
	const canvas = document.createElement('canvas');
	canvas.width = 128;
	canvas.height = 128;
	const ctx = canvas.getContext('2d');

	const minRadPerc = 0.2;
	for (let x = 0; x < canvas.width; x++)
	{
		let rx = (x - canvas.width / 2) / canvas.width;
		for (let y = 0; y < canvas.height; y++)
		{
			let ry = (y - canvas.height / 2) / canvas.height;
			let dist = Math.sqrt(rx**2 + ry**2) * Math.sqrt(2);
			const colorP = 1 - 1 / (1 + Math.exp(10 * (dist - 0.5))) + 0.2 * (1 + Perlin.get(rx * 5, ry * 5));

			ctx.fillStyle = 'rgb(' + Math.round(colorP * 195 + 40) + ', ' +  Math.round(colorP * 100 + 135) + ', ' + Math.round(colorP * 215 + 20) + ')';

			ctx.fillRect(x, y, 1, 1);
		}
	}

	const texture = new THREE.CanvasTexture(canvas);
	return texture;
}