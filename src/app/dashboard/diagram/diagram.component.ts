import { Component, Inject, ChangeDetectorRef, AfterContentInit  } from '@angular/core';
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

export class DiagramComponent implements AfterContentInit  {
	public svg: any;
	public gNodes: any;
	public gCaptions: any;
	public gOverlay: any;
	public gRelationships: any;
	public zoom: any;
	public model: Model;
	public groups: any;

	public dbref: any;
	public user: any;
	public currentDiagram: string;
	public currentNode: any;
	public currentR: any;
	public currentIndex: number;
	public maxIndex: number;
	public access: string;

	public showTools: boolean;
	public showNodeTools: boolean;
	public mirrorNode: any;
	public nodeLocked: boolean = false;
	public relLocked: boolean = false;
	public relIndex: boolean = true;
	public removeLocked: boolean = false;
	public showSlider: boolean = false;
	public playSlides: boolean = false;
	public speedSlider: number = 1300;

	constructor(
		private af: AngularFire, 
		@Inject(FirebaseApp) firebase: any,
		private ref: ChangeDetectorRef
		) {
			this.dbref = firebase.database().ref();
			this.user = firebase.auth().currentUser;
			this.mirrorNode = {
				"fill": "white",
				"color": "#292b2c",
				"isRectangle": false,
				"isLocked": false
			}
	}

	ngAfterContentInit(){
		this.svg = d3.select("#diagram")
			.append("svg")
				.attr("class", "graph");
		this.zoomEvent();
		this.gRelationships = this.svg.append("g")
			.attr("class", "layer relationships");
		this.gNodes = this.svg.append("g")
			.attr("class", "layer nodes");
		this.gCaptions = this.svg.append("g")
			.attr("class", "layer caption");
		this.gOverlay = this.svg.append("g")
			.attr("class", "layer overlay");
		this.model = new Model();
		this.loadData();
	}

