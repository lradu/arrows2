export class Node {
	public id: any;
	public x: number;
	public y: number;
	public radius: number;
	public style: any;
	public properties: any;
	public isRectangle: boolean;

	constructor() {
		this.x = 100;
		this.y = 100;
		this.id = 0;
		this.isRectangle = false;
		this.radius = 50;
		this.style = {
			"color": "black",
			"fill": "white",
			"stroke": "#333333",
			"strokeWidth": "4"
		}
	}

	public distanceTo(node) {
		let dx = node.x - this.x;
		let dy = node.y - this.y;

		return Math.sqrt(dx * dx + dy * dy);
	}

	public angleTo(node) {
		let dx = node.x - this.x;
		let dy = node.y - this.y;

		return Math.atan2(dy, dx) * 180 / Math.PI;
	}
}
