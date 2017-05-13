import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer} from '@angular/platform-browser';

@Component({
    selector: 'export',
    templateUrl: './export.component.html',
    styleUrls: ['./export.component.css']
})

export class ExportComponent { 
    public exportData: string = "";
    public url: any;
    public download: Number = 0;

    @Input() data: any;
    @Input()
        set type(type: string){
            this[type]();
        }
    @Output() showExport = new EventEmitter<boolean>();

    constructor(private sanitizer: DomSanitizer) {}

    nodesCSV() {
        this.download = 1;
        this.exportData = this.parseCSV(this.data);
        let blob = new Blob([this.exportData],{type: 'text/csv;charset=utf-8;'});
        this.url = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
    }

    relationshipsCSV() {
        this.download = 1;
        
        let rel = {};
        for(let g in this.data){
            for(let r in this.data[g]){
                rel[r] = this.data[g][r];
            }
        }

        this.exportData = this.parseCSV(rel);
        let blob = new Blob([this.exportData],{type: 'text/csv;charset=utf-8;'});
        this.url = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));      
    }

    parseCSV(data){
        let result = "";
        let head, line;

        Object.keys(data).forEach((key) => {
            if(!result){
                head = Object.keys(data[key]).sort();
                result += head.toString();
                result += "\n";
            }

            line = head.map((prop) => {
                return data[key][prop] === "" ? "null" : data[key][prop];
            });
            result += line;
            result += "\n";
        });

        return result;
    }

    cypher(){
        let rel = this.data.relationships;
        let nodes = this.data.nodes;
        let lines = [];

        for(let key in nodes){
            lines.push("(`" + key + "`:`" + (nodes[key].caption || "Node") + "`)"); //(nodes[key].properties.text ? "` {`" + nodes[key].properties.text + "`})")
        }
        for(let g in rel){
            for(let key in rel[g]){
                lines.push("(`" + rel[g][key].startNode + "`)-[:`" + (rel[g][key].type || "RELATED_TO") + "`]->(`" + rel[g][key].endNode + "`)");
            }
        }

        this.download = 2;
        this.exportData = "CREATE \n  " + lines.join(", ");
        this.url = "http://console.neo4j.org?init="
            + encodeURIComponent(this.exportData)
            + "&query="
          + encodeURIComponent("start n=node(*) return n");
    }

    markup(){
        let rel = this.data.relationships;
        let nodes = this.data.nodes;
        let markup = '<textarea>' + '<ul class="graph-diagram-markup">\n';

        for(let key in nodes){
            let props = '<dl class="properties">\n';
            for(let line of nodes[key].properties.split("\n")){
                let p = line.split(":");
                if(p.length == 2){
                    props += '<dt>' + p[0] + '</dt>' + 
                        '<dd>' + p[1] + '</dd>\n';
                }
            }
            props += '</dl>\n';
            markup += '<li class="node" ' +
                'data-node-id="' + key +
                '" data-x="' + nodes[key].x +
                '" data-y="' + nodes[key].y +
                '" isrect="' + nodes[key].isRectangle +
                '" style="background-color: ' + nodes[key].fill +
                '; color: ' + nodes[key].color + 
                '">' + (nodes[key].caption ? '\n    <span class="caption">' + nodes[key].caption + "</span>\n":"") +
                props +
                "</li>\n";
        }
        for(let g in rel){
            for(let key in rel[g]){
                let props = '<dl class="properties">\n';
                for(let line of rel[g][key].properties.split("\n")){
                    let p = line.split(":");
                    if(p.length == 2){
                        props += '<dt>' + p[0] + '</dt>' + 
                            '<dd>' + p[1] + '</dd>\n';
                    }
                }
                props += '</dl>\n';
                markup += '<li class="relationship" ' +
                    'data-from="' + rel[g][key].startNode +
                    '" data-to="' + rel[g][key].endNode +
                    '">' + (rel[g][key].type ? '\n    <span class="type">' + rel[g][key].type + "</span>\n":"") +
                    props +
                    "</li>\n";
            }
        }
        markup += '</ul></textarea>'

        this.exportData = markup;
    }

}
