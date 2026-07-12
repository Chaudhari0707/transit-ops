"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { type LenisRef, ReactLenis } from "lenis/react";

/**
 * SmoothScroll
 *
 * Drop-in provider that enables Lenis smooth scrolling across the whole page.
 * It syncs the Lenis RAF loop with the GSAP ticker so that GSAP animations
 * (ScrollTrigger, etc.) stay frame-perfect with the virtual scroll position.
 *
 * Usage — wrap your layout body once:
 *
 *   <SmoothScroll>{children}</SmoothScroll>
 *
 * To opt a specific element out of smooth scrolling add:
 *   data-lenis-prevent           – block all scroll propagation
 *   data-lenis-prevent-wheel     – block wheel events only
 *   data-lenis-prevent-touch     – block touch events only
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    // Disable GSAP's own lag-smoothing so Lenis controls pacing entirely.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
    };
  }, []);

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
