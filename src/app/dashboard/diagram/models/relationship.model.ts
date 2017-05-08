export class Relationship {
	public type: string = "";
	public properties: string = "";
	public propertiesWidth: number = 0;
	public startNode: string = "";
	public endNode: string = "";
	public id: string = "firstRelationship";
	public fill: string = "#333333";

	constructor (){}

	public reverse() {
		let oldStart = this.startNode;
		this.startNode = this.endNode;
		this.endNode = oldStart;
	}

}