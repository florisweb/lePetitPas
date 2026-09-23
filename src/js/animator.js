
export function animateLinearily(_duration, _callBack) {
	let startTime = new Date();
	let prevTimePerc = 0;
	let update = () => {
		let curTimePerc = (new Date() - startTime) / _duration;
		_callBack(curTimePerc, curTimePerc - prevTimePerc);
		if (curTimePerc > 1) {
			_callBack(1, curTimePerc - prevTimePerc);
			return;
		}
		prevTimePerc = curTimePerc;
		requestAnimationFrame(update);
	}
	requestAnimationFrame(update);
}

export function animateSigmoidally(_duration, _callBack) {
	return animateLinearily(_duration, (_perc, _dPerc) => {
		let curProgressPerc = 1 / (1 + Math.exp(-(_perc - 0.5) * 10));
		let prevProgressPerc = 1 / (1 + Math.exp(-((_perc - _dPerc) - 0.5) * 10));
		_callBack(_perc < 1 ? curProgressPerc : 1, curProgressPerc - prevProgressPerc);
	});
}