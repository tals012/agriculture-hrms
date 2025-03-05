import { NextResponse } from "next/server";
import * as jose from "jose";

export async function middleware(request) {
  // Get the token from the cookies
  const token = request.cookies.get("token")?.value;

  // Check if the user is trying to access the login page
  const isLoginPage = request.nextUrl.pathname === "/login";

  // If user is on login page and has token, redirect to appropriate page based on role
  if (isLoginPage && token) {
    const role = request.cookies.get("role")?.value;
    let redirectUrl = "/admin/clients"; // default redirect

    if (role === "GROUP_LEADER") {
      redirectUrl = "/group-leader/my-group";
    } else if (role === "FIELD_MANAGER") {
      redirectUrl = "/manager/my-fields";
    } else if (role === "WORKER") {
      redirectUrl = "/worker/attendance";
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // If user is not on login page and has no token, redirect to login
  if (!isLoginPage && !token) {
    const originalPath = request.nextUrl.pathname + request.nextUrl.search;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", originalPath);
    return NextResponse.redirect(loginUrl);
  }

  // If user has token and is not on login page, verify the token
  if (!isLoginPage && token) {
    try {
      const jwtConfig = {
        secret: new TextEncoder().encode(process.env.JWT_SECRET),
      };
      
      await jose.jwtVerify(token, jwtConfig.secret);
      return NextResponse.next();
    } catch (error) {
      // If token is invalid, redirect to login
      const originalPath = request.nextUrl.pathname + request.nextUrl.search;
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", originalPath);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}; 