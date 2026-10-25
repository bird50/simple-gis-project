"use client";
import {dataFilesTool,definePlugins,drawTool,navigationTool,photoTool} from "@thaiwater/toolbox-sdk/react";

/**
 * Tool API 2.0 plugins, in Toolbox Panel order. Each tool registers its own layers (default IDs and the
 * IndexedDB names in lib/toolbox/runtime.ts are unchanged, so saved browser data keeps working).
 * IDs keep the 1.0 names. Must stay a module-level constant: the provider expects a stable array.
 */
export const toolPlugins=definePlugins([
  dataFilesTool({id:"thaiwater.data-files"}),
  photoTool({id:"thaiwater.photo"}),
  drawTool({id:"thaiwater.draw"}),
  navigationTool({id:"webmap.navigation"}),
]);
