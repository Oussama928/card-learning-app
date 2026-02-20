import type {
  CreateStudyGroupAssignmentRequestDTO,
  CreateStudyGroupAssignmentResponseDTO,
  CreateStudyGroupCommentRequestDTO,
  CreateStudyGroupCommentResponseDTO,
  CreateStudyGroupPostRequestDTO,
  CreateStudyGroupPostResponseDTO,
  CreateStudyGroupRequestDTO,
  CreateStudyGroupResponseDTO,
  GetStudyGroupAssignmentsResponseDTO,
  GetStudyGroupPostsResponseDTO,
  GetStudyGroupsResponseDTO,
  GetPublicStudyGroupsResponseDTO,
  JoinStudyGroupRequestDTO,
  JoinStudyGroupResponseDTO,
  DeleteStudyGroupAssignmentResponseDTO,
  DeleteStudyGroupCommentResponseDTO,
  DeleteStudyGroupPostResponseDTO,
} from "@/types";
import { requestJson } from "./httpClient";

export async function getStudyGroups(accessToken: string): Promise<GetStudyGroupsResponseDTO> {
  return requestJson<GetStudyGroupsResponseDTO>("/api/study-groups", {
    method: "GET",
    token: accessToken,
  });
}

export async function getPublicStudyGroups(
  params: { query?: string; page?: number; limit?: number },
  accessToken: string
): Promise<GetPublicStudyGroupsResponseDTO> {
  const search = new URLSearchParams();
  if (params.query) {
    search.set("q", params.query);
  }
  if (params.page) {
    search.set("page", String(params.page));
  }
  if (params.limit) {
    search.set("limit", String(params.limit));
  }

  const queryString = search.toString();
  const url = queryString ? `/api/study-groups/public?${queryString}` : "/api/study-groups/public";

  return requestJson<GetPublicStudyGroupsResponseDTO>(url, {
    method: "GET",
    token: accessToken,
  });
}

export async function createStudyGroup(
  payload: CreateStudyGroupRequestDTO,
  accessToken: string
): Promise<CreateStudyGroupResponseDTO> {
  return requestJson<CreateStudyGroupResponseDTO>("/api/study-groups", {
    method: "POST",
    token: accessToken,
    body: JSON.stringify(payload),
  });
}

export async function joinStudyGroup(
  payload: JoinStudyGroupRequestDTO,
  accessToken: string
): Promise<JoinStudyGroupResponseDTO> {
  return requestJson<JoinStudyGroupResponseDTO>("/api/study-groups/join", {
    method: "POST",
    token: accessToken,
    body: JSON.stringify(payload),
  });
}

export async function getStudyGroupAssignments(
  groupId: number,
  accessToken: string
): Promise<GetStudyGroupAssignmentsResponseDTO> {
  return requestJson<GetStudyGroupAssignmentsResponseDTO>(`/api/study-groups/${groupId}/assignments`, {
    method: "GET",
    token: accessToken,
  });
}

export async function createStudyGroupAssignment(
  groupId: number,
  payload: CreateStudyGroupAssignmentRequestDTO,
  accessToken: string
): Promise<CreateStudyGroupAssignmentResponseDTO> {
  return requestJson<CreateStudyGroupAssignmentResponseDTO>(`/api/study-groups/${groupId}/assignments`, {
    method: "POST",
    token: accessToken,
    body: JSON.stringify(payload),
  });
}

export async function getStudyGroupPosts(
  groupId: number,
  accessToken: string
): Promise<GetStudyGroupPostsResponseDTO> {
  return requestJson<GetStudyGroupPostsResponseDTO>(`/api/study-groups/${groupId}/posts`, {
    method: "GET",
    token: accessToken,
  });
}

export async function createStudyGroupPost(
  groupId: number,
  payload: CreateStudyGroupPostRequestDTO,
  accessToken: string
): Promise<CreateStudyGroupPostResponseDTO> {
  return requestJson<CreateStudyGroupPostResponseDTO>(`/api/study-groups/${groupId}/posts`, {
    method: "POST",
    token: accessToken,
    body: JSON.stringify(payload),
  });
}

export async function createStudyGroupComment(
  groupId: number,
  postId: number,
  payload: CreateStudyGroupCommentRequestDTO,
  accessToken: string
): Promise<CreateStudyGroupCommentResponseDTO> {
  return requestJson<CreateStudyGroupCommentResponseDTO>(
    `/api/study-groups/${groupId}/posts/${postId}/comments`,
    {
      method: "POST",
      token: accessToken,
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteStudyGroupPost(
  groupId: number,
  postId: number,
  accessToken: string
): Promise<DeleteStudyGroupPostResponseDTO> {
  return requestJson<DeleteStudyGroupPostResponseDTO>(`/api/study-groups/${groupId}/posts/${postId}`, {
    method: "DELETE",
    token: accessToken,
  });
}

export async function deleteStudyGroupComment(
  groupId: number,
  postId: number,
  commentId: number,
  accessToken: string
): Promise<DeleteStudyGroupCommentResponseDTO> {
  return requestJson<DeleteStudyGroupCommentResponseDTO>(
    `/api/study-groups/${groupId}/posts/${postId}/comments/${commentId}`,
    {
      method: "DELETE",
      token: accessToken,
    }
  );
}

export async function deleteStudyGroupAssignment(
  groupId: number,
  assignmentId: number,
  accessToken: string
): Promise<DeleteStudyGroupAssignmentResponseDTO> {
  return requestJson<DeleteStudyGroupAssignmentResponseDTO>(
    `/api/study-groups/${groupId}/assignments/${assignmentId}`,
    {
      method: "DELETE",
      token: accessToken,
    }
  );
}
