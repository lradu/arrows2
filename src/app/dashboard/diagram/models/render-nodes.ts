export class RenderNodes {

    constructor() {}

    render(gNodes, nodeList){
        let nodes = gNodes.selectAll("rect.node")
          .data(nodeList)

        nodes.enter()
            .append("rect")
            .attr("class", "node")
            .attr("width", (node) => { return node.radius * 2; })
            .attr("height", (node) => { return node.radius * 2; })
            .attr("x", (node) => { return node.x; })
            .attr("y", (node) => { return node.y; })
            .attr("rx", (node) => { return node.isRectangle ? 20 : node.radius; })
            .attr("ry", (node) => { return node.isRectangle ? 20 : node.radius; })
            .attr("fill", (node) => { return node.fill; })
            .attr("stroke", (node) => { return node.stroke; })
            .attr("stroke-width", (node) => { return node.strokeWidth; })
            .style("color", (node) => { return node.color; });

        nodes.enter()
            .append("path")
                .attr("class", "node properties")
                .attr("transform", (node) => {
                    return "translate("
                    + (node.x + 2 * node.radius)
                    + ","
                    + (node.y + node.radius)
                    + ")";
                })
                .attr("d", (node) => { return node.propertiesPath; })
                .attr("fill", "white")
                .attr("stroke", "#333333")
                .attr("stroke-width", 2);

        let gProperties = nodes.enter()
            .append("g")
            .attr("class", "properties");
        gProperties.selectAll("text")
            .enter()    
            .data((node) => {
                let lines = [];
                if(node.propertiesList){
                    for(let i = 0; i < node.propertiesList.length; i++){
                        lines.push({
                            "text": node.propertiesList[i],
                            "x": node.x + 2 * node.radius + node.propertiesWidth + 20,
                            "y": node.y + node.radius + (i - node.propertiesList.length) * 25 + (i + 1) * 25,
                            "color": node.color
                        });
                    }
                }
                return lines;
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

        let captions = gNodes.selectAll("text.node.caption")
            .data(nodeList)

        captions.enter()
            .append("text")
                .attr("class", "node caption")
                .attr("x", (node) => { return node.x + node.radius; })
                .attr("y", (node) => { return node.y + node.radius; })
                .attr("fill", (node) => { return node.color })
                .attr("text-anchor", "middle")
                .attr("font-size",  "50px")
                .attr("alignment-baseline", "central")
                .text((node) => { return node.caption; })
    }
}
