var layer_url = document.currentScript.getAttribute('layer_url');
var data_url = document.currentScript.getAttribute('data_url');




function get_features(url) {
    var data_layer = {};

    $.ajax({
	url: url,
	async: false,
	dataType: 'json',
	success: function(data) {
	    data_layer = data;
	}
    });
    var format_data_layer = new ol.format.GeoJSON();
    var features = format_data_layer.readFeatures(data_layer,
						  {dataProjection: 'EPSG:4326',
						   featureProjection: 'EPSG:3857'});

    return features;
}

var map
var vectorSource = new ol.source.Vector({projection: 'EPSG:4326'});
var miVector = new ol.layer.Vector({
    	source: vectorSource
}); 
var layer = new ol.layer.Vector();
jsonSource_data_layer = new ol.source.Vector();
jsonSource_data_layer.addFeatures(get_features(layer_url));
var todos = jsonSource_data_layer.getFeatures();
var geometry_type = todos[0].getGeometry().getType();
layer = new ol.layer.Vector({
    source: jsonSource_data_layer,
	opacity: 0.85
});
if ((geometry_type == "Polygon") || (geometry_type == "MultiPolygon")){
	layer.setStyle(polygon_style);
	miVector.setStyle(polygon_style2);
}
	
if (geometry_type == "Point" || geometry_type == "MultiPoint"){
	layer.setStyle(point_style);
	miVector.setStyle(point_style2);
}
	
       


    
var stamenLayer = new ol.layer.Tile({
	source: new ol.source.Stamen({layer: 'terrain'})
});
        
var ageb_ids = [];  
var estosFeatures = [];

map = new ol.Map({
    projection:"EPSG:4326",
    layers: [stamenLayer, layer, miVector],
    target: 'map',
    view: new ol.View({
    			center: ol.proj.fromLonLat([-99.15,19.36]),
    			zoom: 10})
});

var extent = layer.getSource().getExtent();
map.getView().fit(extent, map.getSize());


var margin = {top: 30, right: 10, bottom: 10, left: 10},
width = 1900 - margin.left - margin.right,
height = 200 - margin.top - margin.bottom;

var x = d3.scale.ordinal().rangePoints([0, width], 1),
y = {};

var line = d3.svg.line(),
axis = d3.svg.axis().orient("left"),
background,
foreground;

var svg = d3.select("#graph").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


d3.csv(data_url, function(error, cars) {

// Extract the list of dimensions and create a scale for each.
x.domain(dimensions = d3.keys(cars[0]).filter(function(d) {
return d != "name" && (y[d] = d3.scale.linear()
    .domain(d3.extent(cars, function(p) { return +p[d]; }))
    .range([height, 0]));
}));
//console.log(cars);

// Add grey background lines for context.
background = svg.append("g")
  .attr("class", "background")
.selectAll("path")
  .data(cars)
.enter().append("path")
  .attr("d", path);

// Add blue foreground lines for focus.
foreground = svg.append("g")
  .attr("class", "foreground")
.selectAll("path")
  .data(cars)
.enter().append("path")
  .attr("d", path);



// Add a group element for each dimension.
var g = svg.selectAll(".dimension")
  .data(dimensions)
.enter().append("g")
  .attr("class", "dimension")
  .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

// Add an axis and title.
g.append("g")
  .attr("class", "axis")
  .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
.append("text")
  .style("text-anchor", "middle")
  .attr("y", -9)
  .text(function(d) { return d; });

// Add and store a brush for each axis.
g.append("g")
  .attr("class", "brush")
  .each(function(d) { d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush)); })
.selectAll("rect")
  .attr("x", -18)
  .attr("width", 16);
});

// Returns the path for a given data point.
function path(d) {
return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
}
var ageb_ids = [];
var stats_div = document.getElementById('statistics');
// Handles a brush event, toggling the display of foreground lines.
function brush() {

	vectorSource.clear();
	ageb_ids = [];
	var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }), extents = actives.map(function(p) { return y[p].brush.extent(); });
	foreground.style("display", function(d) {
		if (actives.every(function(p, i) {return extents[i][0] <= d[p] && d[p] <= extents[i][1];})){
			ageb_ids.push(d["id"]);
			return null;	  
		  
		}else{
			return "none";
		}
	});
	
	stats_div.innerHTML = "selected: " + ageb_ids.length;
	estosFeatures = todos.filter(function (feature) {return ageb_ids.indexOf(feature.get('id')) >= 0;});
	vectorSource.addFeatures(estosFeatures);
}
var highlightStyleCache = {};
var highlight;

