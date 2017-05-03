
Testcase visualizing vt compositing and overzooming in node-mapnik/mapnik-vt.

## Setup

Run:

```
npm install
npm install -g geojsonio-cli
```

## Details

This testcase generally:

  - Creates source data on the fly that is "padded" (extends outside the extent of the tile being composited)
  - Adds polygons representing the padded source data ("parent") and the exact tile extent ("child")
  - Composites the tile to a new overzoomed tile
  - Outputs the result (combined with the original geojson) to a final geojson that can be visualized in geojson.io

The idea is to make changes to the script, then re-run the result to quickly view the impact.

## Usage

Sample usage that renders a tile with a 256 px buffer (double the tile extent):

```
node overzoom.js --z 6 --x 11 --y 23 --buffer 256 | geojsonio
```

Note: http://www.maptiler.org/google-maps-coordinates-tile-bounds-projection/ is a good reference for trying different tiles