import { NextRequest, NextResponse } from "next/server";

// Public routes that do not require an active session
const PUBLIC_PATHS = [
  "/login",
  "/invite",
  "/manifest.json",
  "/offline.html",
  "/favicon.ico",
  "/icons",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/invite",
  "/api/auth/reset-password",
];

const TECH_ROLES = ["super-admin", "team-member", "tech-support"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Allow static Next.js assets, public images, and manifests unconditionally
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/icons/") ||
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    return NextResponse.next();
  }

  // 2. Read session cookies
  const userId = request.cookies.get("inventory_user_id")?.value;
  let userRole = request.cookies.get("inventory_user_role")?.value;
  let userStatus = request.cookies.get("inventory_user_status")?.value;

  // 3. Unauthenticated requests
  if (!userId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", `${pathname}${search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. Resolve role & status from Supabase REST if companion cookies are absent
  let needsCookieSync = false;
  if ((!userRole || !userStatus) && process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)) {
    try {
      const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
      const supabaseRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/department_users?id=eq.${encodeURIComponent(userId)}&select=id,role,status`,
        {
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      if (supabaseRes.ok) {
        const rows = await supabaseRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          userRole = rows[0].role;
          userStatus = rows[0].status;
          needsCookieSync = true;
        }
      }
    } catch (e) {
      console.warn("[Middleware] Failed to query user role via REST fallback:", e);
    }
  }

  // 5. Inactive accounts are blocked
  if (userStatus === "inactive") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Account inactive: Please contact IT administrator" },
        { status: 403 }
      );
    }
    const response = NextResponse.redirect(new URL("/login?error=account_inactive", request.url));
    response.cookies.delete("inventory_user_id");
    response.cookies.delete("inventory_user_role");
    response.cookies.delete("inventory_user_status");
    return response;
  }

  // 6. Enforce password change for pending users
  if (userStatus === "pending") {
    if (pathname !== "/change-password" && !pathname.startsWith("/api/auth/")) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Password change required on initial login" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/change-password", request.url));
    }
  }

  const isTechUser = userRole ? TECH_ROLES.includes(userRole) : false;
  const isSuperAdmin = userRole === "super-admin";

  // 7. Tech Command Center Route Guarding (/tech/*, /api/tech/*)
  // Non-tech users (staff/viewers) are strictly forbidden
  const isTechRoute =
    pathname === "/tech" ||
    pathname.startsWith("/tech/") ||
    pathname.startsWith("/api/tech/");

  if (isTechRoute && !isTechUser) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Forbidden: Tech support privileges required" },
        { status: 403 }
      );
    }
    // Acceptance criteria: Staff attempting to access /tech/* are redirected to /staff with 403 notice
    const staffRedirect = new URL("/staff?forbidden=true", request.url);
    const redirectResponse = NextResponse.redirect(staffRedirect);
    redirectResponse.headers.set("X-Auth-Forbidden", "tech-only");
    return redirectResponse;
  }

  // 8. Super-Admin Only Routes (/access/*, /api/access/*)
  const isAccessRoute =
    pathname === "/access" ||
    pathname.startsWith("/access/") ||
    pathname.startsWith("/api/access/");

  if (isAccessRoute && !isSuperAdmin) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Forbidden: Super Admin privileges required" },
        { status: 403 }
      );
    }
    const fallbackUrl = isTechUser ? "/tech" : "/staff";
    return NextResponse.redirect(new URL(fallbackUrl, request.url));
  }

  // 9. Root route redirect based on verified portal privileges
  if (pathname === "/") {
    const target = isTechUser ? "/tech" : "/staff";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // 10. Pass request through, persisting companion cookies if newly resolved
  const response = NextResponse.next();
  if (needsCookieSync && userRole && userStatus) {
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    };
    response.cookies.set("inventory_user_role", userRole, cookieOptions);
    response.cookies.set("inventory_user_status", userStatus, cookieOptions);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
