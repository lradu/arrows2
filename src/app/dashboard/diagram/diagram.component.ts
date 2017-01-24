import { Component, Inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { AngularFire, FirebaseApp } from 'angularfire2';
import * as d3 from 'd3'; 

import { Model } from './graph/model';
import { Node } from './graph/node';
import { Relationship } from './graph/relationship';

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
	public gRelationships: any;
	public zoom: any;
	public model: Model;

	public dbref: any;
	public user: any;
	public currentDiagram: string;
	public access: string;

	public showTools: boolean;
	public showNodeTools: boolean;
	public currentNode: any;
	public currentR: any;

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
		this.gRelationships = this.svg.append("g")
			.attr("class", "layer relationships");
		this.gNodes = this.svg.append("g")
			.attr("class", "layer nodes");
		this.gCaptions = this.svg.append("g")
			.attr("class", "caption");
		this.gOverlay = this.svg.append("g")
			.attr("class", "layer overlay");

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
						.child('diagrams/' + this.currentDiagram + '/users/' + this.user.uid + '/access')
						.on('value', (snapChild) => {
							if(snapChild.val()){
								this.access = snapChild.val();
							} else {
								//change currentDiagram if user doesn't have access
								this.access = '';
								snap.ref.parent
									.child('diagrams')
									.once('value',
										(snapShot) => {
											for(let key in snapShot.val()){
												snap.ref.parent
													.update({
														"currentDiagram": key
													});
													break;
											}
										})
							}
						})
					this.dbref
						.child('diagrams/' + this.currentDiagram + '/data')
						.on('value', (snapShot) => {
							if(snapShot.ref.parent.key == this.currentDiagram){
								this.model.load(snapShot.val());
								d3.selectAll('svg > g > *').remove();
								this.renderNodes();
						}
					}); 
			})
	}

	renderNodes(){
		let that = this;
		let closestNode
		let newNode = new Node();
		this.gNodes.selectAll("rect.newNode")
			.data([newNode])
			.remove()
			.enter()
				.append("rect")
					.attr("class", "newNode")
					.attr("width", newNode.radius * 2)
					.attr("height", newNode.radius * 2)
					.attr("fill", "none");
		this.gRelationships.selectAll("path.newRelationship")
			.data([newNode])
			.remove()
			.enter()
			.append("path")
				.attr("class", "newRelationship");

		let nodes = this.gNodes.selectAll("rect.node")
		  .data(this.model.nodes)
		nodes.remove()
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
		captions.remove()
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
		overlays.remove()
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
			  .on("click", (node) => {
			  	if(this.access != "Read Only"){
				   	this.currentNode = node;
				   	this.showNodeTools = true;
				  	this.showTools = true;
				  	this.ref.detectChanges();
			  	}
			   })
			  .call(d3.drag()
			     .on("drag", dragged));

		let nodeRing = this.gOverlay.selectAll('rect.ring')
			.data(this.model.nodes)
		nodeRing.remove()
		nodeRing.enter()
			.append("rect")
				.attr("class", "node ring")
				.attr("width", function(node) { return node.radius * 2 + 12; })
				.attr("height", function(node) { return node.radius * 2 + 12; })
				.attr("fill", "none")
				.attr("stroke", "rgba(255, 255, 255, 0)")
				.attr("stroke-width", "8")
				.attr("x", function(node) { return node.x - 6; })
				.attr("y", function(node) { return node.y - 6; })
				.attr("rx", function(node) { return node.isRectangle ? 26 : node.radius + 6 })
				.attr("ry", function(node) { return node.isRectangle ? 26 : node.radius + 6 })
				.on("mouseover", mRingOver)
				.on("mouseleave", mRingLeave)
				.call(d3.drag()
				   .on("drag", dragRing)
				   .on('end', dragEndRing));
		
		let rel = this.gRelationships.selectAll("path.relationship")
			.data(this.model.relationships);
		rel.remove();
		rel.enter()
			.append("path")
				.attr("class", "relationship")
				.attr("transform", function(rl) {
					let source = that.model.nodes.find( x => x.id == rl.startNode)
					let target = that.model.nodes.find( x => x.id == rl.endNode)
					let angle = source.angleTo(target);
					return "translate("
					+ (source.x + source.radius)
					+ ","
					+ (source.y + source.radius)
					+ ")" + "rotate(" + angle + ")";
				})
				.attr("d", function(rl) {
					let source = that.model.nodes.find( x => x.id == rl.startNode)
					let target = that.model.nodes.find( x => x.id == rl.endNode)
					let distance = source.distanceTo(target) - target.radius - 34;
					return "M " + (source.radius + 12) + " 2.5" + 
					"L " + distance + " 2.5" + 
					"L " + distance + " 10"  +
					"L " + (distance + 20) + " 0" +
					"L " + distance + " -10" + 
					"L " + distance + " -2.5" + 
					"L " + (source.radius + 12) + " -2.5" +
					"Z";
				})
				.attr("fill", function(rel) { return rel.style.fill });

		let relOverlay = this.gOverlay.selectAll("path.relationship")
			.data(this.model.relationships);
		relOverlay.remove();
		relOverlay.enter()
			.append("path")
				.attr("class", "relationship")
				.attr("transform", function(rl) {
					let source = that.model.nodes.find( x => x.id == rl.startNode)
					let target = that.model.nodes.find( x => x.id == rl.endNode)
					let angle = source.angleTo(target);
					return "translate("
					+ (source.x + source.radius)
					+ ","
					+ (source.y + source.radius)
					+ ")" + "rotate(" + angle + ")";
				})
				.attr("d", function(rl) {
					let source = that.model.nodes.find( x => x.id == rl.startNode)
					let target = that.model.nodes.find( x => x.id == rl.endNode)
					let distance = source.distanceTo(target) - target.radius - 34;
					return "M " + (source.radius + 10) + " 7" + 
					"L " + (distance - 3) + " 7" + 
					"L " + (distance - 3) + " 16"  +
					"L " + (distance + 26) + " 0" +
					"L " + (distance - 3) + " -16" + 
					"L " + (distance - 3) + " -7" + 
					"L " + (source.radius + 12) + " -7" +
					"Z";
				})
				.attr("fill", "rgba(255, 255, 255, 0)")
				.on("mouseover", mOver)
				.on("mouseleave", mLeave)
				.on("click", (rl) => {
			  	if(this.access != "Read Only"){
				   	this.currentR = rl;
				   	this.showNodeTools = false;
				  	this.showTools = true;
				  	this.ref.detectChanges();
			  	}
			   });

		function mRingOver(){
			d3.select(this).style("stroke", "rgba(150, 150, 255, 0.5)");
		}
		function mRingLeave(){
			d3.select(this).style("stroke", "rgba(255, 255, 255, 0)");
		}
		function mOver(){
			d3.select(this).style("fill", "rgba(150, 150, 255, 0.5)");
		}
		function mLeave(){
			d3.select(this).style("fill", "rgba(255, 255, 255, 0)");
		}

		function dragRing(n){
			closestNode = "";
			newNode.isRectangle = n.isRectangle;
			newNode.style.fill = n.style.fill;
			newNode.style.color = n.style.color;
			newNode.x = d3.mouse(this)[0] - newNode.radius;
			newNode.y = d3.mouse(this)[1] - newNode.radius;

			for(let node of that.model.nodes){
				if(node.id != n.id){
					if(node.distanceTo(newNode) <= node.radius + newNode.radius){
						closestNode = node.id;
						newNode.x = node.x + node.radius - newNode.radius;
						newNode.y = node.y + node.radius - newNode.radius;
					}
				}
			}

			let distance = n.distanceTo(newNode) - newNode.radius - 34;
			if(closestNode){
				d3.select("rect.newNode")
					.attr("fill", "none")
					.attr("stroke", "none")
					.style("color", "none");
			} else {
				d3.select("rect.newNode")
					.attr("x", newNode.x)
					.attr("y", newNode.y)
					.attr("rx", newNode.isRectangle ? 20 : newNode.radius)
					.attr("ry", newNode.isRectangle ? 20 : newNode.radius)
					.attr("fill", newNode.style.fill)
					.attr("stroke", newNode.style.stroke)
					.attr("stroke-width", newNode.style.strokeWidth)
					.style("color", newNode.style.color);
			}
			if(distance > n.radius){
				d3.select("path.newRelationship")
					.attr("transform", 
						"translate(" 
						+ (n.x + n.radius)
						+ ","
						+ (n.y + n.radius)
						+ ")" + "rotate("
						+ n.angleTo(newNode) + ")"
						)
					.attr("d", "M " + (n.radius + 12) + " 2.5" + 
						"L " + distance + " 2.5" + 
						"L " + distance + " 10"  +
						"L " + (distance + 20) + " 0" +
						"L " + distance + " -10" + 
						"L " + distance + " -2.5" + 
						"L " + (n.radius + 12) + " -2.5" +
						"Z")
					.attr("fill", "#333333");			
			}
		}

		function dragEndRing(n){
			let newRelationship = new Relationship();
			if(closestNode){
				newRelationship["startNode"] = n.id;
				newRelationship["endNode"] = closestNode;
			} else {
				let getId = that.dbref
					.child('diagrams/' + that.currentDiagram + '/data/nodes')
					.push(newNode);
				getId.ref.update({
					"id": getId.key
				});
				newRelationship["startNode"] = n.id;
				newRelationship["endNode"] = getId.key;
			}
			let rel = that.dbref
				.child('diagrams/' + that.currentDiagram + '/data/relationships/')
				.push(newRelationship);
			that.dbref
				.child('diagrams/' + that.currentDiagram + '/data/relationships/' + rel.key)
				.update({
					"id": rel.key
				})
		}

		function dragged(node) {
			if(that.access != "Read Only"){
				that.dbref
					.child('diagrams/' + that.currentDiagram + '/data/nodes/' + node.id)
					.update({
					"x": d3.event.x,
					"y": d3.event.y
				});
			}
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
		let ref = this.dbref
			.child('diagrams/' + this.currentDiagram + '/data');
		ref
			.child('relationships/')
			.orderByChild('startNode')
			.equalTo(this.currentNode.id)
			.once('value', (snap) => {
				snap.forEach((snapChild) => {
					snapChild.ref.remove();
				});
			});
		ref
			.child('relationships/')
			.orderByChild('endNode')
			.equalTo(this.currentNode.id)
			.once('value', (snap) => {
				snap.forEach((snapChild) => {
					snapChild.ref.remove();
				});
			});
		ref
			.child('nodes/' + this.currentNode.id)
			.remove();
		this.showTools = false;
		this.ref.detectChanges();
	}

	saveR(){
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/relationships/' + this.currentR.id)
			.update({
				"type": this.currentR.type,
				"style": this.currentR.style
			})
	}

	deleteR(){
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/relationships/' + this.currentR.id)
			.remove();
		this.showTools = false;
		this.ref.detectChanges();
	}

	reverseR(){
		let swap = this.currentR.startNode;
		this.currentR.startNode = this.currentR.endNode;
		this.currentR.endNode = swap;
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/relationships/' + this.currentR.id)
			.update({
				"startNode": this.currentR.startNode,
				"endNode": this.currentR.endNode
			});
	}
}