	loadData(){
		let zoomFit = true;
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
								this.render(snapShot.val());
								if(zoomFit){
									this.zoomFit();
									zoomFit = false;
								}
						}
					}); 
						this.dbref
							.child('diagrams/' + this.currentDiagram + '/history')
							.once('value', 
								(snapShot) => {
									this.currentIndex = snapShot.numChildren();
									this.maxIndex = this.currentIndex;
								})
			})
	}

	/*

		Render
		
	*/
	render(data){
		this.model.load(data);
		d3.selectAll('svg.graph > g > *').remove();
		this.renderRelationships();
		this.renderNodes();
		this.renderOverlay();
	}
	renderNodes(){
		let nodes = this.gNodes.selectAll("rect.node")
		  .data(this.model.nodes)

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

		nodes.enter()
			.append("path")
				.attr("class", "node properties")
				.attr("transform", function(node) {
					return "translate("
					+ (node.x + 2 * node.radius)
					+ ","
					+ (node.y + node.radius)
					+ ")";
				})
				.attr("d", function(node){
					if(node.properties.text){
						node["lines"] = node.properties.text.split("\n");
						let l = node.lines.length;
						return "M 0 0" +
						"L 20 -10" +
						"L 20 " + -(l * 25) +
						"A 10 10 0 0 1 30" + -(l * 25 + 10) +
			 			"L " + (node.properties.width * 2)  + " " + -(l * 25 + 10) +
						"A 10 10 0 0 1 " + (node.properties.width * 2 + 10) + " " + -(l * 25) +
						"L " + (node.properties.width * 2 + 10) + " " + (l * 25) +
						"A 10 10 0 0 1 " + (node.properties.width * 2) + " " + (l * 25 + 10) +
						"L 30 " + (l * 25 + 10) +
						"A 10 10 0 0 1 20 " + (l * 25) +
						"L 20 10" +
						"Z";
					}
				})
				.attr("fill", "white")
				.attr("stroke", "#333333")
				.attr("stroke-width", 2);
		let gProperties = nodes.enter()
			.append("g")
			.attr("class", "properties");
		gProperties.selectAll("text")
			.enter()	
			.data(function(node) { if(node.lines){
				let list = [];
				for(let i = 0; i < node.lines.length; i++){;
					list.push({
						"text": node.lines[i],
						"x": node.x + 2 * node.radius + node.properties.width + 10,
						"y": node.y + node.radius + (i - node.lines.length) * 25 + (i + 1) * 25,
						"color": node.style.color
					});
				}
				return list;
			} else {
				return [];
			}})
			.enter()
			.append("text")
				.attr("x", function(p) { return p.x; })
				.attr("y", function(p) { return p.y; })
				.attr("fill", function(p) { return p.color; })
				.attr("class", "properties")
				.attr("text-anchor", "middle")
				.attr("font-size",  "50px")
				.attr("alignment-baseline", "central")
				.text(function(p) { return p.text; });				

		let captions = this.gCaptions.selectAll("text.node.caption")
			.data(this.model.nodes)

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
	}
	renderRelationships(){
		let that = this;
		let gRel = this.gRelationships.selectAll("g.groups")
			.data(this.model.relationships);

		let rel = gRel.enter()
			.append("g")
				.attr("class", "groups")
		 	  .selectAll("g.relationships")
				.data(function(d) { return d; })
		 		
		rel.enter()
			.append("path")
				.attr("class", "relationships")
				.attr("transform", function(rl) {
					return "translate("
					+ (rl.source.x + rl.source.radius)
					+ ","
					+ (rl.source.y + rl.source.radius)
					+ ")" + "rotate(" + rl.angle + ")";
				})
				.attr("d", function(rl, i) {
					if(i){
						rl["position"] = that.curvedArrow(rl.source.radius + 12, rl.target.radius, rl.distance, i * 10, 5, 20, 20);
						rl["d"] = rl.position.outline;
						return rl.position.outline;
					} else {
						rl["position"]  = that.horizontalArrow(rl.source.radius + 12, rl.distance - rl.target.radius, 5);
						rl["d"] = rl.position.outline;
						return rl.position.outline;
					}
				})
				.attr("fill", function(rl) { return rl.style.fill; })
				
		rel.enter()
			.append("text")
				.attr("x", function(rl) { return rl.position.apex.x; })
				.attr("y", function(rl) { return rl.position.apex.y; })
				.attr("transform", function(rl) {
					return "translate("
					+ (rl.source.x + rl.source.radius)
					+ ","
					+ (rl.source.y + rl.source.radius)
					+ ")" + "rotate(" + rl.angle + ")";
				})
				.attr("fill", "#ffffff")
				.attr("stroke", "black")
				.attr("stroke-width", 2)
				.attr("class", "node caption")
				.attr("text-anchor", "middle")
				.attr("font-size",  "50px")
				.attr("alignment-baseline", "central")
				.text(function(rl) { return rl.type; });

		rel.enter()
			.append("path")
				.attr("class", "node properties")
				.attr("transform", function(rl) {
					return "translate("
					+ (rl.source.x + rl.source.radius + rl.position.apex.x)
					+ ","
					+ (rl.source.y + rl.source.radius + rl.position.apex.y)
					+ ")";
				})
				.attr("d", function(rl){
					if(rl.properties.text){
						rl["lines"] = rl.properties.text.split("\n");
						let l = rl.lines.length;
						return "M 0 0" +
						"L 20 -10" +
						"L 20 " + -(l * 25) +
						"A 10 10 0 0 1 30" + -(l * 25 + 10) +
			 			"L " + (rl.properties.width * 2)  + " " + -(l * 25 + 10) +
						"A 10 10 0 0 1 " + (rl.properties.width * 2 + 10) + " " + -(l * 25) +
						"L " + (rl.properties.width * 2 + 10) + " " + (l * 25) +
						"A 10 10 0 0 1 " + (rl.properties.width * 2) + " " + (l * 25 + 10) +
						"L 30 " + (l * 25 + 10) +
						"A 10 10 0 0 1 20 " + (l * 25) +
						"L 20 10" +
						"Z";
					}
				})
				.attr("fill", "white")
				.attr("stroke", "#333333")
				.attr("stroke-width", 2);

		let gProperties = rel.enter()
			.append("g")
			.attr("class", "properties");
		gProperties.selectAll("text")
			.enter()	
			.data(function(rl) { if(rl.lines){
				let list = [];
				for(let i = 0; i < rl.lines.length; i++){;
					list.push({
						"text": rl.lines[i],
						"x": rl.position.apex.x,
						"y": rl.position.apex.y + (i - rl.lines.length) * 25 + (i + 1) * 25,
						"color": rl.style.fill,
						"tx": rl.source.x + rl.source.radius,
						"ty": rl.source.y + rl.source.radius,
						"angle": rl.angle
					});
				}
				return list;
			} else {
				return [];
			}})
			.enter()
			.append("text")
				.attr("x", function(p) { return p.x; })
				.attr("y", function(p) { return p.y - 100; })
				.attr("transform", function(p) {
					return "translate(" + p.tx + "," + p.ty + ")" + "rotate(" + p.angle + ")";
				})
				.attr("fill", function(p) { return p.color; })
				.attr("class", "properties")
				.attr("text-anchor", "middle")
				.attr("font-size",  "50px")
				.attr("alignment-baseline", "central")
				.text(function(p) { return p.text; });

	}
	renderOverlay(){
		let that = this;
		let closestNode
		let newNode = new Node();
		let start;
		this.svg
			.on("click", function(){
				if(that.nodeLocked){
					let x = d3.mouse(that.gNodes.node())[0] - 50;
					let y = d3.mouse(that.gNodes.node())[1] - 50;
					that.newNode(x, y);
				}
			})
		this.gNodes.selectAll("rect.newNode")
			.data([newNode])
			.enter()
				.append("rect")
					.attr("class", "newNode")
					.attr("width", newNode.radius * 2)
					.attr("height", newNode.radius * 2)
					.attr("fill", "none");
		this.gRelationships.selectAll("path.newRelationship")
			.data([newNode])
			.enter()
			.append("path")
				.attr("class", "newRelationship");

		let nodeOverlays = this.gOverlay.selectAll("rect.node")
			.data(this.model.nodes)

		nodeOverlays.enter()
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
			  		if(!this.removeLocked){
					   	if(this.relLocked){
					   		this.relIndex = !this.relIndex;
					   		if(this.relIndex){
					   			this.newR(this.currentNode.id, node.id)
					   		}
					   		this.currentNode = node;
					   	} else {
					   		this.currentNode = node;
					   		this.copyMirrorNode();
						   	this.showNodeTools = true;
						  	if(!this.mirrorNode.isLocked) { this.showTools = true; }
					  	}
					  	this.ref.detectChanges();
					  } else {
					  	this.currentNode = node;
					  	this.deleteNode();
					  }
			  	}
			   })
			  .call(d3.drag()
			  	.on('start', dragStart)
			    .on("drag", dragged)
			  	.on("end", dragEnd));

		let relOverlays = this.gOverlay.selectAll("g.groups")
			.data(this.model.relationships);

		relOverlays.enter()
			.append("g")
				.attr("class", "groups")
		 	  .selectAll("g.relationships")
				.data(function(d) { return d; })
		 	  .enter()
				.append("path")
					.attr("class", "relationships")
					.attr("transform", function(rl) {
						return "translate("
						+ (rl.source.x + rl.source.radius)
						+ ","
						+ (rl.source.y + rl.source.radius)
						+ ")" + "rotate(" + rl.angle + ")";
					})
					.attr("d", function(rl) { return rl.d; })
					.attr("fill", "rgba(255, 255, 255, 0)")
					.attr("stroke-width", 5)
					.attr("stroke", "rgba(255, 255, 255, 0)")
					.on("mouseover", mRingOver)
					.on("mouseleave", mRingLeave)
					.on("click", (rl) => {
				  	if(this.access != "Read Only"){
				  		if(!this.removeLocked){
						   	this.currentR = rl;
						   	this.showNodeTools = false;
						  	this.showTools = true;
						  	this.ref.detectChanges();
						  } else {
						  	this.currentR = rl;
						  	this.deleteR();
						  }
				  	}
				   });

		let nodeRing = this.gOverlay.selectAll('rect.ring')
			.data(this.model.nodes)

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
			if(that.access === "Read Only") return;

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

			let distance = n.distanceTo(newNode) - newNode.radius - 12;
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
					.attr("d", that.horizontalArrow(n.radius + 12, distance, 5).outline)
					.attr("fill", "#333333");			
			}
		}

		function dragEndRing(n){
			if(that.access === "Read Only") return;
			if(closestNode){
				that.newR(n.id, closestNode);
			} else {
				let getId = that.dbref
					.child('diagrams/' + that.currentDiagram + '/data/nodes')
					.push(newNode);
				getId.ref.update({
					"id": getId.key
				}).then(() => {
					that.newR(n.id, getId.key);
				});
			}
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
		function dragStart(){
			if(that.access === "Read Only") return;
			start = [d3.event.x, d3.event.y];
		}
		function dragEnd(){
			if(that.access === "Read Only") return;
			if(Math.max(Math.abs(Math.abs(d3.event.x) - Math.abs(start[0])), Math.abs(Math.abs(d3.event.y) - Math.abs(start[1]))) > 10){ 
				// prevent dragend on click 
				that.updateHistory();
			}
		}
	}

	/*
		Arrows
	*/
	horizontalArrow(start, end, arrowWidth) {
	    let shaftRadius = arrowWidth / 2;
	    let headRadius = arrowWidth * 2;
	    let headLength = headRadius * 2;
	    let shoulder = start < end ? end - headLength : end + headLength;
	    return {
	        outline: [
	            "M", start, shaftRadius,
	            "L", shoulder, shaftRadius,
	            "L", shoulder, headRadius,
	            "L", end, 0,
	            "L", shoulder, -headRadius,
	            "L", shoulder, -shaftRadius,
	            "L", start, -shaftRadius,
	            "Z"
	        ].join(" "),
	        apex: {
	            "x": start + (shoulder - start) / 2,
	            "y": 0
	        }
	    };
	} 
	curvedArrow(startRadius, endRadius, endCentre, minOffset, arrowWidth, headWidth, headLength){
	  let startAttach, endAttach, offsetAngle;

	  function square(l){ return l * l; }

	  let radiusRatio = startRadius / (endRadius + headLength);
	  let homotheticCenter = -endCentre * radiusRatio / (1 - radiusRatio);

	  function intersectWithOtherCircle(fixedPoint, radius, xCenter, polarity){
	      let gradient = fixedPoint.y / (fixedPoint.x - homotheticCenter);
	      let hc = fixedPoint.y - gradient * fixedPoint.x;

	      let A = 1 + square(gradient);
	      let B = 2 * (gradient * hc - xCenter);
	      let C = square(hc) + square(xCenter) - square(radius);

	      let intersection = { "x": (-B + polarity * Math.sqrt( square( B ) - 4 * A * C )) / (2 * A) };
	      intersection["y"] = (intersection.x - homotheticCenter) * gradient;

	      return intersection;
	  }

	  if(endRadius + headLength > startRadius){
	      offsetAngle = minOffset / startRadius;
	      startAttach = {
	          x: Math.cos( offsetAngle ) * (startRadius),
	          y: Math.sin( offsetAngle ) * (startRadius)
	      };
	      endAttach = intersectWithOtherCircle( startAttach, endRadius + headLength, endCentre, -1 );
	  } else {
	      offsetAngle = minOffset / endRadius;
	      endAttach = {
	          x: endCentre - Math.cos( offsetAngle ) * (endRadius + headLength),
	          y: Math.sin( offsetAngle ) * (endRadius + headLength)
	      };
	      startAttach = intersectWithOtherCircle( endAttach, startRadius, 0, 1 );
	  }

	  let
	      g1 = -startAttach.x / startAttach.y,
	      c1 = startAttach.y + (square( startAttach.x ) / startAttach.y),
	      g2 = -(endAttach.x - endCentre) / endAttach.y,
	      c2 = endAttach.y + (endAttach.x - endCentre) * endAttach.x / endAttach.y;

	  let cx = ( c1 - c2 ) / (g2 - g1);
	  let cy = g1 * cx + c1;

	  let arcRadius = Math.sqrt(square(cx - startAttach.x) + square(cy - startAttach.y));

	  function startTangent(dr){
	      let dx = (dr < 0 ? -1 : 1) * Math.sqrt(square(dr) / (1 + square(g1)));
	      let dy = g1 * dx;
	      return [
	          startAttach.x + dx,
	          startAttach.y + dy
	      ].join(",");
	  }

	  function endTangent(dr){
	      let dx = (dr < 0 ? -1 : 1) * Math.sqrt(square(dr) / (1 + square(g2)));
	      let dy = g2 * dx;
	      return [
	          endAttach.x + dx,
	          endAttach.y + dy
	      ].join(",");
	  }

	  function endNormal(dc){
	      let dx = (dc < 0 ? -1 : 1) * Math.sqrt(square(dc) / (1 + square(1 / g2)));
	      let dy = dx / g2;
	      return [
	          endAttach.x + dx,
	          endAttach.y - dy
	      ].join(",");
	  }

	  let shaftRadius = arrowWidth / 2;
	  let headRadius = headWidth / 2;

	  return {
	      outline: [
	          "M", startTangent(-shaftRadius),
	          "L", startTangent(shaftRadius),
	          "A", arcRadius - shaftRadius, arcRadius - shaftRadius, 0, 0, minOffset > 0 ? 0 : 1, endTangent(-shaftRadius),
	          "L", endTangent(-headRadius),
	          "L", endNormal(headLength),
	          "L", endTangent(headRadius),
	          "L", endTangent(shaftRadius),
	          "A", arcRadius + shaftRadius, arcRadius + shaftRadius, 0, 0, minOffset < 0 ? 0 : 1, startTangent(-shaftRadius)
	      ].join( " " ),
	      apex: {
	          "x": cx,
	          "y": cy > 0 ? cy - arcRadius : cy + arcRadius
	      }
	  };
	} 

	/*

		Node

	*/
	newNode(x, y){
		let node = new Node();
		node.isRectangle = this.mirrorNode.isRectangle;
		node.style.fill = this.mirrorNode.fill;
		node.style.color = this.mirrorNode.color;
		node.x = x;
		node.y = y;

		let getId = this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/nodes')
			.push(node);
		getId.ref.update({
			"id": getId.key
		}).then(
		(success) =>{
			this.updateHistory();
		});
	}
	saveNode() {
		let maxline = "";
		for(let l of this.currentNode.properties.text.split("\n")){
			if(maxline.length < l.length){
				maxline = l;
			}
		}
		this.currentNode.radius = this.getTxtLength(this.currentNode.caption);
		this.currentNode.properties.width = this.getTxtLength(maxline);

		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/nodes/' + this.currentNode.id)
			.update({
				"caption": this.currentNode.caption,
				"isRectangle": this.currentNode.isRectangle,
				"radius": this.currentNode.radius,
				"style": this.currentNode.style,
				"properties": this.currentNode.properties
			}).then(
		(success) =>{
			this.updateHistory();
		});
		this.showTools = false;
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
			}).then(
		(success) =>{
			this.updateHistory();
		});
		ref
			.child('nodes/' + this.currentNode.id)
			.remove();
		this.showTools = false;
		this.ref.detectChanges();
	}

	getTxtLength(text){
		let g = this.svg.append("g");
		let txt = g.append("text")
			.attr("font-size",  "50px")
			.text(text);
		let size = txt.node().getComputedTextLength() / 2 + 20;
		g.remove();

		return size < 50 ? 50:size;
	}
	
	copyMirrorNode(){
		if(this.mirrorNode.isLocked){
			this.currentNode.style.color = this.mirrorNode.color;
			this.currentNode.style.fill = this.mirrorNode.fill;
			this.currentNode.isRectangle = this.mirrorNode.isRectangle;
			this.saveNode();
		} else {
			this.mirrorNode.color = this.currentNode.style.color;
			this.mirrorNode.fill = this.currentNode.style.fill;
			this.mirrorNode.isRectangle = this.currentNode.isRectangle;
		}
	}

	/*

		Relationship

	*/
	newR(startNode, endNode){
		let newRelationship = new Relationship();
		newRelationship["startNode"] = startNode;
		newRelationship["endNode"] = endNode;
		let key = startNode < endNode ? startNode + endNode:endNode + startNode;
		let rel = this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/relationships/' + key)
			.push(newRelationship);
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/relationships/' + key + "/" + rel.key)
			.update({
				"id": rel.key
			}).then(
			(success) =>{
				this.updateHistory();
			});
	}
	saveR(){
		let maxline = "";
		for(let l of this.currentR.properties.text.split("\n")){
			if(maxline.length < l.length){
				maxline = l;
			}
		}
		this.currentR.properties.width = this.getTxtLength(maxline);
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/relationships/' + this.currentR.group + "/" + this.currentR.id)
			.update({
				"type": this.currentR.type,
				"style": this.currentR.style,
				"properties": this.currentR.properties
			}).then(
		(success) =>{
			this.updateHistory();
		});
		this.showTools = false;
		this.ref.detectChanges();
	}

	deleteR(){
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/relationships/' + this.currentR.group + "/" + this.currentR.id)
			.remove()
			.then(
			(success) =>{
				this.updateHistory();
			});
		this.showTools = false;
		this.ref.detectChanges();
	}

	reverseR(){
		this.currentR.reverse();
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/relationships/' + this.currentR.group + "/" + this.currentR.id)
			.update({
				"startNode": this.currentR.startNode,
				"endNode": this.currentR.endNode
			})
			.then(
			(success) =>{
				this.updateHistory();
			});
	}

	/*

		Tools
		
	*/
	closeTools(){
		this.showTools = false;
		this.ref.detectChanges();
	}
	updateHistory(){
		this.currentIndex += 1;
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data')
			.once('value', 
				(snap) => { 
					snap.ref.parent
						.child('history')
						.update({
							[this.currentIndex]: snap.val()
						});
				}).then(
				(success) => {
					this.maxIndex = this.currentIndex;
					this.dbref
						.child('diagrams/' + this.currentDiagram + '/history')
						.once('value', 
							(snapShot) => {
								for(let i = snapShot.numChildren(); i > this.maxIndex; i--){
									snapShot.ref.child('' + i).remove();
								}
							});
				});
	}
	undo(){
		this.currentIndex -= 1;
		this.revertHistory();
		this.translateCircle(this.currentIndex);
		this.colorSlide(this.currentIndex);
	}
	redo(){
		this.currentIndex += 1;
		this.revertHistory();
		this.translateCircle(this.currentIndex);
		this.colorSlide(this.currentIndex);
	}
	revertHistory(){
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/history/' + this.currentIndex)
			.once('value',
				(snap) => {
					if(snap.val()){
					this.dbref
						.child('diagrams/' + this.currentDiagram)
						.update({
							'data':snap.val()
						});
					}
				});
	}
	/*

		Slider
		
	*/
	slider(){
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/history')
			.once('value', (snap) => {
				if(!snap.val()){
					return;
				} 
				let data = new Array((snap.numChildren() - 1) * 2);
				let fullWidth = this.svg.node().clientWidth || this.svg.node().parentNode.clientWidth;
				let width = (fullWidth - 40) / data.length;
				let x = -width;
				let g = d3.select("#gslider");
				g.selectAll("rect")
					.remove();
				g.selectAll("rect")
					.data(data)
					.enter()
					.append("rect")
					.attr("x", function(){
						x += width;
						return x;
					})
					.attr("y", 5)
					.attr("width", width)
					.attr("height", 8)
					.attr("fill", (data, i) => {
						if(i >= (this.currentIndex - 1) * 2){
							return "lightgray";
						}
						return "#cc0000";
					})
					.style("cursor", "pointer")
					.on('click', (data, i) => {
						if(!i){
							this.currentIndex = 1;
						} else if(i == (this.maxIndex - 1) * 2 - 1){
							this.currentIndex = this.maxIndex;
						} else {
							this.currentIndex = Math.floor(i / 2) + 1;
							if(i % 2){
								this.currentIndex += 1;
							}
						}
						this.colorSlide(this.currentIndex);
						this.translateCircle(this.currentIndex);
						this.revertHistory();
					});
			
				g.selectAll("circle")
					.remove();	
				let circle = g.append("circle")
					.attr("id", "slidehead")
					.attr("cx", 0) 
					.attr("cy", 9)
					.attr("r", 8)
					.attr("fill", "#990000")
					.call(d3.drag()
						.on("drag", drag));
				this.translateCircle(this.currentIndex);

				let that = this;
				function drag(){
					let x = (that.currentIndex - 1) * (width * 2);
					if(d3.event.x > 0 && d3.event.x <= width * data.length){
						if(d3.event.x < x - width){
							circle.attr("transform", "translate(" + (x - (width * 2)) + ",0)");
							that.currentIndex -= 1;
							that.revertHistory();
							that.colorSlide(that.currentIndex);
						} else if(d3.event.x > x + width){
							circle.attr("transform", "translate(" + (x + (width * 2)) + ",0)");
							that.currentIndex += 1;
							that.revertHistory();
							that.colorSlide(that.currentIndex);
						}
					}
				}
			})
	}

	playSlider(i){
		let interval = setInterval(() => {
			this.currentIndex += i;
			if(this.currentIndex > this.maxIndex || !this.playSlides){
				this.currentIndex = this.maxIndex;
				clearInterval(interval);
				this.playSlides = false;
				return;
			} else if(this.currentIndex < 1){
				this.currentIndex = 1;
				clearInterval(interval);
				this.playSlides = false;
				return;
			}
			this.revertHistory();
			this.translateCircle(this.currentIndex);
			this.colorSlide(this.currentIndex);
			}, 2300 - this.speedSlider);
	}

	replaySlider(){
		this.currentIndex = 1;
		this.revertHistory();
		this.translateCircle(this.currentIndex);
		this.colorSlide(this.currentIndex);
		this.playSlider(1);
	}

	translateCircle(i){
		i -= 1;
		let fullWidth = this.svg.node().clientWidth || this.svg.node().parentNode.clientWidth;
		let width = (fullWidth - 40) / (this.maxIndex - 1);
		d3.select("#slidehead").attr("transform", "translate(" + (i * width) + ",0)");
	}
	colorSlide(i){
		let g = d3.select("#gslider");
		let nodes = g.selectAll("rect").nodes();
		for(let j = 0; j < nodes.length; j++ ){
			d3.select(nodes[j])
				.attr("fill", function(){
					if(j >= (i - 1) * 2) return "lightgray";
					return "#cc0000";
				});
		}
	}

	/*
		
		Branch

	*/
	createBranch(title, choice){
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/history')
			.once('value', (snap) => {
				if(!snap.val()){
					return;
				}
				let data, history = {};
				snap.forEach((child) => {
					if(child.key == this.currentIndex){
						history[child.key] = child.val();
						data = child.val();
						snap.ref.parent
							.child('users/' + this.user.uid + '/access')
							.once('value', (snapChild) => {
								this.newDiagram(data, history, snapChild.val(), title, choice);
							});
						return;
					}
					history[child.key] = child.val();
				});
			});
	}

	newDiagram(data, history, access, title, choice){
		let date = new Date().toLocaleDateString();
		this.dbref.child('diagrams/').push({
			"data": data,
			"history": history,
			"info" : {
        "created" : date,
        "lastUpdate" : date,
        "title" : title
      },
      "users" : {
        [this.user.uid] : {
          "access" : access,
          "dateAdded" : date,
          "email" : this.user.email,
          "lastUpdate" : date
        }
      }
		}).then(
			(newD) => {
				this.showSlider = false;
				this.dbref
					.child('users/' + this.user.uid + '/diagrams')
					.update({
						[newD.key]: true
				});
				if(choice){
					return;
				}
				this.dbref
					.child('users/' + this.user.uid)
					.update({
						"currentDiagram": newD.key
					})
			});
	}

	/*

		Zoom
		
	*/
	zoomEvent() {
		this.zoom = d3.zoom()
      .scaleExtent([1/10, 10])
      .on("zoom", zoomed);

		this.svg.call(this.zoom)
			.on("wheel.zoom", null)
			.on("dblclick.zoom", null);

    function zoomed() {
        d3.selectAll("g.layer").attr("transform", d3.event.transform);
    }
	}

	zoomFit(){
    let gNodes = this.gNodes.node().getBBox();
  	let svg = this.svg.node();
  	let fullWidth = svg.clientWidth || svg.parentNode.clientWidth,
  	    fullHeight = svg.clientHeight || svg.parentNode.clientHeight;
  	    
  	let width = gNodes.width,
  	    height = gNodes.height;
  	let midX = gNodes.x + width / 2,
  	    midY = gNodes.y + height / 2;

  	if (width == 0 || height == 0) { return; }

  	let scale = 0.95 / Math.max(width / fullWidth, height / fullHeight);
  	let tx = fullWidth / 2 - scale * midX,
  			ty = fullHeight / 2 - scale * midY;
  	let t = d3.zoomIdentity.translate(tx, ty).scale(scale);

  	this.svg
  		.transition()
  		.call(this.zoom.transform, t);
	}

	zoomChange(val) {
		if(val) {
			this.svg
				.transition()
				.call(this.zoom.scaleBy, 1.2);
		} else {
			this.svg
				.transition()
				.call(this.zoom.scaleBy, 0.8);
		}
	}

}