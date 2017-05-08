import { Component, Inject, ChangeDetectorRef, AfterViewInit } from '@angular/core';

import { AngularFire, FirebaseApp } from 'angularfire2';
import * as d3 from 'd3'; 

import { Diagram } from './models/diagram.model';
import { Node } from './models/node.model';
import { Relationship } from './models/relationship.model';
import { RenderNodes } from './models/render-nodes';
import { RenderRelationships } from './models/render-relationships';
import { Database } from './shared/diagram.service';

@Component({
  selector: 'diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.css'],
  providers: [Database]
})

export class DiagramComponent implements AfterViewInit  {
    public dbref: any;
    public user: any;

    // Render
    public svg: any;
    public gNodes: any;
    public gRelationships: any;
    public gOverlay: any;
    public zoom: any;

    // User
    public currentDiagram: string;
    public access: string;

    // Tools
    public mirrorNode: any;
    public copyStyle: boolean = false;
    public addNode: boolean = false;
    public addRel: boolean = false;
    public relIndex: boolean = true;
    public deleteElement: boolean = false;   

    public showSlider: boolean = false
    public showEditForm: boolean = false;
    public showEditNode: boolean = false;

    constructor(
        private af: AngularFire, 
        @Inject(FirebaseApp) firebase: any,
        private ref: ChangeDetectorRef,
        private db: Database
    ) {
        this.dbref = firebase.database().ref();
        this.user = firebase.auth().currentUser;
    }

    ngAfterViewInit(){
        this.svg = d3.select("#diagram")
            .append("svg")
                .attr("class", "graph");
        this.zoomEvent();
        
        this.gNodes = this.svg.append("g")
            .attr("class", "layer nodes");
        this.gRelationships = this.svg.append("g")
            .attr("class", "layer relationships");
        this.gOverlay = this.svg.append("g")
            .attr("class", "layer overlay");

        this.loadData();
    }

    loadData(){

        // call zoom fit once when load the page
        let zoomFit = true;


        this.dbref
            .child('users/' + this.user.uid + "/currentDiagram")
            .on('value',
                (snap) => {
                    this.currentDiagram = snap.val();
                    this.showEditNode = false;
                    this.showSlider = false;

                    // user access
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

                    // diagram data
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

                    // History index
                    this.dbref
                        .child('diagrams/' + this.currentDiagram + '/currentIndex')
                        .on('value', (snapShot) => {
                            snapShot.ref.parent
                                .child('history/' + snapShot.val())
                                .once('value',
                                    (snap) => {
                                        if(snap.val()){
                                            snapShot.ref.parent.update({
                                                    'data': snap.val()
                                                });
                                        }
                                    });
                        });
            })
    }

    /*

        Render
        
    */
    render(data){
        let diagram, nodes, relationships;

        diagram = new Diagram();
        diagram.load(data);

        d3.selectAll('svg.graph > g > *').remove();
        
        nodes = new RenderNodes();
        nodes.render(this.gNodes, diagram.nodes);

        relationships = new RenderRelationships();
        relationships.render(this.gRelationships, diagram.relationships);

        this.mirrorNode = {
            "fill": "white",
            "color": "#292b2c",
            "isRectangle": false,
            "isLocked": false
        }

        this.renderOverlay(diagram);
    }

