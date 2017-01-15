import { Component, Inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { AngularFire, FirebaseApp } from 'angularfire2';
import * as d3 from 'd3'; 

import { Model } from './graph/model';
import { Node } from './graph/node';

@Component({
  selector: 'diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.css']
})

export class DiagramComponent implements OnInit {
	public svg: any;
	public gNodes: any;
	public gCaptions: any;
	public gOverlay: any;
	public zoom: any;
	public model: Model;

	public dbref: any;
	public user: any;
	public currentDiagram: any;

	public showTools: boolean;
	public currentNode: any;

	constructor(
		private af: AngularFire, 
		@Inject(FirebaseApp) firebase: any,
		private ref: ChangeDetectorRef
		) {
			this.dbref = firebase.database().ref();
			this.user = firebase.auth().currentUser;
	}

	ngOnInit(){
		this.svg = d3.select("#diagram")
			.append("svg")
			.attr("class", "graph")
		this.zoomEvent();
		this.gNodes = this.svg.append("g")
			.attr("class", "layer nodes");
		this.gCaptions = this.svg.append("g")
			.attr("class", "caption");
		this.gOverlay = this.svg.append("g")
			.attr("class", "layer overlay")

		this.model = new Model();

		// let width = 1500 , height = 1000, radius = 50;
		// this.nodes = d3.range(20).map(function() {
		// 	let node = new Node();
		// 	node.x = Math.round(Math.random() * (width - radius * 2) + radius);
		// 	node.y = Math.round(Math.random() * (height - radius * 2) + radius)
		//   return node;
		// });

		this.dbref
			.child('users/' + this.user.uid + "/currentDiagram")
			.on('value',
				(snap) => {
					this.currentDiagram = snap.val();
					this.showTools = false;
					this.dbref
						.child('diagrams/' + this.currentDiagram + '/data/nodes')
						.on('value', (snapShot) => {
							if(snapShot.ref.parent.parent.key == this.currentDiagram){
								this.model.nodes = []
								for(let key in snapShot.val()) {
									this.model.nodes.push(snapShot.val()[key]);
								}
								d3.selectAll('svg > g > *').remove();
								this.renderNodes();
						}
					}); 
			})
	}

	renderNodes(){
		let nodes = this.gNodes.selectAll("rect.node")
		  .data(this.model.nodes)
		nodes.exit().remove()
		nodes.enter()
			.append("rect")
		  	.attr("class", "node")
		   	.attr("width", function(node) { return node.radius * 2; })
		   	.attr("height", function(node) { return node.radius * 2; })
		   	.attr("x", function(node) { return node.x; })
		   	.attr("y", function(node) { return node.y; })
		   	.attr("rx", function(node) { return node.isRectangle ? 20 : node.radius })
		   	.attr("ry", function(node) { return node.isRectangle ? 20 : node.radius })
		   	.attr("fill", function(node) { return node.style.fill })
		   	.attr("stroke", function(node) { return node.style.stroke })
		   	.attr("stroke-width", function(node) { return node.style.strokeWidth })
		   	.style("color", function(node) { return node.style.color });


		let captions = this.gCaptions.selectAll("text.node.caption")
			.data(this.model.nodes)
		captions.exit().remove()
		captions.enter()
			.append("text")
				.attr("x", function(node) { return node.x + node.radius; })
				.attr("y", function(node) { return node.y + node.radius; })
				.attr("fill", function(node) { return node.style.color })
				.attr("class", "node caption")
				.attr("text-anchor", "middle")
				.attr("font-size",  "50px")
				.attr("alignment-baseline", "central")
				.text(function(node) { return node.caption; })



		let overlays = this.gOverlay.selectAll("rect.node")
			.data(this.model.nodes)
		overlays.exit().remove()
		overlays.enter()
			.append("rect")
				.attr("class", "node")
				.attr("width", function(node) { return node.radius * 2 + 4; })
				.attr("height", function(node) { return node.radius * 2 + 4; })
				.attr("x", function(node) { return node.x - 2; })
				.attr("y", function(node) { return node.y - 2; })
				.attr("rx", function(node) { return node.isRectangle ? 22 : node.radius + 2 })
				.attr("ry", function(node) { return node.isRectangle ? 22 : node.radius + 2 })
			  .style("fill", "rgba(255, 255, 255, 0)")
			  .on("mouseover", mOver)
			  .on("mouseleave", mLeave)
			  .on("dblclick", (node) => {
			   	this.currentNode = node;
			  	this.showTools = true;
			  	this.ref.detectChanges();
			   })
			  .call(d3.drag()
			     .on("drag", dragged));

		function mOver(){
			d3.select(this).style("fill", "rgba(150, 150, 255, 0.6)");
		}
		function mLeave(){
			d3.select(this).style("fill", "rgba(255, 255, 255, 0)");
		}
		let that = this;
		function dragged(node) {
			// node.x = d3.event.x;
			// node.y = d3.event.y;
			//d3.select(this).attr("x", node.x = d3.event.x).attr("y", node.y = d3.event.y);

			that.dbref
				.child('diagrams/' + that.currentDiagram + '/data/nodes/' + node.id)
				.update({
				"x": d3.event.x,
				"y": d3.event.y
			});
		}
	}

	closeTools(){
		this.showTools = false;
		this.ref.detectChanges();
	}

	zoomEvent() {
		this.zoom = d3.zoom()
      .scaleExtent([1/4, 10])
      .on("zoom", zoomed);

		this.svg.call(this.zoom)
			.on("wheel.zoom", null)
			.on("dblclick.zoom", null);

    function zoomed() {
        d3.selectAll("g").attr("transform", d3.event.transform);
    }

	}

	zoomChange(val) {
		if(val) {
			this.svg.transition()
				.call(this.zoom.scaleBy, 1.2);
		} else {
			this.svg.transition()
				.call(this.zoom.scaleBy, 0.8);
		}

	}

	saveNode() {
		if(this.currentNode.caption) {
			let g = this.svg.append("g");
			let txt = g.append("text")
				.attr("font-size",  "50px")
				.text(this.currentNode.caption)
			this.currentNode.radius = (txt.node().getComputedTextLength() / 2) + 20;
			g.remove();
		} else {
			this.currentNode.radius = 50;
		}

		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/nodes/' + this.currentNode.id)
			.update({
				"caption": this.currentNode.caption,
				"isRectangle": this.currentNode.isRectangle,
				"radius": this.currentNode.radius,
				"style": this.currentNode.style
			});
		this.ref.detectChanges();
	}

	deleteNode() {
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/nodes/' + this.currentNode.id)
			.remove();
		this.showTools = false;
		this.ref.detectChanges();
	}
}