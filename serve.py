#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
from datetime import datetime
from flask import Flask, render_template, jsonify, redirect, url_for, request, send_from_directory
from werkzeug import secure_filename
import shapefile
from jinja2 import Environment, FileSystemLoader
import json

app = Flask(__name__)
app.config.from_object(__name__)
app.config['UPLOAD_FOLDER'] = '/Users/fidel/Documents/GitHub/parallel_coordinates_maps/uploads/'

ALLOWED_EXTENSIONS = ['prj', 'shp', 'dbf', 'shx']

env = Environment(loader=FileSystemLoader('templates'))


def load_agebs():
    agebs = {}
        
    with open('static/bayesianPreEnch.json') as geo:
        g = json.loads(geo.read())
        for f in g['features']:
            k = (f['properties']['FrecCateg'], f['properties']['PrecCateg'])
            if k in agebs:
                agebs[k].append(f['properties']['AGEB_ID'])
            else:
                agebs[k] = [f['properties']['AGEB_ID'], ]

    return agebs



agebs = load_agebs()


@app.route('/table/')
def table():
    template = env.get_template('table2.html')
    return template.render()


@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



@app.route('/table/upload', methods=['POST'])
def upload():
    uploaded_files = request.files.getlist("file[]")
    filenames = []
    elShp = ""
    for f in uploaded_files:
        if f and allowed_file(f.filename):
            filename = secure_filename(f.filename)
            f.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            if f.filename.endswith(".shp"):
                elShp = f.filename
            filenames.append(filename)
    print os.path.join(app.config['UPLOAD_FOLDER'], elShp)      
    reader = shapefile.Reader(os.path.join(app.config['UPLOAD_FOLDER'], elShp))
    fields = reader.fields[1:]
    field_names = [field[0] for field in fields]
    buff = []
    for sr in reader.shapeRecords():
        atr = dict(zip(field_names, sr.record))
        geom = sr.shape.__geo_interface__
        buff.append(dict(type="Feature", \
         geometry=geom, properties=atr)) 
    
    # write the GeoJSON file
    from json import dumps
    geojson = open("test5.json", "w")
    geojson.write(dumps({"type": "FeatureCollection", "features": buff}, indent=0))
    geojson.close()        
    # Load an html page with a link to each uploaded file
    return ""

# This route is expecting a parameter containing the name
# of a file. Then it will locate that file on the upload
# directory and show it on the browser, so if the user uploads
# an image, that image is going to be show after the upload


if __name__ == '__main__':
    app.run(
        host="0.0.0.0",
        port=5004,
        debug=True
    )


