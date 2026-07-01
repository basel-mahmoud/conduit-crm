/**
 * Ready-made demo accounts — one per access level.
 *
 * These exist only while Conduit runs on the Clerk DEVELOPMENT instance.
 * They use Clerk's test-email convention (`…+clerk_test@example.com`) — no
 * real mailbox exists and all of them share one demo password.
 * Remove them (and this file) before a real production launch.
 */
export const TEST_PASSWORD = "Conduit-Demo-2026";

export interface TestAccount {
  email: string;
  roleKey: string;
  roleName: string;
}

export const TEST_ACCOUNTS: TestAccount[] = [
  { email: "admin.test+clerk_test@example.com", roleKey: "admin", roleName: "Administrator" },
  { email: "md.test+clerk_test@example.com", roleKey: "managing_director", roleName: "Managing Director" },
  { email: "gm.test+clerk_test@example.com", roleKey: "general_manager", roleName: "General Manager" },
  { email: "sales.manager.test+clerk_test@example.com", roleKey: "sales_manager", roleName: "Sales Manager" },
  { email: "sales.engineer.test+clerk_test@example.com", roleKey: "sales_engineer", roleName: "Sales Engineer" },
  { email: "estimator.test+clerk_test@example.com", roleKey: "estimation_engineer", roleName: "Estimation Engineer" },
  { email: "pm.test+clerk_test@example.com", roleKey: "project_manager", roleName: "Project Manager" },
  { email: "service.manager.test+clerk_test@example.com", roleKey: "service_manager", roleName: "Service Manager" },
  { email: "service.engineer.test+clerk_test@example.com", roleKey: "service_engineer", roleName: "Service Engineer" },
  { email: "procurement.test+clerk_test@example.com", roleKey: "procurement_officer", roleName: "Procurement Officer" },
  { email: "accountant.test+clerk_test@example.com", roleKey: "accountant", roleName: "Accountant" },
];
