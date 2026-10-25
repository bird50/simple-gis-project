import {z} from "zod";
/** west,south,east,north in WGS84; west<east and south<north (no antimeridian crossing for this dataset). */
export const stationBbox=z.string().max(160).transform((value,ctx)=>{const parts=value.split(","),[west,south,east,north]=parts.map(Number);if(parts.length!==4||parts.some(part=>!part.trim())||![west,south,east,north].every(Number.isFinite)||Math.abs(west)>180||Math.abs(east)>180||Math.abs(south)>90||Math.abs(north)>90||west>=east||south>=north){ctx.addIssue({code:"custom",message:"Invalid bbox"});return z.NEVER;}return [west,south,east,north] as const;});
