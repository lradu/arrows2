export class RenderRelationships {

    constructor() {}

    render(gRelationships, relList){
        let gRel = gRelationships.selectAll("g.groups")
            .data(relList);

        let rel = gRel.enter()
            .append("g")
                .attr("class", "groups")
              .selectAll("path.relationships")
                .data((g) => { return g; });
                
        rel.enter()
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
                .attr("fill", (rl) => { return rl.fill; });
                

        rel.enter()
            .append("g")
                .attr("class", "group")
                .attr("transform", (rl) => {
                    return "translate("
                    + (rl.source.x + rl.source.radius)
                    + ","
                    + (rl.source.y + rl.source.radius)
                    + ")" + "rotate(" + rl.angle + ")";
                })
            .append("text")
                .attr("x", (rl) => { return rl.path.apex.x; })
                .attr("y", (rl) => { return rl.path.apex.y - 40; })
                .attr("fill", "#333333")
                .attr("class", "relationship type")
                .attr("text-anchor", "middle")
                .attr("font-size",  "50px")
                .attr("alignment-baseline", "central")
                .text((rl) => { return rl.type; });

        rel.enter()
            .append("g")
                .attr("class", "group")
                .attr("transform", (rl) => {
                    return "translate("
                    + (rl.source.x + rl.source.radius)
                    + ","
                    + (rl.source.y + rl.source.radius)
                    + ")" + "rotate(" + rl.angle + ")";
                })
            .append("path")
                .attr("class", "relationship bubble")
                .attr("transform", (rl) => {
                    return "translate("
                    + rl.path.apex.x
                    + ","
                    + rl.path.apex.y
                    + ")";
                })
                .attr("d", (rl) => { return rl.propertiesPath; })
                .attr("fill", "white")
                .attr("stroke", "#333333")
                .attr("stroke-width", 2);

        let gProperties = rel.enter()
            .append("g")
            .attr("class", "relationship properties")
            .attr("transform", (rl) => {
                if(rl.propertiesList) {
                    return "translate("
                    + (rl.source.x + rl.source.radius)
                    + ","
                    + (rl.source.y + rl.source.radius)
                    + ")" + "rotate(" + rl.angle + ")";
                } else { 
                    return "";
                }
            })
        gProperties.selectAll("text")
            .enter()    
            .data((rl) => { 
                if(rl.propertiesList){
                    let list = [];
                    for(let i = 0; i < rl.propertiesList.length; i++){;
                        list.push({
                            "text": rl.propertiesList[i],
                            "x": rl.path.apex.x,
                            "y": rl.path.apex.y + (i * 50) + 40,
                            "color": rl.fill,
                            "angle": rl.angle
                        });
                    }
                    return list;
                } else {
                    return [];
                }
            })
            .enter()
            .append("text")
                .attr("x", (p) => { return p.x; })
                .attr("y", (p) => { return p.y; })
                .attr("fill", (p) => { return p.color; })
                .attr("class", "properties")
                .attr("text-anchor", "middle")
                .attr("font-size",  "50px")
                .attr("alignment-baseline", "central")
                .text((p) => { return p.text; });
    }
}
