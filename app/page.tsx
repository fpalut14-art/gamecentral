"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ListingModal from "@/components/ListingModal";
import "./home.css";

type Product = {
  id: string;
  title?: string;
  price?: number;
  category?: string;
  status?: string;
  seller?: string;
  sellerId?: string;
  imageUrl?: string;
  imageBase64?: string;
  description?: string;
};

type AdItem = {
  id: string;
  brand?: string;
  title?: string;
  slot?: "premium" | "right-banner" | "partner-slot";
  link?: string;
  status?: string;
};

const ecosystems = [
  {
    icon: "🖥️",
    title: "Sistemler",
    value: "SİSTEMLER",
    children: ["DONANIMLAR", "PC KASA", "MONSTER SERİSİ"],
  },
  {
    icon: "🎮",
    title: "Oyun Dünyası",
    value: "OYUN DÜNYASI",
    children: ["KONSOLLAR", "PLAYSTATION", "XBOX", "NINTENDO"],
  },
  {
    icon: "⌨️",
    title: "Ekipmanlar",
    value: "EKİPMANLAR",
    children: ["FARE", "KLAVYE", "KULAKLIK"],
  },
  {
    icon: "🪑",
    title: "Yaşam Alanı",
    value: "YAŞAM ALANI",
    children: ["OYUNCU MOBİLYALARI", "KOLTUKLAR"],
  },
  {
    icon: "💎",
    title: "Dijital Varlıklar",
    value: "DİJİTAL VARLIKLAR",
    children: ["METİN2 MARKET", "VALORANT VP"],
  },
  {
    icon: "🏪",
    title: "Oyun Marketi",
    value: "OYUN MARKETİ",
    children: ["STEAM", "EPIC GAMES", "OYUN KODLARI", "HEDİYE KARTLARI"],
  },
];

const categories = [
  "TÜMÜ",
  ...ecosystems.map((item) => item.value),
  "DONANIMLAR",
  "PC KASA",
  "FARE",
  "KLAVYE",
  "KULAKLIK",
  "OYUNCU MOBİLYALARI",
  "KOLTUKLAR",
  "MONSTER SERİSİ",
  "METİN2 MARKET",
  "VALORANT VP",
];

function normalize(value?: string) {
  return String(value || "").toLocaleLowerCase("tr-TR").trim();
}

function isActiveStatus(status?: string) {
  const value = normalize(status);
  return value === "active" || value === "aktif";
}

