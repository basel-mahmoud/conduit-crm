import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Boxes,
  Cpu,
  FileBox,
  FileText,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wrench,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * Permission required to see this item (checked server-side in the app
   * layout). Omitted = visible to every signed-in user.
   */
  permission?: string;
};

export type NavGroup = { label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Guide", href: "/guide", icon: BookOpen },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Leads", href: "/leads", icon: Sparkles, permission: "lead.read" },
      { label: "Opportunities", href: "/opportunities", icon: Target, permission: "opportunity.read" },
      { label: "Quotations", href: "/quotations", icon: FileText, permission: "quotation.read" },
      { label: "Accounts", href: "/accounts", icon: Users, permission: "account.read" },
    ],
  },
  {
    label: "Delivery",
    items: [
      { label: "Projects", href: "/projects", icon: FolderKanban, permission: "project.read" },
      { label: "AMC & PPM", href: "/contracts", icon: ShieldCheck, permission: "contract.read" },
      { label: "Service", href: "/service", icon: Wrench, permission: "ticket.read" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Inventory", href: "/inventory", icon: Boxes, permission: "inventory.read" },
      { label: "Equipment", href: "/equipment", icon: Cpu, permission: "equipment.read" },
      { label: "Documents", href: "/documents", icon: FileBox, permission: "quotation.read" },
    ],
  },
  {
    label: "Insight",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3, permission: "report.view" },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Users & Roles", href: "/admin", icon: KeyRound, permission: "user.manage" },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
