/**
 * Fixed-window, in-memory limits for abuse-prone endpoints. Counts are per server process: with several
 * instances, also limit at the reverse proxy (see README). Keys are bounded so a flood of new keys cannot grow memory.
 */
export function createRateLimiter({limit,windowMs,maxKeys=10_000}:{limit:number;windowMs:number;maxKeys?:number}){
  const buckets=new Map<string,{count:number;resetAt:number}>();
  return {
    take(key:string,now=Date.now()){
      let bucket=buckets.get(key);
      if(!bucket||bucket.resetAt<=now){
        if(!bucket&&buckets.size>=maxKeys){
          for(const [stale,value] of buckets)if(value.resetAt<=now)buckets.delete(stale);
          if(buckets.size>=maxKeys)buckets.delete(buckets.keys().next().value!);
        }
        bucket={count:0,resetAt:now+windowMs};buckets.set(key,bucket);
      }
      bucket.count++;
      return {ok:bucket.count<=limit,retryAfter:Math.max(1,Math.ceil((bucket.resetAt-now)/1000))};
    },
  };
}
/** First X-Forwarded-For hop; only trustworthy behind a reverse proxy that overwrites the header. */
export function clientAddress(request:Request){
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||request.headers.get("x-real-ip")?.trim()||"unknown";
}
export function tooManyRequests(retryAfter:number){
  return Response.json({error:"มีคำขอมากเกินไป กรุณาลองใหม่ภายหลัง"},{status:429,headers:{"Retry-After":String(retryAfter)}});
}

const MINUTE=60_000;
export const loginByAddress=createRateLimiter({limit:20,windowMs:15*MINUTE});
export const loginByIdentifier=createRateLimiter({limit:10,windowMs:15*MINUTE});
export const registrationByAddress=createRateLimiter({limit:5,windowMs:60*MINUTE});
export const publicationByAddress=createRateLimiter({limit:20,windowMs:60*MINUTE});
