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
		let newNode = new Node();
		let list = [];

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
					+ (source.x + source.radius + 4)
					+ ","
					+ (source.y + source.radius + 4)
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
				.attr("fill", "#333333");

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
			newNode.isRectangle = n.isRectangle;
			newNode.style.fill = n.style.fill;
			newNode.style.color = n.style.color;
			newNode.x = d3.mouse(this)[0] - newNode.radius;
			newNode.y = d3.mouse(this)[1] - newNode.radius;
			list.push(newNode);

			let distance = n.distanceTo(newNode) - newNode.radius - 34;
			let news = that.gNodes.selectAll("rect.newNode")
					.data(list);
			news.remove();
			news.enter()
						.append("rect")
					  	.attr("class", "newNode")
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

			if(distance > n.radius){
				let rel = that.gRelationships.selectAll("path.newRelationship")
					.data(list);
				rel.remove();
				rel.enter()
					.append("path")
						.attr("class", "newRelationship")
						.attr("transform", 
							"translate(" 
							+ (n.x + n.radius + 4)
							+ ","
							+ (n.y + n.radius + 4)
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

		function dragEndRing(node){
			let newRelationship = new Relationship();
			let getId = that.dbref
				.child('diagrams/' + that.currentDiagram + '/data/nodes')
				.push(newNode);
			getId.ref.update({
				"id": getId.key
			});
			newRelationship["startNode"] = node.id;
			newRelationship["endNode"] = getId.key;
			that.dbref
				.child('diagrams/' + that.currentDiagram + '/data/relationships/')
				.push(newRelationship);
		}

		function dragged(node) {
			// node.x = d3.event.x;
			// node.y = d3.event.y;
			//d3.select(this).attr("x", node.x = d3.event.x).attr("y", node.y = d3.event.y);
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
}