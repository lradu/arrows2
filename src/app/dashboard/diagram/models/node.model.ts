export class Node {
	public id: string = "firstNode";
	public x: number = 100;
	public y: number = 100;
	public radius: number = 50;
	public caption: string = "";
	public properties: string = "";
	public propertiesWidth: number = 0;
	public isRectangle: boolean = false;
	public color: string = "#333333";
	public fill: string = "white"
	public stroke: string = "#333333";
	public strokeWidth: number = 4;

	constructor() {}

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
