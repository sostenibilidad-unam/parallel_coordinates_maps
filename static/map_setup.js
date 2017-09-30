function paint(x,y){
    console.log(x, y);
     vectorSource.clear();
     //estosFeatures = todos.filter(function (feature) {return ageb_ids.indexOf(feature.get('AGEB_ID')) >= 0;});
    estosFeatures = todos.filter(function (feature) {
	return (feature.get('FrecCateg') == x && feature.get('PrecCateg') == y);});
    vectorSource.addFeatures(estosFeatures);
    ageb_ids = [];
    
    estosFeatures.forEach(function (feature) {
    	ageb_ids.push(feature.get('AGEB_ID')); 
    });
   
    foreground.style("display", function(d) {return ageb_ids.indexOf(d['ageb_id']) >= 0 ? null : "none";});
}
var displayFeatureInfo = function (pixel) {

	var feature = map.forEachFeatureAtPixel(pixel, function (feature) {
		    return feature;
	});

	if (feature) {
		
		foreground.style("display", function(d) {return feature.get('AGEB_ID') == d['ageb_id'] ? null : "none";});
		foreground.style("stroke-width", "4px");
	}else{
		foreground.style("stroke-width", "0.3px");
		foreground.style("display", function(d) {return ageb_ids.indexOf(d['ageb_id']) >= 0 ? null : "none";});
		vectorSource.clear();
	    vectorSource.addFeatures(estosFeatures);
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

var size = 0;
var styleCache={}
var style = function(feature, resolution){
    var context = {
		feature: feature,
		variables: {}
    };
    var value = ""
    var size = 0;
    var style = [ new ol.style.Style({
	    	stroke: new ol.style.Stroke({
		    		color: 'rgba(100,100,100,1.0)', 
					lineDash: null,
					lineCap: 'butt',
					lineJoin: 'miter',
					width: 0}),
			fill: new ol.style.Fill({color: 'rgba(100,100,100,0.5)'})
	})];
    if ("" !== null) {
	var labelText = String("");
    } else {
	var labelText = ""
    }
    var key = value + "_" + labelText

    if (!styleCache[key]){
	var text = new ol.style.Text({
	      font: '14.3px \'Ubuntu\', sans-serif',
	      text: labelText,
	      textBaseline: "center",
	      textAlign: "left",
	      offsetX: 5,
	      offsetY: 3,
	      fill: new ol.style.Fill({
	        color: 'rgba(0, 0, 0, 255)'
	      }),
	    });
	styleCache[key] = new ol.style.Style({"text": text})
    }
    var allStyles = [styleCache[key]];
    allStyles.push.apply(allStyles, style);
    return allStyles;
};

var map

var layer = new ol.layer.Vector();
jsonSource_data_layer = new ol.source.Vector();
jsonSource_data_layer.addFeatures(get_features("/static/bayesianPreEnch.json"));
var todos = jsonSource_data_layer.getFeatures();
layer = new ol.layer.Vector({
    source: jsonSource_data_layer,
    style: style,
	opacity: 0.85
});

var style2 = new ol.style.Style({
	  fill: new ol.style.Fill({color: 'rgba(70,130,180,0.7)'}),
	  stroke: new ol.style.Stroke({color: '#319FD3',width: 1}),
	  text: new ol.style.Text({
		  	font: '12px Calibri,sans-serif',
		  	fill: new ol.style.Fill({color: 'rgba(250,163,1,1)'}),
	        stroke: new ol.style.Stroke({
	        		color: 'rgba(100,100,100,1)',
	        		width: 3
	        })
	  })
});
       
var vectorSource = new ol.source.Vector({projection: 'EPSG:4326'});
var miVector = new ol.layer.Vector({
    	source: vectorSource,
    	style: style2
}); 
    
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
    			zoom: 11})
});

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


d3.csv("/static/p_agebs.csv", function(error, cars) {

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
// Handles a brush event, toggling the display of foreground lines.
function brush() {

	vectorSource.clear();
	ageb_ids = [];
	var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }), extents = actives.map(function(p) { return y[p].brush.extent(); });
	foreground.style("display", function(d) {
		if (actives.every(function(p, i) {return extents[i][0] <= d[p] && d[p] <= extents[i][1];})){
			ageb_ids.push(d["ageb_id"]);
			return null;	  
		  
		}else{
			return "none";
		}
	});
	
	estosFeatures = todos.filter(function (feature) {return ageb_ids.indexOf(feature.get('AGEB_ID')) >= 0;});
	vectorSource.addFeatures(estosFeatures);
}
var highlightStyleCache = {};
var highlight;

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





