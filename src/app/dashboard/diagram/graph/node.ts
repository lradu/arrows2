export class Node {
	public id: string;
	public x: number;
	public y: number;
	public radius: number;
	public style: any;
	public caption: string;
	public properties: any;
	public isRectangle: boolean;

	constructor() {
		this.x = 100;
		this.y = 100;
		this.id = "firstNode";
		this.isRectangle = false;
		this.radius = 50;
		this.caption = "";
		this.properties = "";
		this.style = {
			"color": "black",
			"fill": "white",
			"stroke": "#333333",
			"strokeWidth": "4"
		}
	}

	public distanceTo(node) {
		let dx = (node.x + node.radius) - (this.x + this.radius);
		let dy = (node.y + node.radius) - (this.y + this.radius);

		return Math.sqrt(dx * dx + dy * dy);
	}

	public angleTo(node) {
		let dx = (node.x + node.radius) - (this.x + this.radius);
		let dy = (node.y + node.radius) - (this.y + this.radius);

		return Math.atan2(dy, dx) * 180 / Math.PI;
	}
}
