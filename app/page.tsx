"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [status, setStatus] = useState("BAŞLANGIÇ");

  useEffect(() => {
    setStatus("CLIENT JS ÇALIŞTI");
  }, []);

  return (
    <main style={{ padding: 30, background: "#050505", color: "white", minHeight: "100vh" }}>
      <h1>GAMECENTRAL TEST</h1>
      <p>{status}</p>
      <button onClick={() => setStatus("BUTON ÇALIŞTI")}>TEST</button>
    </main>
  );
}