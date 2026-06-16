"use client";

import React, { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function log(msg: string) {
    setLogs((prev) => [`${new Date().toLocaleTimeString()} - ${msg}`, ...prev]);
  }

  async function testProducts() {
    try {
      log("Products test başladı...");
      const q = query(
        collection(db, "products"),
        where("status", "==", "active"),
        limit(5)
      );
      const snap = await getDocs(q);
      log(`Products OK: ${snap.size} ilan bulundu.`);
    } catch (error: any) {
      log(`Products ERROR: ${error.code || error.message}`);
    }
  }

  async function testAds() {
    try {
      log("Ads test başladı...");
      const q = query(
        collection(db, "ads"),
        where("status", "==", "active"),
        limit(5)
      );
      const snap = await getDocs(q);
      log(`Ads OK: ${snap.size} reklam bulundu.`);
    } catch (error: any) {
      log(`Ads ERROR: ${error.code || error.message}`);
    }
  }

  async function testLogin() {
    try {
      log("Login test başladı...");
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      log(`Login OK: ${result.user.email}`);
    } catch (error: any) {
      log(`Login ERROR: ${error.code || error.message}`);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#050505", color: "white", padding: 20 }}>
      <h1 style={{ color: "#ffd400" }}>GameCentral Debug</h1>

      <button onClick={testProducts} style={btn}>Products Oku</button>
      <button onClick={testAds} style={btn}>Ads Oku</button>

      <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
        />
        <input
          placeholder="Şifre"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />
        <button onClick={testLogin} style={btn}>Login Test</button>
      </div>

      <pre style={logBox}>{logs.join("\n")}</pre>
    </main>
  );
}

const btn: React.CSSProperties = {
  marginRight: 10,
  marginTop: 10,
  padding: "12px 16px",
  borderRadius: 12,
  border: "none",
  background: "#ffd400",
  color: "#050505",
  fontWeight: 900,
};

const input: React.CSSProperties = {
  height: 48,
  borderRadius: 12,
  border: "1px solid #333",
  background: "#111827",
  color: "white",
  padding: "0 12px",
};

const logBox: React.CSSProperties = {
  marginTop: 24,
  padding: 16,
  borderRadius: 12,
  background: "#111827",
  whiteSpace: "pre-wrap",
};