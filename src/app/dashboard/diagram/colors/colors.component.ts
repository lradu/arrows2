import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'colors',
  templateUrl: './colors.component.html',
  styleUrls: ['./colors.component.css']
})
export class ColorsComponent {
	public colors = [
		["Pink", "LightPink", "HotPink", "DeepPink", "PaleVioletRed", "MediumVioletRed"],
		["Lavender", "Thistle", "Plum", "Orchid", "Violet", "Fuchsia", "Magenta", "MediumOrchid", "DarkOrchid", "DarkViolet", "BlueViolet", "DarkMagenta", "Purple", "MediumPurple", "MediumSlateBlue", "SlateBlue", "DarkSlateBlue", "RebeccaPurple", "Indigo"],
		["LightSalmon", "Salmon", "DarkSalmon", "LightCoral", "IndianRed", "Crimson", "Red", "FireBrick", "DarkRed"],
		["Orange", "DarkOrange", "Coral", "Tomato", "OrangeRed"],
		["Gold", "Yellow", "LightYellow", "LemonChiffon", "LightGoldenRodYellow", "PapayaWhip", "Moccasin", "PeachPuff", "PaleGoldenRod", "Khaki", "DarkKhaki"],
		["GreenYellow", "Chartreuse", "LawnGreen", "Lime", "LimeGreen", "PaleGreen", "LightGreen", "MediumSpringGreen", "SpringGreen", "MediumSeaGreen", "SeaGreen", "ForestGreen", "Green", "DarkGreen", "YellowGreen", "OliveDrab", "DarkOliveGreen", "MediumAquaMarine", "DarkSeaGreen", "LightSeaGreen", "DarkCyan", "Teal"],
		["Aqua", "Cyan", "LightCyan", "PaleTurquoise", "Aquamarine", "Turquoise", "MediumTurquoise", "DarkTurquoise"],
		["CadetBlue", "SteelBlue", "LightSteelBlue", "LightBlue", "PowderBlue", "LightSkyBlue", "SkyBlue", "CornflowerBlue", "DeepSkyBlue", "DodgerBlue", "RoyalBlue", "Blue", "MediumBlue", "DarkBlue", "Navy", "MidnightBlue"],
		["Cornsilk", "BlanchedAlmond", "Bisque", "NavajoWhite", "Wheat", "BurlyWood", "Tan", "RosyBrown", "SandyBrown", "GoldenRod", "DarkGoldenRod", "Peru", "Chocolate", "Olive", "SaddleBrown", "Sienna", "Brown", "Maroon"],
		["White", "Snow", "HoneyDew", "MintCream", "Azure", "AliceBlue", "GhostWhite", "WhiteSmoke", "SeaShell", "Beige", "OldLace", "FloralWhite", "Ivory", "AntiqueWhite", "Linen", "LavenderBlush", "MistyRose"],
		["Gainsboro", "LightGray", "Silver", "DarkGray", "DimGray", "Gray", "LightSlateGray", "SlateGray", "DarkSlateGray", "Black"]
	];
 
  @Output() changeColor = new EventEmitter<string>();

  constructor() {}

  getColor(color){
  	this.changeColor.emit(color);
  }
}