var displayFeatureInfo = function (pixel) {

	var feature = map.forEachFeatureAtPixel(pixel, function (feature) {
		    return feature;
	});

	if (feature) {
		pcz.highlight(pcz.data().filter(function(d) {
		    return d.id === feature.get('id');
		    }));
		foreground.style("display", function(d) {return feature.get('id') == d['id'] ? null : "none";});
		foreground.style("stroke-width", "4px");
		stats_div.innerHTML = "selected: 1";
	}else{
		foreground.style("stroke-width", "1px");
		foreground.style("display", function(d) {return ageb_ids.indexOf(d['id']) >= 0 ? null : "none";});
		brush();
		vectorSource.clear();
	    vectorSource.addFeatures(estosFeatures);
	    pcz.unhighlight();
	}

	if (feature !== highlight) {
		vectorSource.clear();
		//if (highlight) {
			//featureOverlay.getSource().removeFeature(highlight);
		//	vectorSource.removeFeature(highlight);
		//}
	    	if (feature) {
			vectorSource.addFeature(feature);
		}
		highlight = feature;
	}

};
map.on('pointermove', function(evt) {
    if (evt.dragging) {
      return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    displayFeatureInfo(pixel);
  });
map.on('click', function(evt) {
  displayFeatureInfo(evt.pixel);
});

function color(value, min, max) {

	interval = (max - min) / 5.0;
	if (value < min + interval){
		color = 'rgba(215,25,28,1.0)';
	}
	if (value > min + interval && value < min + (2*interval)){
		color = 'rgba(253,174,97,1.0)';
	}
	if (value > min + (2*interval) && value < min + (3*interval)){
		color = 'rgba(255,255,192,1.0)';
	}
	if (value > min + (3*interval) && value < min + (4*interval)){
		color = 'rgba(166,217,106,1.0)';
	}
	if (value > min + (4*interval)){
		color = 'rgba(26,150,65,1.0)';
	}
	
}

var pcz;
var blue_to_brown = d3.scale.linear()
.domain([0, 100])
.range(["steelblue", "brown"])
.interpolate(d3.interpolateLab);

var color = function(d) { return blue_to_brown(d['Edad_infra']); };


  
//color scale for zscores
var zcolorscale = d3.scale.linear()
.domain([0,1])
.range(["red", "yellow"])
.interpolate(d3.interpolateLab);

//load csv file and create the chart

d3.csv(data_url, function(data) {
	
	pcz = d3.parcoords()("#graph2")
	 .data(data)
	 .hideAxis(["id"])
	 .composite("darken")
	 .render()
	 .alpha(0.35)
	 .brushMode("1D-axes")  // enable brushing
	 .interactive()  // command line mode
	
	//change_color("Edad_infra");
	
	// click label to activate coloring
	pcz.svg.selectAll(".dimension")
	 .on("click", change_color)
	 .selectAll(".label")
	 .style("font-size", "14px");
	pcz.on("brush", function(d) {
		vectorSource.clear();
		ageb_ids = [];
		d.forEach(function(entry) {
			ageb_ids.push(entry["id"]);
		});
		stats_div.innerHTML = "selected: " + ageb_ids.length;
		estosFeatures = todos.filter(function (feature) {return ageb_ids.indexOf(feature.get('id')) >= 0;});
		vectorSource.addFeatures(estosFeatures);
	});
});
	
//update color
function change_color(dimension) {
	pcz.svg.selectAll(".dimension")
	 .style("font-weight", "normal")
	 .filter(function(d) { return d == dimension; })
	 .style("font-weight", "bold")
	
	pcz.color(zcolor(pcz.data(),dimension)).render()
}
	
//return color function based on plot and dimension
function zcolor(col, dimension) {
	var z = zscore(_(col).pluck(dimension).map(parseFloat))
	return function(d) { return zcolorscale(z(d[dimension])) }
};
	
//color by zscore
function zscore(col) {
	var n = col.length,
	   mean = _(col).mean(),
	   sigma = _(col).stdDeviation();
	return function(d) {
	 return (d-mean)/sigma;
	};
};




