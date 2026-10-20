import {test} from "node:test";
import assert from "node:assert/strict";
import {distance} from "@turf/turf";
import {shapePoints,transformPoints,type Coordinate} from "../lib/gis/drawing";

test("rectangle closes its ring and preserves both drag corners",()=>{
  const ring=shapePoints("rectangle",[101,15],[100,13]);
  assert.deepEqual(ring,[[101,15],[100,15],[100,13],[101,13],[101,15]]);
});
test("circle uses equal geodesic radii and is closed",()=>{
  const center:Coordinate=[100.5,13.5],edge:Coordinate=[100.6,13.6];
  const ring=shapePoints("circle",center,edge),radius=distance(center,edge);
  assert.equal(ring.length,65);assert.deepEqual(ring[0],ring[64]);
  for(const point of ring)assert.ok(Math.abs(distance(center,point)-radius)<1e-8);
  assert.deepEqual(shapePoints("circle",center,center),[center]);
});
test("moving preserves relative geometry; resize anchors top left without inversion",()=>{
  const points:Coordinate[]=[[10,20],[30,40],[10,20]];
  assert.deepEqual(transformPoints(points,[0,0],[5,-8],false),[[15,12],[35,32],[15,12]]);
  assert.deepEqual(transformPoints(points,[30,40],[50,60],true),[[10,20],[50,60],[10,20]]);
  const shrunk=transformPoints(points,[30,40],[-100,-100],true);
  assert.ok(shrunk[1][0]>shrunk[0][0]);assert.ok(shrunk[1][1]>shrunk[0][1]);
});
test("resizing a horizontal line remains finite",()=>{
  const points=transformPoints([[0,0],[100,0]],[100,0],[200,50],true);
  assert.ok(points.flat().every(Number.isFinite));assert.deepEqual(points,[[0,0],[200,0]]);
});
