import { Node } from './node.model';
import { Relationship } from './relationship.model';

export class Diagram {
	public nodes: Array<Node>;
	public relationships: Array<Array<Relationship>>;
	
	constructor() {}

	load(data){
		this.nodes = [];
		this.relationships = [];

		let node, group, relationship, length, distance;

		// nodes
		for(let key in data.nodes){
			node =  new Node();
			Object.assign(node, data.nodes[key]);

			if(node.properties){
				node.propertiesList = node.properties.split('\n');
				length = node.propertiesList.length;
				node.propertiesPath = this.speechBubblePath(node.propertiesWidth * 2, length * 50, "horizontal", 10, 10);
			}
			this.nodes.push(node);
		}

		// relationships
		for(let g in data.relationships) {
			group = [];
			for(let key in data.relationships[g]){
				relationship = new Relationship();
				Object.assign(relationship, data.relationships[g][key]);

				if(relationship.properties){
					relationship.propertiesList = relationship.properties.split('\n');
					length = relationship.propertiesList.length;
					relationship.propertiesPath = this.speechBubblePath(relationship.propertiesWidth * 2, length * 50, "vertical", 10, 10);
				}

				relationship.source = this.nodes.find( x => x.id == relationship.startNode);
				relationship.target = this.nodes.find( x => x.id == relationship.endNode);
				relationship.angle = relationship.source.angleTo(relationship.target);
				relationship.group = g;

				distance = relationship.source.distanceTo(relationship.target) - 12;
				if(Object.keys(data.relationships[g]).length === 1) {
					relationship.path = this.horizontalArrow(relationship.source.radius + 12, distance - relationship.target.radius, 5);
				} else {
					relationship.path = this.curvedArrow(relationship.source.radius + 12, relationship.target.radius, distance, (group.length + 1) * 10, 5, 20, 20);
				}


				group.push(relationship);
			}
			this.relationships.push(group);
		}
	}

	speechBubblePath(width, height, style, margin, padding) {
	    let styles = {
	        diagonal: [
	            "M", 0, 0,
	            "L", margin + padding, margin,
	            "L", margin + width + padding, margin,
	            "A", padding, padding, 0, 0, 1, margin + width + padding * 2, margin + padding,
	            "L", margin + width + padding * 2, margin + height + padding,
	            "A", padding, padding, 0, 0, 1, margin + width + padding, margin + height + padding * 2,
	            "L", margin + padding, margin + height + padding * 2,
	            "A", padding, padding, 0, 0, 1, margin, margin + height + padding,
	            "L", margin, margin + padding,
	            "Z"
	        ],
	        horizontal: [
	            "M", 0, 0,
	            "L", margin, -padding,
	            "L", margin, -height / 2,
	            "A", padding, padding, 0, 0, 1, margin + padding, -height / 2 - padding,
	            "L", margin + width + padding, -height / 2 - padding,
	            "A", padding, padding, 0, 0, 1, margin + width + padding * 2, -height / 2,
	            "L", margin + width + padding * 2, height / 2,
	            "A", padding, padding, 0, 0, 1, margin + width + padding, height / 2 + padding,
	            "L", margin + padding, height / 2 + padding,
	            "A", padding, padding, 0, 0, 1, margin, height / 2,
	            "L", margin, padding,
	            "Z"
	        ],
	        vertical: [
	            "M", 0, 0,
	            "L", -padding, margin,
	            "L", -width / 2, margin,
	            "A", padding, padding, 0, 0, 0, -width / 2 - padding, margin + padding,
	            "L", -width / 2 - padding, margin + height + padding,
	            "A", padding, padding, 0, 0, 0, -width / 2, margin + height + padding * 2,
	            "L", width / 2, margin + height + padding * 2,
	            "A", padding, padding, 0, 0, 0, width / 2 + padding, margin + height + padding,
	            "L", width / 2 + padding, margin + padding,
	            "A", padding, padding, 0, 0, 0, width / 2, margin,
	            "L", padding, margin,
	            "Z"
	        ]
	    };
	    return styles[style].join(" ");
	}

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
}