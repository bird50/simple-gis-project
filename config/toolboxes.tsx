"use client";
import {defineToolboxes} from "@/lib/webmap/contracts";
import {DataFilesTool} from "@/components/map/toolboxes/DataFilesTool";
import {PhotoTool} from "@/components/map/toolboxes/PhotoTool";
import {DrawTool} from "@/components/map/toolboxes/DrawTool";
import {NavigationTool} from "@/components/map/toolboxes/NavigationTool";
import type {WorkspaceToolServices} from "@/components/map/toolboxes/workspace";

export const toolboxRegistry=defineToolboxes<WorkspaceToolServices>([
  {id:"thaiwater.data-files",title:"Simple Data Files",version:"1.0.0",apiVersion:"1.0",accessLevel:"MEMBER",requires:["layers.control"],Panel:({services})=><DataFilesTool {...services}/>},
  {id:"thaiwater.photo",title:"Photo",version:"1.0.0",apiVersion:"1.0",accessLevel:"MEMBER",requires:["layers.control"],Panel:({services})=><PhotoTool {...services}/>},
  {id:"thaiwater.draw",title:"Draw",version:"1.0.0",apiVersion:"1.0",accessLevel:"MEMBER",requires:["layers.control"],Panel:({services})=><DrawTool {...services}/>},
  {id:"webmap.navigation",title:"มุมมองแผนที่",version:"1.0.0",apiVersion:"1.0",accessLevel:"PUBLIC",requires:["map.navigate","layers.control"],Panel:NavigationTool},
]);