    renderOverlay(diagram){
        let that = this;
        let closestNode
        let newNode = new Node();
        let start;
        this.svg
            .on("click", function(){
                if(that.addNode){
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
            .data(diagram.nodes)

        nodeOverlays.enter()
            .append("rect")
                .attr("class", "node")
                .attr("width", (node) => { return node.radius * 2 + 4; })
                .attr("height", (node) => { return node.radius * 2 + 4; })
                .attr("x", (node) => { return node.x - 2; })
                .attr("y", (node) => { return node.y - 2; })
                .attr("rx", (node) => { return node.isRectangle ? 22 : node.radius + 2 })
                .attr("ry", (node) => { return node.isRectangle ? 22 : node.radius + 2 })
                .style("fill", "rgba(255, 255, 255, 0)")
                .on("mouseover", mOver)
                .on("mouseleave", mLeave)
                .on("click", (node) => {
                    if(this.access != "Read Only"){
                        if(!this.deleteElement){
                            if(this.addRel){
                                this.relIndex = !this.relIndex;
                                if(this.relIndex){
                                    //this.newR(this.currentNode.id, node.id)
                                }
                                //this.currentNode = node;
                            } else {
                                //this.currentNode = node;
                                this.copyMirrorNode(node);
                                //this.showNodeTools = true;
                                if(!this.copyStyle) {
                                    this.showEditForm = true;
                                    //this.showEditNode = true;
                                }
                            }
                            //this.ref.detectChanges();
                        } else {
                            //this.currentNode = node;
                            this.deleteNode(node.id);
                        }
                    }
                 })
                .call(d3.drag()
                .on('start', dragStart)
                .on("drag", dragged)
                .on("end", dragEnd));

        let relOverlays = this.gOverlay.selectAll("g.groups")
            .data(diagram.relationships);

        relOverlays.enter()
            .append("g")
                .attr("class", "groups")
              .selectAll("g.relationships")
                .data((d) => { return d; })
              .enter()
                .append("path")
                    .attr("class", "relationships")
                    .attr("transform", (rl) => {
                        return "translate("
                        + (rl.source.x + rl.source.radius)
                        + ","
                        + (rl.source.y + rl.source.radius)
                        + ")" + "rotate(" + rl.angle + ")";
                    })
                    .attr("d", (rl) => { return rl.path.outline; })
                    .attr("fill", "rgba(255, 255, 255, 0)")
                    .attr("stroke-width", 5)
                    .attr("stroke", "rgba(255, 255, 255, 0)")
                    .on("mouseover", mRingOver)
                    .on("mouseleave", mRingLeave)
                    .on("click", (rl) => {
                    if(this.access != "Read Only"){
                        if(!this.deleteElement){
                            //this.currentR = rl;

                          } else {
                            this.db.deleteR(rl, this.currentDiagram);
                          }
                    }
                   });

        let nodeRing = this.gOverlay.selectAll('rect.ring')
            .data(diagram.nodes)

        nodeRing.enter()
            .append("rect")
                .attr("class", "ring")
                .attr("width", (node) => { return node.radius * 2 + 12; })
                .attr("height", (node) => { return node.radius * 2 + 12; })
                .attr("fill", "none")
                .attr("stroke", "rgba(255, 255, 255, 0)")
                .attr("stroke-width", "8")
                .attr("x", (node) => { return node.x - 6; })
                .attr("y", (node) => { return node.y - 6; })
                .attr("rx", (node) => { return node.isRectangle ? 26 : node.radius + 6; })
                .attr("ry", (node) => { return node.isRectangle ? 26 : node.radius + 6; })
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
            newNode.fill = n.fill;
            newNode.color = n.color;
            newNode.x = d3.mouse(this)[0] - newNode.radius;
            newNode.y = d3.mouse(this)[1] - newNode.radius;

            for(let node of diagram.nodes){
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
                    .attr("fill", newNode.fill)
                    .attr("stroke", newNode.stroke)
                    .attr("stroke-width", newNode.strokeWidth)
                    .style("color", newNode.color);
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
                    .attr("d", diagram.horizontalArrow(n.radius + 12, distance, 5).outline)
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
                that.db.updateHistory(that.currentDiagram);
            }
        }
    }

    newNode(x, y){
        let node = new Node();
        node.id = "TempId";
        node.isRectangle = this.mirrorNode.isRectangle;
        node.fill = this.mirrorNode.fill;
        node.color = this.mirrorNode.color;
        node.x = x;
        node.y = y;

        this.db.addNode(node, this.currentDiagram);
    }

    saveNode(node) {
        node.radius = this.getTxtLength(node.caption);

        this.db.saveNode(node, this.currentDiagram);
    }

    deleteNode(nodeId) {
        let updateObj = {};
        // diagram.relationships.filter((rl) => {
        //     if(rl[0].startNode == this.currentNode.id || rl[0].endNode == this.currentNode.id){
        //         updateObj['relationships/' + rl[0].group] = null;
        //     }
        // })
        updateObj['nodes/' + nodeId] = null;
        this.db.deleteNode(updateObj, this.currentDiagram);
    }


    /* Relationship */

    newR(startNode, endNode){       
        let newRelationship = new Relationship();
        newRelationship["startNode"] = startNode;
        newRelationship["endNode"] = endNode;
        let group = startNode < endNode ? startNode + endNode:endNode + startNode;


        this.db.addR(newRelationship, group, this.currentDiagram);
    }


    getTxtLength(text){
        let txt = this.svg.append("text")
            .attr("font-size",  "50px")
            .text(text);
        let size = txt.node().getComputedTextLength() / 2 + 20;
        txt.remove();

        return size < 50 ? 50:size;
    }
    
    copyMirrorNode(node){
        if(this.copyStyle){
            node.color = this.mirrorNode.color;
            node.fill = this.mirrorNode.fill;
            node.isRectangle = this.mirrorNode.isRectangle;
            this.saveNode(node);
        } else {
            this.mirrorNode.color = node.color;
            this.mirrorNode.fill = node.fill;
            this.mirrorNode.isRectangle = node.isRectangle;
        }
    }

    undo(){
        this.db.changeHistory(-1, this.currentDiagram);
    }

    redo(){
        this.db.changeHistory(1, this.currentDiagram);
    }


    /* Zoom */

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
        if (gNodes.width == 0 || gNodes.height == 0) { return; }

        let svg = this.svg.node();

        let fullWidth = svg.clientWidth || svg.parentNode.clientWidth,
            fullHeight = svg.clientHeight || svg.parentNode.clientHeight;

        let midX = gNodes.x + gNodes.width / 2,
            midY = gNodes.y + gNodes.height / 2;


        let scale = 0.95 / Math.max(gNodes.width / fullWidth, gNodes.height / fullHeight);
        let tx = fullWidth / 2 - scale * midX,
                ty = fullHeight / 2 - scale * midY;
        let t = d3.zoomIdentity.translate(tx, ty).scale(scale);

        this.svg
            .transition()
            .call(this.zoom.transform, t);
    }

    zoomIn() {
        this.svg
            .transition()
            .call(this.zoom.scaleBy, 1.2);
    }

    zoomOut() {
        this.svg
            .transition()
            .call(this.zoom.scaleBy, 0.8);
    }

}