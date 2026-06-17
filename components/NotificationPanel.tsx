"use client";

import React from "react";
import { NotificationItem } from "./Header";

type Props = {
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
};

export default function NotificationPanel({
  notifications,
  unreadCount,
  markNotificationRead,
  markAllNotificationsRead,
}: Props) {
  return (
    <div className="gc-notification-panel">
      <div className="gc-notification-head">
        <strong>Bildirimler ({unreadCount})</strong>

        {unreadCount > 0 && (
          <button type="button" onClick={markAllNotificationsRead}>
            Tümünü Okundu Yap
          </button>
        )}
      </div>

      {notifications.length === 0 && (
        <div className="gc-notification-empty">Bildirim yok.</div>
      )}

      {notifications.map((item) => (
        <div
          key={item.id}
          className={
            item.read
              ? "gc-notification-item read"
              : "gc-notification-item unread"
          }
        >
          <strong>{item.title || "Bildirim"}</strong>

          <p>{item.message || "Yeni bildirimin var."}</p>

          {item.createdAt && <small>{item.createdAt}</small>}

          {!item.read && (
            <button
              type="button"
              onClick={() => markNotificationRead(item.id)}
            >
              Okundu
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
