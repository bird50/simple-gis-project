import { area, buffer, distance, booleanPointInPolygon, point, polygon, type Units } from "@turf/turf";
export {point,polygon};
export const calculateArea=(feature:Parameters<typeof area>[0])=>area(feature);
export const createBuffer=(feature:Parameters<typeof buffer>[0],radius:number,units:Units="kilometers")=>buffer(feature,radius,{units});
export const calculateDistance=(a:[number,number],b:[number,number],units:Units="kilometers")=>distance(point(a),point(b),{units});
export const isPointInPolygon=(p:[number,number],poly:Parameters<typeof booleanPointInPolygon>[1])=>booleanPointInPolygon(point(p),poly);
