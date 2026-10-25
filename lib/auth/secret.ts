const DEVELOPMENT_SECRET="development-only-secret-change-me-now";
const PLACEHOLDERS=new Set([DEVELOPMENT_SECRET,"replace-with-at-least-32-random-characters"]);

/**
 * Session signing key. In production a missing, short or example AUTH_SECRET is refused instead of
 * silently falling back to a value anyone can read in the repository (which would let them forge sessions).
 */
export function authKey(env:{AUTH_SECRET?:string;NODE_ENV?:string}=process.env){
  const secret=env.AUTH_SECRET;
  if(env.NODE_ENV==="production"&&(!secret||secret.length<32||PLACEHOLDERS.has(secret)))throw new Error("AUTH_SECRET must be a random value of at least 32 characters");
  return new TextEncoder().encode(secret||DEVELOPMENT_SECRET);
}
