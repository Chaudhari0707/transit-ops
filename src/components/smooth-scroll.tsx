"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { type LenisRef, ReactLenis } from "lenis/react";

/**
 * SmoothScroll
 *
 * Lenis root smooth scroll is for marketing pages (landing) only.
 * App shells (dashboard, domain routes) use an internal scroll region so
 * the sidebar + header stay fixed — enabling document Lenis there makes
 * the whole chrome scroll with the page.
 *
 * To opt a nested element out of Lenis when it is active, add:
 *   data-lenis-prevent           – block all scroll propagation
 *   data-lenis-prevent-wheel     – block wheel events only
 *   data-lenis-prevent-touch     – block touch events only
 */
function isMarketingPath(pathname: string): boolean {
  return pathname === "/";
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<LenisRef>(null);
  const enableRootLenis = isMarketingPath(pathname);

  useEffect(() => {
    if (!enableRootLenis) {
      return;
    }

    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    // Disable GSAP's own lag-smoothing so Lenis controls pacing entirely.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
    };
  }, [enableRootLenis]);

  if (!enableRootLenis) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false, // GSAP ticker drives the loop
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        syncTouch: false, // native momentum on touch devices
      }}
    >
      {children}
    </ReactLenis>
  );
}
