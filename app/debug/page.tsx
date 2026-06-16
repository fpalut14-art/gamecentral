"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function addLog(message: string) {
    const time = new Date().toLocaleTimeString("tr-TR");
    setLogs((prev) => [`${time} - ${message}`, ...prev]);
  }

  async function testProducts() {
    try {
      addLog("Products testi başladı...");

      const productsQuery = query(
        collection(db, "products"),
        where("status", "==", "active"),
        limit(5)
      );

      const snap = await getDocs(productsQuery);

      addLog(`Products OK: ${snap.size} aktif ilan bulundu.`);
    } catch (error: any) {
      addLog(`Products ERROR: ${error?.code || error?.message || String(error)}`);
    }
  }

  async function testAds() {
    try {
      addLog("Ads testi başladı...");

      const adsQuery = query(
        collection(db, "ads"),
        where("status", "==", "active"),
        limit(5)
      );

      const snap = await getDocs(adsQuery);

      addLog(`Ads OK: ${snap.size} aktif reklam bulundu.`);
    } catch (error: any) {
      addLog(`Ads ERROR: ${error?.code || error?.message || String(error)}`);
    }
  }

  async function testLogin() {
    try {
      addLog("Login testi başladı...");

      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      addLog(`Login OK: ${result.user.email || result.user.uid}`);
    } catch (error: any) {
      addLog(`Login ERROR: ${error?.code || error?.message || String(error)}`);
    }
  }

  function clearLogs() {
    setLogs([]);
  }

  return (
    <main style={page}>
      <section style={card}>
        <h1 style={title}>GameCentral Debug</h1>
        <p style={text}>Mobil Firebase/Auth test ekranı.</p>

        <div style={buttonGrid}>
          <button type="button" onClick={testProducts} style={button}>
            Products Oku
          </button>

          <button type="button" onClick={testAds} style={button}>
            Ads Oku
          </button>

          <button type="button" onClick={clearLogs} style={secondaryButton}>
            Log Temizle
          </button>
        </div>

        <div style={loginBox}>
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
            autoComplete="email"
          />

          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
            autoComplete="current-password"
          />

          <button type="button" onClick={testLogin} style={button}>
            Login Test
          </button>
        </div>

        <div style={logBox}>
          {logs.length === 0 ? (
            <span style={{ color: "#94a3b8" }}>Henüz test çalıştırılmadı.</span>
          ) : (
            logs.map((log, index) => (
              <div key={`${log}-${index}`} style={logLine}>
                {log}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#050505",
  color: "white",
  padding: "18px 18px 120px",
  fontFamily: "Arial, sans-serif",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 560,
  margin: "0 auto",
  padding: 18,
  borderRadius: 18,
  background: "linear-gradient(180deg, #0f172a, #070a12)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const title: React.CSSProperties = {
  margin: 0,
  color: "#ffd400",
  fontSize: 28,
  fontWeight: 900,
};

const text: React.CSSProperties = {
  marginTop: 8,
  color: "#94a3b8",
};

const buttonGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
  marginTop: 18,
};

const loginBox: React.CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 18,
};

const input: React.CSSProperties = {
  width: "100%",
  height: 48,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#111827",
  color: "white",
  padding: "0 12px",
  outline: "none",
  fontSize: 15,
};

const button: React.CSSProperties = {
  width: "100%",
  minHeight: 48,
  borderRadius: 12,
  border: "none",
  background: "#ffd400",
  color: "#050505",
  fontWeight: 900,
  fontSize: 14,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,0.08)",
  color: "#cbd5e1",
  border: "1px solid rgba(255,255,255,0.12)",
};

const logBox: React.CSSProperties = {
  marginTop: 20,
  marginBottom: 80,
  padding: 14,
  minHeight: 260,
  maxHeight: "55vh",
  overflowY: "auto",
  borderRadius: 14,
  background: "#050816",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#fff",
  fontSize: 13,
  lineHeight: 1.45,
};

const logLine: React.CSSProperties = {
  padding: "8px 0",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
  wordBreak: "break-word",
};