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


var ageb_ids = [];
var stats_div = document.getElementById('statistics');


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
		stats_div.innerHTML = "selected: 1";
	}else{
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



var pcz;

//linear color scale 
var colorscale = d3.scale.linear()
.domain([0,1])
.range(["purple", "pink"])
.interpolate(d3.interpolateLab);
  
//load csv file and create the chart
d3.csv(data_url, function(data) {
	
	pcz = d3.parcoords()("#graph")
	 .data(data)
	 .hideAxis(["id"])
	 .composite("darken")
	 .render()
	 .alpha(0.22)
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
	pcz.color(pre_color(pcz.data(),dimension)).render()
	
	
	
	var polygon_style_p = function(feature, resolution){
	    var context = {
			feature: feature,
			variables: {}
	    };
	    var value = feature.get(dimension);
	    var slice = _(pcz.data()).pluck(dimension).map(parseFloat);
		var normalize = d3.scale.linear()
		.domain([_.min(slice),_.max(slice)])
		.range([0,1]);
	    var size = 0;
	    var style = [ new ol.style.Style({
		    	stroke: new ol.style.Stroke({
			    		color: 'rgba(100,100,100,1.0)', 
						lineDash: null,
						lineCap: 'butt',
						lineJoin: 'miter',
						width: 0}),
				fill: new ol.style.Fill({color: colorscale(normalize(value))})
	    //colorscale(normalize(value))
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

	miVector.setStyle(polygon_style_p);
	
}
	
function pre_color(col,dimension){
	var slice = _(col).pluck(dimension).map(parseFloat);
	var normalize = d3.scale.linear()
	.domain([_.min(slice),_.max(slice)])
	.range([0,1]);
	return function(d) { return colorscale(normalize(d[dimension])) }
}



