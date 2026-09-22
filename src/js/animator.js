
export function animateLinearily(_duration, _callBack) {
	let startTime = new Date();
	let update = () => {
		let curTimePerc = (new Date() - startTime) / _duration;
		_callBack(curTimePerc);
		if (curTimePerc > 1) {
			_callBack(1);
			return;
		}
		requestAnimationFrame(update);
	}
	requestAnimationFrame(update);
}

export function animateSigmoidally(_duration, _callBack) {
	return animateLinearily(_duration, (_perc) => {
		let curProgressPerc = 1 / (1 + Math.exp(-(_perc - 0.5) * 10));
		_callBack(_perc < 1 ? curProgressPerc : 1);
	});
}