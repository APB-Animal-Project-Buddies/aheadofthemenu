"use client";

import { useAuth } from "@/components/AuthProvider";
import type { UserType } from "@/lib/nhost/roles";

const ARROW = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const HEART = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.7-4.35-9.33-8.06C.9 10.27 1.4 6.6 4.2 5.2c1.97-.98 4.04-.3 5.3 1.05L12 8.7l2.5-2.45c1.26-1.35 3.33-2.03 5.3-1.05 2.8 1.4 3.3 5.07 1.53 7.74C18.7 16.65 12 21 12 21Z" /></svg>
);

type CardId = "business" | "consumer" | "all";
type Card = { id: CardId; href: string; who: string; what: string; desc: string };

const CARDS: Record<CardId, Card> = {
  business: { id: "business", href: "/recipes", who: "For restaurateurs & chefs", what: "Recipes & Menus", desc: "Line-tested plant-based recipes engineered for service." },
  consumer: { id: "consumer", href: "/dishes", who: "For home cooks & everyone", what: "Dishes", desc: "Discover and make crowd-pleasing plant-based dishes at home." },
  all: { id: "all", href: "/top-alternatives", who: "For all", what: "Favorite Products", desc: "Our top-rated plant-based swaps, vetted by blind taste tests." },
};

// Order the paths so the logged-in user's own path leads; logged-out keeps the
// default business → consumer → all.
function orderFor(userType: UserType | null): Card[] {
  const order: CardId[] =
    userType === "business" ? ["business", "all", "consumer"]
    : userType === "consumer" ? ["consumer", "all", "business"]
    : ["business", "consumer", "all"];
  return order.map((id) => CARDS[id]);
}

export function LandingPaths() {
  const { userType, isAuthenticated } = useAuth();
  const cards = orderFor(userType);
  let n = 0; // running 01/02 for the numbered (non-heart) cards

  return (
    <nav className="aotm-paths" aria-label="Choose your path">
      {cards.map((c, i) => {
        const primary = isAuthenticated && i === 0;
        const num = c.id === "all" ? HEART : String(++n).padStart(2, "0");
        return (
          <a key={c.id} className={"aotm-card" + (primary ? " aotm-card-primary" : "")} href={c.href}>
            <span className="aotm-card-num" aria-hidden={c.id === "all" ? true : undefined}>{num}</span>
            <span className="aotm-card-body">
              {primary && <span className="aotm-card-foryou">For you</span>}
              <span className="who">{c.who}</span>
              <span className="what">{c.what}</span>
              <span className="desc">{c.desc}</span>
            </span>
            <span className="aotm-card-arrow" aria-hidden="true">{ARROW}</span>
          </a>
        );
      })}
    </nav>
  );
}
