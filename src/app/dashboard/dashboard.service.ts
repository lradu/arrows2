import { Injectable } from '@angular/core';

@Injectable()
export class ExportData {
	svg(): void {
		let svg = document.getElementsByTagName("svg");
		if(svg){
			let rawSvg = new XMLSerializer().serializeToString(svg[0]);
			window.open( "data:image/svg+xml;base64," + btoa(rawSvg) );
		}
	}

	csv(data, name): void {
		/*
			
		*/
		let ar = "";
		if(name == "relationships") {
			let d = {};
			for(let g in data){
				for(let r in data[g]){
					d[r] = data[g][r];
				}
			}
			data = d;
		}
		getData(data)
		let csv = document.createElement('a');
		let csvContent = ar;
		let blob = new Blob([csvContent],{type: 'text/csv;charset=utf-8;'});
		let url = URL.createObjectURL(blob);
		csv.href = url;
		csv.setAttribute('download', name + '.csv');
		document.body.appendChild(csv);
		csv.click();
		csv.remove();

		function getData(data){
			let line;
			for(let a in data){
				line = "";
				if(!ar){
					for(let b in data[a]){
						if(typeof data[a][b] === 'object'){
							for(let c in data[a][b]){
								if(line != "") { line += ","; }
								line += b + "_" + c;
							}
						} else {
							if(line != "") { line += ","; }
							line += b;
						}
					}
					line += "\r\n";
					ar += line;
					line = "";
				}
				for(let b in data[a]){
					if(typeof data[a][b] === 'object'){
						for(let c in data[a][b]){
							if(line != "") { line += ","; }
							line += data[a][b][c] === "" ? "null":data[a][b][c];
						}
					} else{
						if(line != "") { line += ","; }
						line += data[a][b] === "" ? "null":data[a][b];
					}
				}
				line += "\r\n";
				ar += line;
			}
			return ar;
		}
	}

	cypher(data): void {
		/*
			
		*/
		let rel = data.relationships;
		let nodes = data.nodes;
		let lines = [];

		for(let key in nodes){
			lines.push("(`" + key + "`:`" + (nodes[key].caption || "Node") + "`)"); //(nodes[key].properties.text ? "` {`" + nodes[key].properties.text + "`})")
		}
		for(let g in rel){
			for(let key in rel[g]){
				lines.push("(`" + rel[g][key].startNode + "`)-[:`" + (rel[g][key].type || "RELATED_TO") + "`]->(`" + rel[g][key].endNode + "`)");
			}
		}
		if(lines.length != 0) {
			let style = `<style>
				textarea {
				  padding: 0;
				  resize: none;
				  height: 80%;
				  width: 100%;
				  border: none;
				  box-shadow: none;
				}
				textarea:focus {
					outline: none;
				}
				.button {
					border: 1px solid #292b2c;
					color: #292b2c;
					text-align: center;
					border-radius: 0.25rem;
					padding: 0.5rem 1rem;
					text-decoration: none;
				}
			</style>`;
			let cypher = "CREATE \n  " + lines.join(", ");
			let url = "http://console.neo4j.org?init="
				+ encodeURIComponent(cypher)
				+ "&query="
			  + encodeURIComponent("start n=node(*) return n");
			let a = '<a class="button" href="' + url + '">Open in Console</a>'
			let x = window.open();
			x.document.open();
			x.document.write(style, '<textarea>' + lines.join(", \n") + '</textarea>', a);
			x.document.close();
		}
	}

	markup(data): void {
		/*

		*/
		let rel = data.relationships;
		let nodes = data.nodes;
		let style = `<style>
			textarea {
			  padding: 0;
			  resize: none;
			  height: 100%;
			  width: 100%;
			  border: none;
			  box-shadow: none;
			}
			textarea:focus {
				outline: none;
			}
		</style>`;
		let markup = '<textarea>' + '<ul class="graph-diagram-markup">\n';

		for(let key in nodes){
			let props = '<dl class="properties">\n';
			for(let line of nodes[key].properties.text.split("\n")){
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
				'" style="background-color: ' + nodes[key].style.fill +
				'; color: ' + nodes[key].style.color + 
				'">' + (nodes[key].caption ? '\n	<span class="caption">' + nodes[key].caption + "</span>\n":"") +
				props +
				"</li>\n";
		}
		for(let g in rel){
			for(let key in rel[g]){
				let props = '<dl class="properties">\n';
				for(let line of rel[g][key].properties.text.split("\n")){
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
					'">' + (rel[g][key].type ? '\n	<span class="type">' + rel[g][key].type + "</span>\n":"") +
					props +
					"</li>\n";
			}
		}
		markup += '</ul></textarea>'
		let x = window.open();
		x.document.open();
		x.document.write(style, markup);
		x.document.close();
	}
}