import {proxyToolbox} from "@/lib/toolbox/service";
export const runtime="nodejs";
export function POST(request:Request){return proxyToolbox(request,"/data-file-shares",true);}
