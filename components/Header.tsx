"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import "./Header.css";

export type UserProfile = {
  email?: string;
  name?: string;
  role?: "admin" | "seller" | "user";
};

export type NotificationItem = {
  id: string;
  userId?: string;
  title?: string;
  message?: string;
  read?: boolean;
  type?: string;
  createdAt?: string;
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [openNotifications, setOpenNotifications] = useState(false);

  const isAdminArea = pathname?.startsWith("/admin");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  async function loadNotifications(uid: string) {
    try {
      const q = query(collection(db, "notifications"), where("userId", "==", uid));
      const snap = await getDocs(q);

      const data = snap.docs
        .map((item) => ({
          id: item.id,
          ...(item.data() as Omit<NotificationItem, "id">),
        }))
        .sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );

      setNotifications(data);
    } catch {
      setNotifications([]);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setNotifications([]);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));

        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile({
            email: currentUser.email || "",
            role: "user",
          });
        }

        await loadNotifications(currentUser.uid);
      } catch {
        setProfile({
          email: currentUser.email || "",
          role: "user",
        });
      }
    });

    return () => unsub();
  }, []);

  async function logout() {
    await signOut(auth);
    setOpenNotifications(false);
    router.push("/");
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const q = search.trim();

    if (!q) {
      router.push("/");
      return;
    }

    router.push(`/?q=${encodeURIComponent(q)}`);
  }

  async function markNotificationRead(id: string) {
    if (!user) return;

    try {
      await updateDoc(doc(db, "notifications", id), {
        read: true,
        readAt: new Date().toISOString(),
      });

      await loadNotifications(user.uid);
    } catch {
      // sessiz geç
    }
  }

  async function markAllNotificationsRead() {
    if (!user) return;

    try {
      const unread = notifications.filter((item) => !item.read);

      await Promise.all(
        unread.map((item) =>
          updateDoc(doc(db, "notifications", item.id), {
            read: true,
            readAt: new Date().toISOString(),
          })
        )
      );

      await loadNotifications(user.uid);
    } catch {
      // sessiz geç
    }
  }

  if (isAdminArea || isAuthPage) return null;

  const unreadCount = notifications.filter((item) => !item.read).length;
  const displayName =
    profile?.name || profile?.email || user?.email || "Profil";

  return (
    <>
      <header className="gc-desktop-header">
        <div className="gc-header-left">
          <Link href="/" className="gc-header-logo">
            GAME<span>CENTRAL</span>
          </Link>

          <form className="gc-header-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Ürün, kategori veya ilan ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </div>

        <nav className="gc-header-nav">
          <Link href="/messages" className="gc-header-link">
            Mesajlar
          </Link>

          <Link href="/support" className="gc-header-link">
            Destek
          </Link>

          {user && (
            <div className="gc-notification-wrap">
              <button
                type="button"
                className="gc-notification-button"
                onClick={() => setOpenNotifications((prev) => !prev)}
              >
                🔔
                {unreadCount > 0 && (
                  <span className="gc-notification-count">{unreadCount}</span>
                )}
              </button>

              {openNotifications && (
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
              )}
            </div>
          )}

          {user ? (
            <>
              <Link href="/profile" className="gc-header-link gc-profile-link">
                {displayName}
              </Link>

              {(profile?.role === "seller" || profile?.role === "admin") && (
                <Link href="/seller" className="gc-header-link gc-seller-link">
                  Satıcı Paneli
                </Link>
              )}

              {profile?.role === "admin" && (
                <Link href="/admin" className="gc-header-link gc-admin-link">
                  Admin
                </Link>
              )}

              <button
                type="button"
                onClick={logout}
                className="gc-logout-link"
              >
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="gc-header-link">
                Giriş
              </Link>

              <Link href="/register" className="gc-header-link gc-register-link">
                Kayıt Ol
              </Link>

              <Link href="/create" className="gc-header-link gc-seller-link">
                İlan Ver
              </Link>
            </>
          )}
        </nav>
      </header>

      <header className="gc-mobile-header">
        <div className="gc-mobile-top">
          <Link href="/" className="gc-mobile-logo">
            GAME<span>CENTRAL</span>
          </Link>

          <div className="gc-mobile-top-actions">
            {user && (
              <button
                type="button"
                className="gc-mobile-icon-btn"
                onClick={() => setOpenNotifications((prev) => !prev)}
              >
                🔔
                {unreadCount > 0 && (
                  <span className="gc-notification-count">{unreadCount}</span>
                )}
              </button>
            )}

            {user ? (
              <Link href="/profile" className="gc-mobile-avatar">
                {displayName.slice(0, 1).toUpperCase()}
              </Link>
            ) : (
              <Link href="/login" className="gc-mobile-login-pill">
                Giriş
              </Link>
            )}
          </div>
        </div>

        <form className="gc-mobile-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Ürün veya kategori ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {openNotifications && user && (
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
        )}
      </header>

      <nav className="gc-mobile-bottom-nav">
        <Link href="/create">
          ➕
          <span>İlan</span>
        </Link>

        <Link href={user ? "/profile" : "/login"}>
          👤
          <span>{user ? "Profil" : "Giriş"}</span>
        </Link>

        <Link href="/messages">
          💬
          <span>Mesaj</span>
        </Link>

        <Link href="/support">
          🎧
          <span>Destek</span>
        </Link>
      </nav>
    </>
  );
}