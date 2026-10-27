import {strict as assert} from "node:assert";
import {test} from "node:test";
import {toolPlugins} from "../config/toolboxes";
import {layerRegistry} from "../config/layers";

test("toolbox plugins keep their 1.0 IDs and declare no static layers that could clash with system layers",()=>{
 assert.deepEqual(toolPlugins.map(plugin=>plugin.id),["thaiwater.data-files","thaiwater.photo","thaiwater.draw","webmap.navigation"]);
 const toolLayers=toolPlugins.flatMap(plugin=>plugin.layers??[]);
 assert.deepEqual(toolLayers.map(layer=>layer.id),[],"tool layers are created at runtime, one per set on the map");
 assert.ok(toolLayers.every(layer=>layer.owner&&toolPlugins.some(plugin=>plugin.id===layer.owner?.toolId)));
 const system=new Set(layerRegistry.map(layer=>layer.id));
 assert.ok(toolLayers.every(layer=>!system.has(layer.id)));
});
