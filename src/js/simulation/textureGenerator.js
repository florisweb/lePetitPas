import * as THREE from 'three';
import { Perlin, random } from '../random.js';


export function generateHillTexture() {
	const canvas = document.createElement('canvas');
	canvas.width = 128;
	canvas.height = 128;
	const ctx = canvas.getContext('2d');

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

	return new THREE.CanvasTexture(canvas);
}

export function generateVulcanoTexture() {
	const canvas = document.createElement('canvas');
	canvas.width = 128;
	canvas.height = 128;
	const ctx = canvas.getContext('2d');

	const minRadPerc = 0.3;
	for (let x = 0; x < canvas.width; x++)
	{
		let rx = (x - canvas.width / 2) / canvas.width;
		for (let y = 0; y < canvas.height; y++)
		{
			let ry = (y - canvas.height / 2) / canvas.height;
			let dist = Math.sqrt(rx**2 + ry**2) * Math.sqrt(2);
			const colorP = 1 / (1 + Math.exp(10 * (dist - 0.5))) + 0.2 * (1 + Perlin.get(rx * 5, ry * 5));
			let color = Math.round((1 - Math.min(colorP, 1)) * 235 + 20);

			ctx.fillStyle = 'rgb(' + color + ', ' + color + ', ' + color + ')';

			ctx.fillRect(x, y, 1, 1);
		}
	}

	return new THREE.CanvasTexture(canvas);
}



export function generatePlanetTexture(_heightGenerator) {
	const canvas = document.createElement('canvas');
	canvas.width = 128;
	canvas.height = 128;
	// canvas.width = 512;
	// canvas.height = 512;
	const ctx = canvas.getContext('2d');
	let heights = [];
	for (let x = 0; x < canvas.width; x++)
	{
		let rx = (x - canvas.width / 2) / canvas.width;
		for (let y = 0; y < canvas.height; y++)
		{
			let ry = (y - canvas.height / 2) / canvas.height;
			let dist = Math.sqrt(rx**2 + ry**2) * Math.sqrt(2);
			let height = 1 - (_heightGenerator(x / canvas.width, y / canvas.height) - 18) / 5;

			// const colorP = 1 - 1 / (1 + Math.exp(10 * (dist - 0.5))) + 0.2 * (1 + Perlin.get(rx * 5, ry * 5));
			// ctx.fillStyle = 'rgb(' + Math.round(x / 2) + ', ' + Math.round(y / 2) + ', 255)';
			// ctx.fillStyle = 'rgb(' + Math.round(colorP * 195 + 40) + ', ' +  Math.round(colorP * 100 + 135) + ', ' + Math.round(colorP * 215 + 20) + ')';
			// ctx.fillStyle = height > 0.8 ? 'rgb(255, 0, 0)' : '#fff';
			if (Math.random() < 0.3)
			{
				// ctx.fillStyle = '#F3E0C8';
				ctx.fillStyle = '#F3E0C8';
			} else if (Math.random() < 0.3)
			{
				ctx.fillStyle = '#DFCCB5';
			} else {
				ctx.fillStyle = '#DCC6B1';
			}
			

			ctx.fillRect(x, y, 1, 1);
		}
	}

	return new THREE.CanvasTexture(canvas);
}