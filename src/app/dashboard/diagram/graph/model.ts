import { Node } from './node';

export class Model {
	public nodes: any;
	public relationships: any;
	public properties: any;

	constructor() {
		this.nodes = [];
		this.relationships = [];
	}

}