function categoryMatches(selectedCategory: string, productCategory: string) {
  if (selectedCategory === "TÜMÜ") return true;

  const selected = normalize(selectedCategory);
  const current = normalize(productCategory);

  if (current === selected) return true;

  const ecosystem = ecosystems.find(
    (item) => normalize(item.value) === selected
  );

  if (!ecosystem) return false;

  return ecosystem.children.some((child) => normalize(child) === current);
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function mapProduct(id: string, data: any): Product {
  return {
    id,
    title: data.title || data["başlık"] || data["baslik"],
    price: Number(data.price ?? data["fiyat"] ?? 0),
    category: data.category || data["kategori"],
    status: data.status || data["durum"],
    seller: data.seller || data["satıcı"] || data["satici"],
    sellerId:
      data.sellerId ||
      data["satıcı kimliği"] ||
      data["satici kimligi"] ||
      data["sellerUid"],
    imageUrl: data.imageUrl || data["görsel"] || data["gorsel"],
    imageBase64: data.imageBase64 || data["imageBase64"],
    description: data.description || data["açıklama"] || data["aciklama"],
  };
}

function mapAd(id: string, data: any): AdItem {
  return {
    id,
    brand: data.brand || data["marka"],
    title: data.title || data["başlık"] || data["baslik"],
    slot: data.slot || data["alan"],
    link: data.link || data["bağlantı"] || data["baglanti"],
    status: data.status || data["durum"],
  };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("TÜMÜ");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [debugMessage, setDebugMessage] = useState("Başlatılıyor...");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadHomeData() {
    try {
      setLoading(true);
      setErrorMessage("");
      setDebugMessage("PRODUCTS SORGUSU BAŞLADI");

      const productQuery = query(collection(db, "products"), limit(48));

      const productSnap = await withTimeout(
        getDocs(productQuery),
        10000,
        "Firestore products sorgusu 10 saniyede cevap vermedi."
      );

      setDebugMessage(`PRODUCTS OK: ${productSnap.size} kayıt geldi.`);

      const mappedProducts = productSnap.docs.map((item) =>
        mapProduct(item.id, item.data())
      );

      const activeProducts = mappedProducts.filter((product) =>
        isActiveStatus(product.status)
      );

      setDebugMessage(
        `PRODUCTS OK: ${mappedProducts.length} kayıt geldi, ${activeProducts.length} aktif ilan bulundu.`
      );

      setProducts(activeProducts);
    } catch (error: any) {
      console.error("Ana sayfa ilan verisi çekilemedi:", error);
      setProducts([]);

      const message =
        error?.code ||
        error?.message ||
        JSON.stringify(error) ||
        "Bilinmeyen hata";

      setErrorMessage("MOBİL DEBUG HATA: " + message);
      setDebugMessage("PRODUCTS ERROR: " + message);
    } finally {
      setLoading(false);
    }

    try {
      setDebugMessage((prev) => prev + " | ADS SORGUSU BAŞLADI");

      const adsQuery = query(collection(db, "ads"), limit(24));

      const adsSnap = await withTimeout(
        getDocs(adsQuery),
        8000,
        "Firestore ads sorgusu 8 saniyede cevap vermedi."
      );

      const adsData = adsSnap.docs
        .map((item) => mapAd(item.id, item.data()))
        .filter((ad) => isActiveStatus(ad.status));

      setAds(adsData);
    } catch (adsError: any) {
      console.warn("Reklamlar alınamadı:", adsError);
      setAds([]);
    }
  }

  useEffect(() => {
    loadHomeData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const q = normalize(search);

      const categoryMatch = categoryMatches(
        selectedCategory,
        String(product.category || "")
      );

      const searchMatch =
        q === "" ||
        normalize(product.title).includes(q) ||
        normalize(product.category).includes(q) ||
        normalize(product.seller).includes(q);

      return categoryMatch && searchMatch;
    });
  }, [products, selectedCategory, search]);

  const premiumAd = ads.find((ad) => ad.slot === "premium");
  const rightAds = ads.filter((ad) => ad.slot === "right-banner").slice(0, 3);
  const partnerAds = ads.filter((ad) => ad.slot === "partner-slot");

  return (
    <main className="gc-page">
      <div className="gc-layout">
        <aside className="gc-sidebar">
          <Link href="/create" className="gc-create-btn">
            + YENİ İLAN VER
          </Link>

          <div className="gc-sidebar-box">
            <Link href="/" className="gc-menu active">
              ANA SAYFA
            </Link>

            <small>EKOSİSTEMLER</small>

            <button
              type="button"
              onClick={() => setSelectedCategory("TÜMÜ")}
              className={
                selectedCategory === "TÜMÜ"
                  ? "gc-category selected"
                  : "gc-category"
              }
            >
              TÜMÜ
            </button>

            {ecosystems.map((ecosystem) => (
              <button
                key={ecosystem.value}
                type="button"
                onClick={() => setSelectedCategory(ecosystem.value)}
                className={
                  selectedCategory === ecosystem.value
                    ? "gc-category selected"
                    : "gc-category"
                }
              >
                {ecosystem.icon} {ecosystem.title}
              </button>
            ))}

            <small>ALT KATEGORİLER</small>

            {categories
              .filter(
                (category) =>
                  category !== "TÜMÜ" &&
                  !ecosystems.some((eco) => eco.value === category)
              )
              .map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? "gc-category selected"
                      : "gc-category"
                  }
                >
                  {category}
                </button>
              ))}
          </div>
        </aside>

        <section className="gc-content">
          <section className="gc-mobile-ecosystems">
            <div className="gc-mobile-section-label">EKOSİSTEMLER</div>

            <div className="gc-mobile-ecosystem-grid">
              {ecosystems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedCategory(item.value)}
                  className={
                    selectedCategory === item.value
                      ? "gc-mobile-ecosystem-card selected"
                      : "gc-mobile-ecosystem-card"
                  }
                >
                  <span>{item.icon}</span>
                  <strong>{item.title}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="gc-hero-area">
            <Link href={premiumAd?.link || "/ad-request"} className="gc-hero">
              <div className="gc-hero-overlay">
                <span className="gc-badge">PREMIUM SLOT</span>
                <h1>{premiumAd?.title || "PREMİUM REKLAM ALANI"}</h1>
                <p>
                  {premiumAd?.brand
                    ? `${premiumAd.brand} sponsorlu reklam alanı.`
                    : "Markanı GameCentral vitrininde göster."}
                </p>
                <span className="gc-hero-btn">
                  {premiumAd ? "REKLAMI GÖR" : "REKLAM BAŞVURUSU YAP"}
                </span>
              </div>
            </Link>

            <div className="gc-right-banners">
              {[0, 1, 2].map((i) => {
                const ad = rightAds[i];

                return (
                  <Link
                    key={i}
                    href={ad?.link || "/ad-request"}
                    className="gc-right-ad"
                  >
                    <strong>{ad?.title || "+ REKLAM VER"}</strong>
                    <span>{ad?.brand || "Sağ Banner Slot"}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="gc-products">
            <div className="gc-section-head">
              <div>
                <div className="gc-section-title">AKTİF İLANLAR</div>

                <p style={{ color: "#94a3b8", marginTop: 8 }}>
                  Debug: <b style={{ color: "#ffd400" }}>{debugMessage}</b>
                </p>

                <div style={{ marginTop: 10 }}>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="İlan ara..."
                    style={{
                      width: "100%",
                      maxWidth: 360,
                      height: 42,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,.1)",
                      background: "#111827",
                      color: "white",
                      padding: "0 12px",
                      outline: "none",
                    }}
                  />
                </div>

                {selectedCategory !== "TÜMÜ" && (
                  <p style={{ color: "#94a3b8", marginTop: 8 }}>
                    Filtre:{" "}
                    <b style={{ color: "#ffd400" }}>{selectedCategory}</b>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("TÜMÜ")}
                      style={{
                        marginLeft: 12,
                        color: "#ffd400",
                        fontWeight: 900,
                        background: "transparent",
                        border: 0,
                        cursor: "pointer",
                      }}
                    >
                      Temizle
                    </button>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={loadHomeData}
                className="gc-refresh"
              >
                ↻ YENİLE
              </button>
            </div>

            {loading && <div className="gc-empty">İlanlar yükleniyor...</div>}

            {!loading && errorMessage && (
              <div className="gc-empty">{errorMessage}</div>
            )}

            {!loading && !errorMessage && filteredProducts.length === 0 && (
              <div className="gc-empty">Aktif ilan bulunamadı.</div>
            )}

            {!loading && !errorMessage && filteredProducts.length > 0 && (
              <div className="gc-product-grid">
                {filteredProducts.map((product) => {
                  const productImage =
                    product.imageUrl || product.imageBase64 || "";

                  return (
                    <article className="gc-card" key={product.id}>
                      <div className="gc-card-image">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={product.title || "İlan"}
                          />
                        ) : (
                          <span>GAMECENTRAL</span>
                        )}
                      </div>

                      <div className="gc-card-body">
                        <span className="gc-card-category">
                          {product.category || "Kategori Yok"}
                        </span>

                        <h3>{product.title || "Başlıksız İlan"}</h3>

                        <p className="gc-seller">
                          Satıcı: {product.seller || "Doğrulanmamış Satıcı"}
                        </p>

                        <div className="gc-price">₺{product.price || 0}</div>

                        <button
                          type="button"
                          className="gc-card-btn"
                          onClick={() => {
                            setSelectedProduct(product);
                            setModalOpen(true);
                          }}
                        >
                          İNCELE
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="gc-partners">
            <div className="gc-section-title">PARTNER SLOTLARI</div>

            <div className="gc-slot-grid">
              {Array.from({ length: 18 }).map((_, i) => {
                const ad = partnerAds[i];

                return (
                  <Link
                    href={ad?.link || "/ad-request"}
                    className="gc-slot"
                    key={i}
                  >
                    <strong>{ad?.title || "+"}</strong>
                    <span>{ad?.brand || "REKLAM VER"}</span>
                    <small>SLOT #{String(i + 1).padStart(2, "0")}</small>
                  </Link>
                );
              })}
            </div>
          </section>
        </section>
      </div>

      <ListingModal
        product={selectedProduct}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </main>
  );
}