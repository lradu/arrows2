export class Relationship {
	public type: string;
	public classes: string;
	public properties: any;
	public startNode: string;
	public endNode: string;
	public style: any;
	public id: string;
	public source: any;
	public target: any;
	public angle: any;
	public distance: any;

	constructor (){
		this.id = "firstRelationship"; 
		this.style = {
			"fill": "#333333",
		}
		this.startNode = "";
		this.endNode = "";
		this.type = "";
		this.properties = {
			"width": 50,
			"text": ""
		};
		this.source = {};
		this.target = {};
		this.angle = 0;
		this.distance = 0;
	}

	public reverse() {
		let oldStart = this.startNode;
		this.startNode = this.endNode;
		this.endNode = oldStart;
	}


}