
Testcase demonstrating a possible vt compositing bug.

First lets look at a working situation. The below usage demonstrates how a buffer of 256 on the "dest" vector tile in compositing leads to a correct looking buffered result for the clipped polygon that is equally buffered out on all sides.

So, this command produces a `parent_clipped` polygon in the output geojson that looks right (slightly buffered, equally on all sides):

```
node overzoom.js --z 6 --x 11 --y 23 --buffer 256 | geojsonio
```


However if we provide a value larger than 256 I would expect the `parent_clipped` polygon to also be buffered out larger on all sides equally. Instead what happens is that the `parent_clipped` polygon is buffered out more than `256` only on two sides - particularly the side facing away from the nearest corner of the parent tile.

In this testcase the data inside the parent tile has been buffer itself such that the data extends well outside the tile extent. If this were not the case then I would expect the `parent_clipped` polygon to only be buffered out in the direction of the interior of the parent. But because this is not the case - the parent data is buffered out, this feels buggy. I don't see how the edge of the parent should limit the resulting size of the `parent_clipped` polygon, even though it apparently does.

So, let's see the problem. If we pass a buffer of `512` and view the result:

```
node overzoom.js --z 6 --x 11 --y 23 --buffer 512 | geojsonio
```

The `left` and `top` sides are buffered at `512` while the `right` and `bottom` sides are unchanged (still buffered at `256`).

We can see the same problem, but with sides flipped if we try visualizing an overzoomed (aka "child") tile in the upper left of the parent tile:


```
node overzoom.js --z 6 --x 10 --y 22 --buffer 512 | geojsonio
```


Note: http://www.maptiler.org/google-maps-coordinates-tile-bounds-projection/ is a good reference for trying different tiles