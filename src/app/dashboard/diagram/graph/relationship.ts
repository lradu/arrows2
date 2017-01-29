export class Relationship {
	public type: string;
	public classes: string;
	public properties: any;
	public startNode: string;
	public endNode: string;
	public style: any;
	public id: string;

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
	}

	public reverse() {
		let oldStart = this.startNode;
		this.startNode = this.endNode;
		this.endNode = oldStart;
	}


}