import {createBrowserStorage} from "@thaiwater/toolbox-sdk/storage";
import {createPublicClient} from "@thaiwater/toolbox-sdk";
/** Explicit legacy names preserve existing browser records; new apps use SDK namespaces. */
export const toolboxRuntime={appId:"thaiwater",storage:createBrowserStorage("thaiwater",{photos:"thaiwater-my-photos",drawings:"thaiwater-my-drawing",files:"thaiwater-data-files"}),client:createPublicClient()};
