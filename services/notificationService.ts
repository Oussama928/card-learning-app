import type { GetNotificationsResponseDTO, NotificationItemDTO } from "@/types";
import { requestJson } from "./httpClient";

export async function getSmallNotifications(
  accessToken: string
): Promise<{ notifs: NotificationItemDTO[]; new: boolean }> {
  const data = await requestJson<{ notifs: NotificationItemDTO[]; new: boolean }>(
    "/api/notifications/getSmall",
    {
      method: "GET",
      token: accessToken,
    }
  );

  return {
    notifs: Array.isArray(data.notifs) ? data.notifs : [],
    new: Boolean(data.new),
  };
}

export async function getBigNotifications(
  accessToken: string,
  page = 1,
  limit = 12
): Promise<GetNotificationsResponseDTO> {
  return requestJson<GetNotificationsResponseDTO>(
    `/api/notifications/getBig?page=${page}&limit=${limit}`,
    {
      method: "GET",
      token: accessToken,
    }
  );
}

export async function deleteNotification(id: string, accessToken: string): Promise<void> {
  await requestJson(`/api/notifications/${id}`, {
    method: "DELETE",
    token: accessToken,
  });
}
