import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
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
  /** Route not yet built — shown but disabled until its milestone lands. */
  soon?: boolean;
};

export type NavGroup = { label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Sales",
    items: [
      { label: "Leads", href: "/leads", icon: Sparkles },
      { label: "Opportunities", href: "/opportunities", icon: Target },
      { label: "Quotations", href: "/quotations", icon: FileText },
      { label: "Accounts", href: "/accounts", icon: Users },
    ],
  },
  {
    label: "Delivery",
    items: [
      { label: "Projects", href: "/projects", icon: FolderKanban },
      { label: "AMC & PPM", href: "/contracts", icon: ShieldCheck },
      { label: "Service", href: "/service", icon: Wrench },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Inventory", href: "/inventory", icon: Boxes },
      { label: "Equipment", href: "/equipment", icon: Cpu },
      { label: "Documents", href: "/documents", icon: FileBox, soon: true },
    ],
  },
  {
    label: "Insight",
    items: [{ label: "Reports", href: "/reports", icon: BarChart3, soon: true }],
  },
  {
    label: "Admin",
    items: [
      { label: "Users & Roles", href: "/admin", icon: KeyRound },
      { label: "Settings", href: "/settings", icon: Settings, soon: true },
    ],
  },
];
