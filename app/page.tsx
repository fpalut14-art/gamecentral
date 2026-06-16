"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [status, setStatus] = useState("BAŞLANGIÇ");

  useEffect(() => {
    setStatus("CLIENT JS ÇALIŞTI");
  }, []);

  return (
    <main style={{ padding: 30, minHeight: "100vh", background: "#050505", color: "white" }}>
      <h1>GAMECENTRAL TEST</h1>
      <p>{status}</p>

      <button
        type="button"
        onClick={() => setStatus("BUTON ÇALIŞTI")}
        style={{ width: "100%", height: 60, fontSize: 20 }}
      >
        TEST
      </button>
    </main>
  );
}