import type {
  GetSkillTreeLeaderboardResponseDTO,
  GetSkillTreeResponseDTO,
  GetSkillTreesResponseDTO,
} from "@/types";
import { requestJson } from "./httpClient";

export async function getSkillTrees(
  params: { language?: string | null },
  accessToken: string
): Promise<GetSkillTreesResponseDTO> {
  const search = new URLSearchParams();
  if (params.language) {
    search.set("language", params.language);
  }
  const url = search.toString() ? `/api/skill-trees?${search.toString()}` : "/api/skill-trees";
  return requestJson<GetSkillTreesResponseDTO>(url, {
    method: "GET",
    token: accessToken,
  });
}

export async function getSkillTree(treeId: number, accessToken: string): Promise<GetSkillTreeResponseDTO> {
  return requestJson<GetSkillTreeResponseDTO>(`/api/skill-trees/${treeId}`, {
    method: "GET",
    token: accessToken,
  });
}

export async function getSkillTreeLeaderboard(
  treeId: number,
  accessToken: string
): Promise<GetSkillTreeLeaderboardResponseDTO> {
  return requestJson<GetSkillTreeLeaderboardResponseDTO>(`/api/skill-trees/${treeId}/leaderboard`, {
    method: "GET",
    token: accessToken,
  });
}
