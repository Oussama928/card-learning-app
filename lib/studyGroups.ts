import db from "@/lib/db";

export type GroupRole = "teacher" | "student" | null;

export interface GroupAccess {
  groupId: number;
  teacherUserId: number;
  role: GroupRole;
}

export function normalizeVisibility(value: unknown): "public" | "private" {
  return value === "public" ? "public" : "private"; // if it's not public treat it as private as default
}

export function generateJoinCode(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function getGroupAccess(groupId: number, userId: number): Promise<GroupAccess | null> {
  const groupResult = await db.queryAsync(
    `SELECT id, teacher_user_id FROM study_groups WHERE id = $1`,
    [groupId]
  );

  const group = groupResult.rows[0] as { id: number; teacher_user_id: number } | undefined;
  if (!group) return null;

  if (Number(group.teacher_user_id) === userId) {
    return {
      groupId: Number(group.id),
      teacherUserId: Number(group.teacher_user_id),
      role: "teacher",
    };
  }

  const membershipResult = await db.queryAsync(
    `SELECT id FROM study_group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );

  return {
    groupId: Number(group.id),
    teacherUserId: Number(group.teacher_user_id),
    role: membershipResult.rows.length > 0 ? "student" : null,
  };
}

export async function requireGroupMember(groupId: number, userId: number): Promise<GroupAccess> {
  const access = await getGroupAccess(groupId, userId);
  if (!access || !access.role) {
    throw new Error("FORBIDDEN_GROUP_MEMBER");
  }
  return access;
}

export async function requireGroupTeacher(groupId: number, userId: number): Promise<GroupAccess> {
  const access = await getGroupAccess(groupId, userId);
  if (!access || access.role !== "teacher") {
    throw new Error("FORBIDDEN_GROUP_TEACHER");
  }
  return access;
}
