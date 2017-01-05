export class Node {
	public x: number;
	public y: number;
	public classes: any;
	public properties: any;
	public isRectangle: boolean;

	constructor() {
		this.x = 5;
		this.y = 5;
	}

	distanceTo(node) {
		let dx = node.x - this.x;
		let dy = node.y - this.y;

		return Math.sqrt(dx * dx + dy * dy);
	}

	angleTo(node) {
		let dx = node.x - this.x;
		let dy = node.y - this.y;

		return Math.atan2(dy, dx) * 180 / Math.PI;
	}
}
