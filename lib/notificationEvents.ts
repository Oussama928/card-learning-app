import db from "@/lib/db";
import { emitNotificationToUser } from "@/lib/socketServer";
import type { NotificationMetadataDTO, NotificationType, NotificationItemDTO } from "@/types";

interface NotificationInsertRow {
  id: string;
  type: NotificationType;
  content: string;
  created_at: string;
  is_read: boolean;
  metadata: NotificationMetadataDTO | null;
}

export async function notifyUser(
  userId: number,
  type: NotificationType,
  content: string,
  metadata?: NotificationMetadataDTO
): Promise<NotificationItemDTO> {
  const insertResult = await db.queryAsync(
    `
    INSERT INTO notifications (user_id, type, content, is_read, created_at, metadata)
    VALUES ($1, $2, $3, FALSE, NOW(), $4)
    RETURNING id, type, content, created_at, is_read, metadata
    `,
    [userId, type, content, metadata ? JSON.stringify(metadata) : null]
  );

  const row = insertResult.rows[0] as NotificationInsertRow;

  const notification: NotificationItemDTO = {
    id: String(row.id),
    type: row.type,
    content: row.content,
    created_at: row.created_at,
    is_read: row.is_read,
    metadata: row.metadata,
  };

  emitNotificationToUser(String(userId), notification);

  return notification;
}
