var size = 0;
var styleCache={}
var styleCache_points={}
var point_style = function(feature, resolution){
    var context = {
        feature: feature,
        variables: {}
    };
    var value = ""
    var labelText = "";
    var key = "";
    size = 0;
    var textAlign = "left";
    var offsetX = 8;
    var offsetY = 3;
    if ("" !== null) {
        labelText = String("");
    } else {
        labelText = ""
    }
    var style = [ new ol.style.Style({
        image: new ol.style.Circle({radius: 6.0 + size,
            stroke: new ol.style.Stroke({color: 'rgba(100,100,100,1.0)', lineDash: null, lineCap: 'butt', lineJoin: 'miter', width: 0}), fill: new ol.style.Fill({color: 'rgba(100,100,100,0.5)'})})
    })];
    key = value + "_" + labelText
    if (!styleCache_points[key]){
        var text = new ol.style.Text({
                font: '16.9px \'.SF NS Text\', sans-serif',
                text: labelText,
                textBaseline: "middle",
                textAlign: textAlign,
                offsetX: offsetX,
                offsetY: offsetY,
                fill: new ol.style.Fill({
                  color: 'rgba(0, 0, 0, 1)'
                })
            });
        styleCache_points[key] = new ol.style.Style({"text": text})
    }
    var allStyles = [styleCache_points[key]];
    allStyles.push.apply(allStyles, style);
    return allStyles;
};
var polygon_style = function(feature, resolution){
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


