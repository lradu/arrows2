import { Node } from './node';
import { Relationship } from './relationship';

export class Model {
	public nodes: any;
	public relationships: any;
	public properties: any;

	constructor() {
		this.nodes = [];
		this.relationships = [];
	}

	load(data){
		this.nodes = [];
		this.relationships = [];
		for(let key in data.nodes){
			let node =  new Node();
			node.x = data.nodes[key].x;
			node.y = data.nodes[key].y;
			node.caption = data.nodes[key].caption;
			node.id = data.nodes[key].id;
			node.isRectangle = data.nodes[key].isRectangle;
			node.properties = data.nodes[key].properties;
			node.style = data.nodes[key].style;
			node.radius = data.nodes[key].radius;
			this.nodes.push(node);
		}
		for(let key in data.relationships){
			let relationship = new Relationship();
			relationship.id = data.relationships[key].id;
			relationship.style = data.relationships[key].style;
			relationship.startNode = data.relationships[key].startNode;
			relationship.endNode = data.relationships[key].endNode;
			relationship.properties = data.relationships[key].properties;
			relationship.type = data.relationships[key].type;
			this.relationships.push(relationship);
		}
	}

}