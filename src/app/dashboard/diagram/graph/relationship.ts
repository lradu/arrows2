export class Relationship {
	public relationshipType: any;
	public classes: any;
	public properties: any;
	public startNode: any;
	public endNode: any;
	public style: any;

	constructor (){
		
	}

	public reverse() {
		let oldStart = this.startNode;
		this.startNode = this.endNode;
		this.endNode = oldStart;
	}


}