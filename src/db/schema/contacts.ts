import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { accounts } from "./accounts";
import { organizations } from "./organizations";
import { actorColumns, timestamps } from "./_shared";

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    accountId: uuid("account_id")
      .references(() => accounts.id, { onDelete: "cascade" })
      .notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    title: text("title"),
    email: text("email"),
    phone: text("phone"),
    mobile: text("mobile"),
    isPrimary: boolean("is_primary").notNull().default(false),
    ...actorColumns,
    ...timestamps,
  },
  (t) => [
    index("contacts_account_idx").on(t.accountId),
    index("contacts_org_idx").on(t.orgId),
  ],
);

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
