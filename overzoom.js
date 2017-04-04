var mapnik = require('mapnik');
var mercator = new(require('@mapbox/sphericalmercator'))();
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var tilebelt = require('@mapbox/tilebelt');

mapnik.register_datasource(path.join(mapnik.settings.paths.input_plugins,'geojson.input'));

function generateGeoJSON(z,x,y,buffer_size,name) {
    // geojson representing 4 coordinates roughly at the edge of a z/y/y like: http://tile.osm.org/5/5/11.png
    // upper left overzoomed is http://tile.osm.org/6/10/22.png
    var bbox = mercator.bbox(x, y, z, false, '4326');
    var minx = bbox[0] - buffer_size;
    var miny = bbox[1] - buffer_size;
    var maxx = bbox[2] + buffer_size;
    var maxy = bbox[3] + buffer_size;
    return {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {"name": name, "marker-color": "#ff0000"},
          "geometry": {
            "type": "Point",
            "coordinates": [
              minx,
              maxy
            ]
          }
        },
        {
          "type": "Feature",
          "properties": {"name": name, "marker-color": "#ff0000"},
          "geometry": {
            "type": "Point",
            "coordinates": [
              maxx,
              maxy
            ]
          }
        },
        {
          "type": "Feature",
          "properties": {"name": name, "marker-color": "#ff0000"},
          "geometry": {
            "type": "Point",
            "coordinates": [
              minx,
              miny
            ]
          }
        },
        {
          "type": "Feature",
          "properties": {"name": name, "marker-color": "#ff0000"},
          "geometry": {
            "type": "Point",
            "coordinates": [
              maxx,
              miny
            ]
          }
        },
        {
          "type": "Feature",
          "properties": {"name": name, "fill": "red"},
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              [
                [
                  minx,
                  miny
                ],
                [
                  maxx,
                  miny
                ],
                [
                  maxx,
                  maxy
                ],
                [
                  minx,
                  maxy
                ],
                [
                  minx,
                  miny
                ]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "properties": {"name": name, "stroke": "red"},
          "geometry": {
            "type": "LineString",
            "coordinates": [
                [
                  minx,
                  miny
                ],
                [
                  maxx,
                  miny
                ],
                [
                  maxx,
                  maxy
                ],
                [
                  minx,
                  maxy
                ],
                [
                  minx,
                  miny
                ]
            ]
          }
        }
      ]
    };
}


function getParent(zxy) {
 var tile = tilebelt.getParent([zxy[1],zxy[2],zxy[0]]);
 return [tile[2],tile[0],tile[1]];
}


//var zxy = [5,5,11];
// upper left
//var child_zxy = [6,10,22];
// lower right
// http://www.maptiler.org/google-maps-coordinates-tile-bounds-projection/
function generateTileTestCase(z,x,y,dest_buffer) {

  var child_zxy = [z,x,y];
  var parent_zxy = getParent(child_zxy);
  var source_vt = new mapnik.VectorTile(parent_zxy[0],parent_zxy[1],parent_zxy[2]);

  // buffer out the data a bit outside the tile extents to ensure that if we inflate
  // the clipping buffer then we should get more data
  var data_padding = 2;
  var parent_geojson = generateGeoJSON(parent_zxy[0],parent_zxy[1],parent_zxy[2],data_padding,'parent');
  var parent_data = JSON.stringify(parent_geojson,null,1);
  source_vt.addGeoJSON(parent_data,"parent");

  var child_geojson = generateGeoJSON(child_zxy[0],child_zxy[1],child_zxy[2],0,'child');
  var child_data = JSON.stringify(child_geojson,null,1);
  source_vt.addGeoJSON(child_data,"child");

  // changing source buffer does not seem to impact the testcase, so we hardcode
  var source_buffer = 256*16;
  source_vt.bufferSize = source_buffer;
  var dest_vt = new mapnik.VectorTile(child_zxy[0],child_zxy[1],child_zxy[2]);

  // **problem** dest_buffer greater than 256 adds more to left and top than right and bottom - shouldn't it add equal amounts to all sides?
  dest_vt.bufferSize = dest_buffer;

  var max_extent = [-20037508.34,-20037508.34,20037508.34,20037508.34 ];

  var opts = {
      max_extent: max_extent
  };

  dest_vt.composite([source_vt],opts);


  var result_json = JSON.parse(dest_vt.toGeoJSON('__all__'));

  for (var i=0;i<result_json.features.length;++i) {
      if (result_json.features[i].properties['name'] == 'parent') {
          result_json.features[i].properties['name'] = 'parent_clipped'
      }
      if (result_json.features[i].properties['name'] == 'child') {
          result_json.features[i].properties['name'] = 'child_clipped'
      }
      if (result_json.features[i].properties['marker-color']) {
          result_json.features[i].properties['marker-color'] = '#00ffff'
      }
      if (result_json.features[i].properties['fill']) {
          result_json.features[i].properties['fill'] = 'teal'
      }
      if (result_json.features[i].properties['stroke']) {
          result_json.features[i].properties['stroke'] = 'lightgreen'
      }
  }

  result_json.features = result_json.features.concat(parent_geojson.features)

  console.log(JSON.stringify(result_json,null,1));

}



var argv = require('minimist')(process.argv.slice(2));
//console.dir(argv);

//generateTileTestCase(6,11,23,1,256*16);
// This generates a `parent_clipped` polygon that looks equally buffered
//generateTileTestCase(6,11,23,256);

// Problem: any buffer greater than 256 leads to a `parent_clipped` polygon that in not buffered equally on all sides. Why?
//generateTileTestCase(6,11,23,512);
generateTileTestCase(argv.z,argv.x,argv.y,argv.buffer);




