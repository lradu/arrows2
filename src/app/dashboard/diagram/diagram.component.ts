import { Component, Inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { AngularFire, FirebaseApp } from 'angularfire2';
import * as d3 from 'd3'; 

import { Node } from './graph/node';

@Component({
  selector: 'diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.css']
})

export class DiagramComponent implements OnInit {
	public svg: any;
	public zoom: any;
	public g: any;
	public showTools: boolean;

	constructor(private af: AngularFire) {
	}

	ngOnInit(){
		this.svg = d3.select("#diagram")
			.append("svg")
			.attr("class", "graph")
		this.g = this.svg.append("g");
		this.zoomEvent();
		this.renderNodes();
	}

	closeTools(){
		this.showTools = false;
	}

	zoomEvent() {
		this.zoom = d3.zoom()
      .scaleExtent([1/4, 10])
      .on("zoom", zoomed);

		this.svg.call(this.zoom)
			.on("wheel.zoom", null)
			.on("dblclick.zoom", null);

    function zoomed() {
        d3.select("g").attr("transform", d3.event.transform);
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

	renderNodes(){
		let width = 1500 , height = 1000, radius = 32;
		let rects = d3.range(20).map(function() {
			let node = new Node();
			node.x = Math.round(Math.random() * (width - radius * 2) + radius);
			node.y = Math.round(Math.random() * (height - radius * 2) + radius)
		  return node;
		});

		let color = d3.scaleOrdinal()
		    .range(d3.schemeCategory20);

		this.g.selectAll("rect")
		  .data(rects)
		  .enter().append("rect")
		    .attr("x", function(d) { return d.x; })
		    .attr("y", function(d) { return d.y; })
		   	.attr("width", 50)
		   	.attr("height", 50)
		   	.attr("rx",25)
		   	.attr("rx",25)
		    .style("fill", function(d, i) { return color(i); })
		    .on("dblclick", (node) => {
		    	this.showTools = true;
		     })
		    .call(d3.drag()
		        .on("start", dragstarted)
		        .on("drag", dragged)
		        .on("end", dragended));

		function dragstarted(d) {
		  d3.select(this).raise().classed("active", true);
		}

		function dragged(d) {
		  d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
		}

		function dragended(d) {
		  d3.select(this).classed("active", false);
		}
	}
}