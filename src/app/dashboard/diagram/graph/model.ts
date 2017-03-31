import { Node } from './node';
import { Relationship } from './relationship';

export class Model {
	public nodes: any;
	public relationships: any;
	
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
		for(let g in data.relationships) {
			let group = [];
			for(let key in data.relationships[g]){
				let relationship = new Relationship();
				relationship.id = data.relationships[g][key].id;
				relationship.style = data.relationships[g][key].style;
				relationship.startNode = data.relationships[g][key].startNode;
				relationship.endNode = data.relationships[g][key].endNode;
				relationship.properties = data.relationships[g][key].properties;
				relationship.type = data.relationships[g][key].type;
				relationship.source = this.nodes.find( x => x.id == relationship.startNode);
				relationship.target = this.nodes.find( x => x.id == relationship.endNode);
				relationship.angle = relationship.source.angleTo(relationship.target);
				relationship.distance = relationship.source.distanceTo(relationship.target) - 12;
				relationship["group"] = g;
				group.push(relationship);
			}
			this.relationships.push(group);
		}
	}
}