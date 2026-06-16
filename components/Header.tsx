"use client";

import React from "react";
import Link from "next/link";
import "./Header.css";

export default function Header() {
  return (
    <header className="gc-desktop-header">
      <div className="gc-header-left">
        <Link href="/" className="gc-header-logo">
          GAME<span>CENTRAL</span>
        </Link>
      </div>

      <nav className="gc-header-nav">
        <Link href="/login" className="gc-header-link">
          Giriş
        </Link>

        <Link href="/register" className="gc-header-link gc-register-link">
          Kayıt Ol
        </Link>

        <Link href="/create" className="gc-header-link gc-seller-link">
          İlan Ver
        </Link>
      </nav>
    </header>
  );
}