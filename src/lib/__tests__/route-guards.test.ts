import { middleware } from "../../middleware";
import { NextRequest } from "next/server";

function createMockRequest(
  path: string,
  cookies: Record<string, string> = {}
): NextRequest {
  const url = `http://localhost:3000${path}`;
  const req = new NextRequest(url);

  // Set cookies
  Object.entries(cookies).forEach(([key, val]) => {
    req.cookies.set(key, val);
  });

  return req;
}

async function runSecuritySuite() {
  console.log("=== Running RBAC Route Guard & Security Verification Suite ===\n");

  // 1. Unauthenticated Page Access
  console.log("[Test 1] Unauthenticated request to /tech...");
  const req1 = createMockRequest("/tech");
  const res1 = await middleware(req1);
  if (res1.status !== 307 && res1.status !== 302 && res1.status !== 308) {
    throw new Error(`Expected redirect (307/302), got HTTP ${res1.status}`);
  }
  const location1 = res1.headers.get("location") || "";
  if (!location1.includes("/login")) {
    throw new Error(`Expected redirect to /login, got ${location1}`);
  }
  console.log("✓ PASS: Unauthenticated page request redirected to /login.\n");

  // 2. Unauthenticated API Access
  console.log("[Test 2] Unauthenticated request to /api/tech/complaints...");
  const req2 = createMockRequest("/api/tech/complaints");
  const res2 = await middleware(req2);
  if (res2.status !== 401) {
    throw new Error(`Expected 401 Unauthorized, got HTTP ${res2.status}`);
  }
  console.log("✓ PASS: Unauthenticated API request rejected with 401.\n");

  // 3. Inactive Account Access
  console.log("[Test 3] Inactive user attempting access...");
  const req3 = createMockRequest("/tech", {
    inventory_user_id: "user-inactive",
    inventory_user_role: "team-member",
    inventory_user_status: "inactive",
  });
  const res3 = await middleware(req3);
  const location3 = res3.headers.get("location") || "";
  if (!location3.includes("account_inactive")) {
    throw new Error(`Expected redirect with account_inactive, got ${location3}`);
  }
  console.log("✓ PASS: Inactive user blocked and session invalidated.\n");

  // 4. Pending User Force Password Change
  console.log("[Test 4] Pending onboarding user accessing /tech...");
  const req4 = createMockRequest("/tech", {
    inventory_user_id: "user-pending",
    inventory_user_role: "team-member",
    inventory_user_status: "pending",
  });
  const res4 = await middleware(req4);
  const location4 = res4.headers.get("location") || "";
  if (!location4.includes("/change-password")) {
    throw new Error(`Expected redirect to /change-password, got ${location4}`);
  }
  console.log("✓ PASS: Pending user forced to /change-password.\n");

  // 5. Staff User Attempting Tech Command Center Access (/tech)
  console.log("[Test 5] Staff user attempting to access /tech/dashboard...");
  const req5 = createMockRequest("/tech/dashboard", {
    inventory_user_id: "user-staff",
    inventory_user_role: "viewer",
    inventory_user_status: "active",
  });
  const res5 = await middleware(req5);
  const location5 = res5.headers.get("location") || "";
  if (!location5.includes("/staff") || !location5.includes("forbidden=true")) {
    throw new Error(`Expected redirect to /staff?forbidden=true, got ${location5}`);
  }
  console.log("✓ PASS: Staff user redirected to /staff with 403 forbidden notice.\n");

  // 6. Staff User Attempting Tech API Access (/api/tech/*)
  console.log("[Test 6] Staff user attempting to access /api/tech/complaints...");
  const req6 = createMockRequest("/api/tech/complaints", {
    inventory_user_id: "user-staff",
    inventory_user_role: "viewer",
    inventory_user_status: "active",
  });
  const res6 = await middleware(req6);
  if (res6.status !== 403) {
    throw new Error(`Expected 403 Forbidden on API, got HTTP ${res6.status}`);
  }
  console.log("✓ PASS: Staff API request to /api/tech/* blocked with 403 Forbidden.\n");

  // 7. Staff User Accessing Staff Portal (/staff)
  console.log("[Test 7] Staff user accessing /staff...");
  const req7 = createMockRequest("/staff", {
    inventory_user_id: "user-staff",
    inventory_user_role: "viewer",
    inventory_user_status: "active",
  });
  const res7 = await middleware(req7);
  // Allowed to proceed (status 200 via NextResponse.next())
  if (res7.headers.get("location")) {
    throw new Error(`Staff user should not be redirected from /staff, got ${res7.headers.get("location")}`);
  }
  console.log("✓ PASS: Staff user permitted on /staff portal.\n");

  // 8. Tech Team Member Accessing Command Center (/tech)
  console.log("[Test 8] Tech team member accessing /tech...");
  const req8 = createMockRequest("/tech", {
    inventory_user_id: "user-tech",
    inventory_user_role: "team-member",
    inventory_user_status: "active",
  });
  const res8 = await middleware(req8);
  if (res8.headers.get("location")) {
    throw new Error(`Tech user should not be redirected from /tech, got ${res8.headers.get("location")}`);
  }
  console.log("✓ PASS: Tech team member permitted on /tech Command Center.\n");

  // 9. Tech Team Member Accessing Staff Portal (/staff) - Bidirectional Access
  console.log("[Test 9] Tech team member accessing /staff (Bidirectional Access)...");
  const req9 = createMockRequest("/staff", {
    inventory_user_id: "user-tech",
    inventory_user_role: "team-member",
    inventory_user_status: "active",
  });
  const res9 = await middleware(req9);
  if (res9.headers.get("location")) {
    throw new Error(`Tech user should have bidirectional access to /staff, got ${res9.headers.get("location")}`);
  }
  console.log("✓ PASS: Bidirectional access confirmed for tech team member on /staff.\n");

  // 10. Non-Super-Admin Accessing Access Delegation (/access)
  console.log("[Test 10] Non-super-admin accessing /access...");
  const req10 = createMockRequest("/access", {
    inventory_user_id: "user-tech",
    inventory_user_role: "team-member",
    inventory_user_status: "active",
  });
  const res10 = await middleware(req10);
  const location10 = res10.headers.get("location") || "";
  if (!location10.includes("/tech")) {
    throw new Error(`Expected redirect from /access to /tech for non-super-admin, got ${location10}`);
  }
  console.log("✓ PASS: Non-super-admin redirected away from /access.\n");

  // 11. Super Admin Accessing Access Delegation (/access)
  console.log("[Test 11] Super Admin accessing /access...");
  const req11 = createMockRequest("/access", {
    inventory_user_id: "user-super",
    inventory_user_role: "super-admin",
    inventory_user_status: "active",
  });
  const res11 = await middleware(req11);
  if (res11.headers.get("location")) {
    throw new Error(`Super admin should have direct access to /access, got ${res11.headers.get("location")}`);
  }
  console.log("✓ PASS: Super Admin permitted on /access panel.\n");

  // 12. Public Routes Pass-Through
  console.log("[Test 12] Unauthenticated access to public routes (/login, /manifest.json, /offline.html)...");
  const req12a = createMockRequest("/login");
  const res12a = await middleware(req12a);
  const req12b = createMockRequest("/manifest.json");
  const res12b = await middleware(req12b);
  const req12c = createMockRequest("/offline.html");
  const res12c = await middleware(req12c);

  if (res12a.headers.get("location") || res12b.headers.get("location") || res12c.headers.get("location")) {
    throw new Error("Public assets should not be redirected");
  }
  console.log("✓ PASS: Public routes unblocked.\n");

  console.log("🛡️ ALL 12 ROUTE GUARD & SECURITY AUDIT TESTS PASSED SUCCESSFULLY!");
}

runSecuritySuite().catch((err) => {
  console.error("❌ Route guard security test failed:", err);
  process.exit(1);
});
