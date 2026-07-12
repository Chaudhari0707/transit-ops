import {
  bigint,
  bigserial,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "@/lib/db/schema/auth";
import { documentEntityTypeEnum, notificationStatusEnum } from "@/lib/db/schema/enums";
import { deletedAt, timestamps } from "@/lib/db/schema/helpers";

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityType: documentEntityTypeEnum("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    storagePath: text("storage_path").notNull(),
    mimeType: varchar("mime_type", { length: 127 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    uploadedByUserId: text("uploaded_by_user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt,
  },
  (table) => [index("documents_entity_type_entity_id_idx").on(table.entityType, table.entityId)],
);

export const notificationOutbox = pgTable(
  "notification_outbox",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    channel: varchar("channel", { length: 32 }).notNull().default("email"),
    templateKey: varchar("template_key", { length: 64 }).notNull(),
    recipientEmail: varchar("recipient_email", { length: 254 }).notNull(),
    payloadJson: jsonb("payload_json").notNull(),
    status: notificationStatusEnum("status").notNull().default("pending"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    lastError: text("last_error"),
    ...timestamps,
  },
  (table) => [
    index("notification_outbox_status_scheduled_for_idx").on(table.status, table.scheduledFor),
  ],
);
