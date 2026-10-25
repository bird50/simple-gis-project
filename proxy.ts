import {AUTH_ENABLED} from "@/lib/auth/mode";
import {authKey} from "@/lib/auth/secret";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

/** Lightweight redirects only; pages and APIs re-check the user against the database. */
export async function proxy(req: NextRequest) {
  if (!AUTH_ENABLED) {
    if (req.nextUrl.pathname.startsWith("/gis")) return NextResponse.next();
    return NextResponse.redirect(new URL("/gis", req.url));
  }
  const token = req.cookies.get("water_gis_session")?.value;
  const login = new URL("/login", req.url);
  login.searchParams.set("next", req.nextUrl.pathname);

  if (!token) return NextResponse.redirect(login);

  try {
    const { payload } = await jwtVerify(token, authKey(), { algorithms: ["HS256"] });

    if (
      req.nextUrl.pathname.startsWith("/admin") &&
      payload.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/gis", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: ["/gis/:path*", "/profile/:path*", "/admin/:path*"],
};
