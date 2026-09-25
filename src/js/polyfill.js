export async function wait(_ms) {
	return new Promise((resolve) => setTimeout(resolve, _ms));
}