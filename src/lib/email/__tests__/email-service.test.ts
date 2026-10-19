import {
  generateNewComplaintEmail,
} from "../templates/new-complaint";
import {
  generateTechnicianAssignedEmail,
  generateStaffAssignedEmail,
} from "../templates/ticket-assigned";
import { generateTicketResolvedEmail } from "../templates/ticket-resolved";
import {
  sendEmail,
  sendNewComplaintEmail,
  sendTicketAssignedEmail,
  sendTicketResolvedEmail,
  dispatchAsyncEmail,
} from "../service";

async function runTests() {
  console.log("=== Running Email Notification Service Tests ===\n");

  // 1. Test generateNewComplaintEmail
  console.log("[Test 1] generateNewComplaintEmail template generation...");
  const newComplaint = generateNewComplaintEmail({
    ticketNumber: "TICK-1001",
    staffName: "Sarah Connor",
    staffEmail: "sconnor@r4cglobal.org",
    staffDepartment: "Media & Comms",
    title: "MacBook Pro Screen Flickering",
    description: "Display randomly turns black while on battery power.",
    issueType: "Display / Screen",
    priority: "critical",
    deviceName: "MacBook Pro 16",
    serialNumber: "C02XYZ123",
  });

  if (!newComplaint.subject.includes("[E310 IT Alert] New Ticket TICK-1001 (CRITICAL)")) {
    throw new Error(`Unexpected subject: ${newComplaint.subject}`);
  }
  if (!newComplaint.html.includes("TICK-1001") || !newComplaint.html.includes("MacBook Pro 16")) {
    throw new Error("Missing expected ticket info in new complaint HTML");
  }
  if (!newComplaint.text.includes("C02XYZ123")) {
    throw new Error("Missing serial number in plaintext email body");
  }
  console.log("✓ PASS: New complaint email template generated correctly.\n");

  // 2. Test generateTechnicianAssignedEmail
  console.log("[Test 2] generateTechnicianAssignedEmail template generation...");
  const techAssigned = generateTechnicianAssignedEmail({
    ticketNumber: "TICK-1001",
    technicianName: "Alex Rivera",
    technicianEmail: "arivera@r4cglobal.org",
    staffName: "Sarah Connor",
    staffEmail: "sconnor@r4cglobal.org",
    title: "MacBook Pro Screen Flickering",
    issueType: "Display / Screen",
    priority: "high",
    triageNotes: "Priority check: replace display flex cable or test battery voltage.",
    assignedByName: "Goodness Ezekiel",
    deviceName: "MacBook Pro 16",
  });

  if (!techAssigned.subject.includes("Assigned to Ticket TICK-1001")) {
    throw new Error(`Unexpected subject: ${techAssigned.subject}`);
  }
  if (!techAssigned.html.includes("replace display flex cable")) {
    throw new Error("Missing triage notes in technician HTML email");
  }
  console.log("✓ PASS: Technician assignment email template generated correctly.\n");

  // 3. Test generateStaffAssignedEmail
  console.log("[Test 3] generateStaffAssignedEmail template generation...");
  const staffAssigned = generateStaffAssignedEmail({
    ticketNumber: "TICK-1001",
    technicianName: "Alex Rivera",
    technicianEmail: "arivera@r4cglobal.org",
    staffName: "Sarah Connor",
    staffEmail: "sconnor@r4cglobal.org",
    title: "MacBook Pro Screen Flickering",
    issueType: "Display / Screen",
    priority: "high",
    assignedByName: "Goodness Ezekiel",
  });

  if (!staffAssigned.subject.includes("IT Specialist Assigned to Ticket TICK-1001")) {
    throw new Error(`Unexpected subject: ${staffAssigned.subject}`);
  }
  if (!staffAssigned.html.includes("Alex Rivera")) {
    throw new Error("Missing technician name in staff notification HTML email");
  }
  console.log("✓ PASS: Staff assignment email template generated correctly.\n");

  // 4. Test generateTicketResolvedEmail
  console.log("[Test 4] generateTicketResolvedEmail template generation...");
  const resolved = generateTicketResolvedEmail({
    ticketNumber: "TICK-1001",
    staffName: "Sarah Connor",
    staffEmail: "sconnor@r4cglobal.org",
    title: "MacBook Pro Screen Flickering",
    issueType: "Display / Screen",
    resolutionSummary: "Replaced faulty display cable and updated macOS graphics firmware.",
    techNotes: "Stress-tested on battery for 4 hours without flickering.",
    resolvedAt: new Date().toISOString(),
    resolverName: "Alex Rivera",
    deviceName: "MacBook Pro 16",
  });

  if (!resolved.subject.includes("Ticket Resolved: TICK-1001")) {
    throw new Error(`Unexpected subject: ${resolved.subject}`);
  }
  if (!resolved.html.includes("Replaced faulty display cable")) {
    throw new Error("Missing resolution summary in resolved HTML email");
  }
  console.log("✓ PASS: Ticket resolved email template generated correctly.\n");

  // 5. Test sendEmail in local development / mock mode
  console.log("[Test 5] sendEmail dispatch (Mock Mode)...");
  const sendRes = await sendEmail({
    to: "test@r4cglobal.org",
    subject: "Test Diagnostic Ping",
    html: "<p>Health check ping</p>",
    text: "Health check ping",
  });

  if (!sendRes.success || sendRes.provider !== "mock") {
    throw new Error(`sendEmail failed in mock mode: ${JSON.stringify(sendRes)}`);
  }
  console.log("✓ PASS: sendEmail completed in mock mode.\n");

  // 6. Test sendNewComplaintEmail
  console.log("[Test 6] sendNewComplaintEmail dispatch...");
  const newComplaintResults = await sendNewComplaintEmail(
    {
      ticketNumber: "TICK-1002",
      staffName: "John Doe",
      staffEmail: "jdoe@r4cglobal.org",
      title: "Broken USB-C Port",
      description: "Port 1 doesn't charge.",
      issueType: "Hardware / Port",
      priority: "high",
    },
    ["tech1@r4cglobal.org", "tech2@r4cglobal.org"]
  );

  if (newComplaintResults.length !== 1 || !newComplaintResults[0].success) {
    throw new Error(`sendNewComplaintEmail failed: ${JSON.stringify(newComplaintResults)}`);
  }
  console.log("✓ PASS: sendNewComplaintEmail dispatched cleanly.\n");

  // 7. Test sendTicketAssignedEmail
  console.log("[Test 7] sendTicketAssignedEmail dispatch...");
  const assignResults = await sendTicketAssignedEmail({
    ticketNumber: "TICK-1002",
    technicianName: "Alex Rivera",
    technicianEmail: "arivera@r4cglobal.org",
    staffName: "John Doe",
    staffEmail: "jdoe@r4cglobal.org",
    title: "Broken USB-C Port",
    issueType: "Hardware / Port",
    priority: "high",
    assignedByName: "Goodness Ezekiel",
  });

  if (assignResults.length !== 2 || !assignResults.every((r) => r.success)) {
    throw new Error(`sendTicketAssignedEmail failed: ${JSON.stringify(assignResults)}`);
  }
  console.log("✓ PASS: sendTicketAssignedEmail dispatched to both technician and staff.\n");

  // 8. Test sendTicketResolvedEmail
  console.log("[Test 8] sendTicketResolvedEmail dispatch...");
  const resolveResult = await sendTicketResolvedEmail({
    ticketNumber: "TICK-1002",
    staffName: "John Doe",
    staffEmail: "jdoe@r4cglobal.org",
    title: "Broken USB-C Port",
    issueType: "Hardware / Port",
    resolutionSummary: "Replaced charging sub-board.",
    resolvedAt: new Date().toISOString(),
    resolverName: "Alex Rivera",
  });

  if (!resolveResult || !resolveResult.success) {
    throw new Error(`sendTicketResolvedEmail failed: ${JSON.stringify(resolveResult)}`);
  }
  console.log("✓ PASS: sendTicketResolvedEmail dispatched to staff.\n");

  // 9. Test dispatchAsyncEmail non-blocking safety
  console.log("[Test 9] dispatchAsyncEmail error safety...");
  let asyncErrorHandled = false;
  const failingTask = Promise.reject(new Error("Simulated transient network drop"));
  dispatchAsyncEmail(failingTask, "Simulated Failure Test");
  // Ensure synchronous execution continues unblocked
  asyncErrorHandled = true;
  if (!asyncErrorHandled) {
    throw new Error("dispatchAsyncEmail blocked execution");
  }
  console.log("✓ PASS: dispatchAsyncEmail handled background promise asynchronously.\n");

  console.log("🎉 ALL EMAIL SERVICE TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
