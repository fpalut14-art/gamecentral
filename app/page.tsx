"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
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
  { icon: "🖥️", title: "Sistemler", value: "SİSTEMLER", children: ["DONANIMLAR", "PC KASA", "MONSTER SERİSİ"] },
  { icon: "🎮", title: "Oyun Dünyası", value: "OYUN DÜNYASI", children: ["KONSOLLAR", "PLAYSTATION", "XBOX", "NINTENDO"] },
  { icon: "⌨️", title: "Ekipmanlar", value: "EKİPMANLAR", children: ["FARE", "KLAVYE", "KULAKLIK"] },
  { icon: "🪑", title: "Yaşam Alanı", value: "YAŞAM ALANI", children: ["OYUNCU MOBİLYALARI", "KOLTUKLAR"] },
  { icon: "💎", title: "Dijital Varlıklar", value: "DİJİTAL VARLIKLAR", children: ["METİN2 MARKET", "VALORANT VP"] },
  { icon: "🏪", title: "Oyun Marketi", value: "OYUN MARKETİ", children: ["STEAM", "EPIC GAMES", "OYUN KODLARI", "HEDİYE KARTLARI"] },
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

function categoryMatches(selectedCategory: string, productCategory: string) {
  if (selectedCategory === "TÜMÜ") return true;

  const selected = normalize(selectedCategory);
  const current = normalize(productCategory);

  if (current === selected) return true;

  const ecosystem = ecosystems.find((item) => normalize(item.value) === selected);
  if (!ecosystem) return false;

  return ecosystem.children.some((child) => normalize(child) === current);
}

export default function HomePage() {
  return (
    <Suspense fallback={<main className="gc-page">Yükleniyor...</main>}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("TÜMÜ");
  const [search, setSearch] = useState(urlQuery);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadHomeData() {
    try {
      setLoading(true);
      setErrorMessage("");

      const productQuery = query(
        collection(db, "products"),
        where("status", "==", "active"),
        limit(48)
      );

      const productSnap = await getDocs(productQuery);

      setProducts(
        productSnap.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Product, "id">),
        }))
      );

      try {
        const adsQuery = query(
          collection(db, "ads"),
          where("status", "==", "active"),
          limit(24)
        );

        const adsSnap = await getDocs(adsQuery);

        setAds(
          adsSnap.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<AdItem, "id">),
          }))
        );
      } catch {
        setAds([]);
      }
    } catch (error) {
      console.error("Ana sayfa ilan verisi çekilemedi:", error);
      setProducts([]);
      setErrorMessage("İlanlar yüklenemedi. Firestore products okuma izni veya bağlantı kontrol edilmeli.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHomeData();
  }, []);

  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

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
              className={selectedCategory === "TÜMÜ" ? "gc-category selected" : "gc-category"}
            >
              TÜMÜ
            </button>

            {ecosystems.map((ecosystem) => (
              <button
                key={ecosystem.value}
                type="button"
                onClick={() => setSelectedCategory(ecosystem.value)}
                className={selectedCategory === ecosystem.value ? "gc-category selected" : "gc-category"}
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
                  className={selectedCategory === category ? "gc-category selected" : "gc-category"}
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
                  className={selectedCategory === item.value ? "gc-mobile-ecosystem-card selected" : "gc-mobile-ecosystem-card"}
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
                  <Link key={i} href={ad?.link || "/ad-request"} className="gc-right-ad">
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

                {selectedCategory !== "TÜMÜ" && (
                  <p style={{ color: "#94a3b8", marginTop: 8 }}>
                    Filtre: <b style={{ color: "#ffd400" }}>{selectedCategory}</b>
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

                {search && (
                  <p style={{ color: "#94a3b8", marginTop: 8 }}>
                    Arama sonucu: <b style={{ color: "#ffd400" }}>{search}</b>
                    <Link href="/" style={{ marginLeft: 12, color: "#ffd400", fontWeight: 900 }}>
                      Temizle
                    </Link>
                  </p>
                )}
              </div>

              <button type="button" onClick={loadHomeData} className="gc-refresh">
                ↻ YENİLE
              </button>
            </div>

            {loading && <div className="gc-empty">İlanlar yükleniyor...</div>}

            {!loading && errorMessage && <div className="gc-empty">{errorMessage}</div>}

            {!loading && !errorMessage && filteredProducts.length === 0 && (
              <div className="gc-empty">Aktif ilan bulunamadı.</div>
            )}

            {!loading && !errorMessage && filteredProducts.length > 0 && (
              <div className="gc-product-grid">
                {filteredProducts.map((product) => {
                  const productImage = product.imageUrl || product.imageBase64 || "";

                  return (
                    <article className="gc-card" key={product.id}>
                      <div className="gc-card-image">
                        {productImage ? (
                          <img src={productImage} alt={product.title || "İlan"} />
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
                  <Link href={ad?.link || "/ad-request"} className="gc-slot" key={i}>
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