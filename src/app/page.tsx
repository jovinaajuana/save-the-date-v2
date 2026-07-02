"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimation, useReducedMotion } from "framer-motion";

// Shared easing curve used for overlay transitions
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

type OverlayInit = { x: number; y: number; scale: number; w: number; h: number };

export default function SaveTheDate() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [overlayInit, setOverlayInit] = useState<OverlayInit | null>(null);
  const letterControls = useAnimation();
  const letterImgRef = useRef<HTMLImageElement>(null);
  const busy = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [titleDone, setTitleDone] = useState(false);
  useEffect(() => setMounted(true), []);

  const openEnvelope = async () => {
    if (busy.current || isExpanded) return;
    busy.current = true;

    setIsOpen(true);
    setHasOpened(true);
    await wait(120);

    await letterControls.start({
      y: "-80%",
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { type: "spring", duration: 0.5, bounce: 0.12 },
    });

    // Measure where the letter sits right now so the overlay img can start there.
    if (letterImgRef.current) {
      const rect = letterImgRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const aspect = rect.width / rect.height;
      const maxW = vw * 0.88;
      const maxH = vh * 0.88;
      const w = Math.min(maxW, maxH * aspect);
      const h = w / aspect;
      // Offset of source center from viewport center (what x/y must be to place
      // the overlay img on top of the source before the spring starts).
      const x = rect.left + rect.width / 2 - vw / 2;
      const y = rect.top + rect.height / 2 - vh / 2;
      setOverlayInit({ x, y, scale: rect.width / w, w, h });
    }

    setIsExpanded(true);
    busy.current = false;
  };

  const closeToEnvelope = async () => {
    if (busy.current) return;
    busy.current = true;

    setIsClosing(true);
    setIsExpanded(false);

    await wait(prefersReducedMotion ? 0 : 310);
    letterControls.set({ y: "-15%" });
    await wait(60);

    setIsOpen(false);
    // Keep source hidden until the sandwich has faded to avoid a flash.
    await wait(prefersReducedMotion ? 0 : 120);
    setIsClosing(false);
    busy.current = false;
  };

  return (
    <main className="relative w-screen h-svh flex flex-col items-center justify-center select-none">

      {/* Title — handwriting sweep, floats above envelope without affecting flex centering */}
      <div
        className="absolute pointer-events-none"
        style={{ left: "50%", transform: "translateX(-50%)", bottom: "calc(50% + 215px)" }}
      >
        <motion.p
          className="whitespace-nowrap"
          style={{
            fontFamily: "'Atma', cursive",
            color: "#262E58",
            fontSize: "44px",
            padding: "8px 12px 16px",
          }}
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={mounted ? { clipPath: "inset(0 0% 0 0)" } : { clipPath: "inset(0 100% 0 0)" }}
          transition={{ duration: 1.6, delay: 0.3, ease: [0.2, 0, 0.3, 1] }}
          onAnimationComplete={() => setTitleDone(true)}
        >
          You've got mail!
        </motion.p>
      </div>

      <motion.div
        className="relative cursor-pointer"
        style={{
          width: "min(300px, 80vw)",
          aspectRatio: "324 / 379",
          zIndex: isExpanded ? 25 : 1,
        }}
        initial={{ opacity: 0, filter: "blur(16px)" }}
        animate={!mounted || !titleDone
          ? { opacity: 0, filter: "blur(16px)", x: 0, y: 0, scale: 1, rotate: 0 }
          : isExpanded
            ? { x: "-30vw", y: "40vh", scale: 0.38, rotate: 35, opacity: 1, filter: "blur(0px)" }
            : { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, filter: "blur(0px)" }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : {
                type: "spring", duration: 0.5, bounce: 0.1,
                opacity: { duration: 1.5, ease: [0.23, 1, 0.32, 1] },
                filter: { duration: 1.5, ease: [0.23, 1, 0.32, 1] },
              }
        }
        whileTap={!isExpanded
          ? { scale: 0.97, transition: { type: "spring", stiffness: 400, damping: 30 } }
          : undefined
        }
        onClick={openEnvelope}
      >
        {/* ── Closed envelope ── */}
        <motion.div
          className="absolute inset-0 flex items-end justify-center"
          animate={{
            opacity: isOpen ? 0 : 1,
            scale: isOpen ? 0.96 : 1,
            y: isOpen ? -6 : 0,
          }}
          transition={{ duration: 0.28, ease: [0.4, 0, 1, 1] }}
          style={{ pointerEvents: isOpen ? "none" : "auto" }}
        >
          <img
            src="/Envelope-closed.png"
            alt="A sealed envelope — tap to open"
            className="h-auto"
            style={{ width: "324px" }}
          />
        </motion.div>

        {/* ── Open envelope sandwich ── */}
        <motion.div
          className="absolute inset-0 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{
            duration: 0.3,
            delay: isOpen ? 0.1 : 0,
            ease: [0, 0, 0.2, 1],
          }}
          style={{ pointerEvents: isOpen ? "auto" : "none" }}
        >
          <div className="relative" style={{ width: "324px" }}>
            <img
              src="/Evelope-open.png"
              alt=""
              className="w-full h-auto"
            />

            <motion.div
              className="absolute top-0 z-[2]"
              style={{ left: "50%", width: "82%" }}
              initial={{ x: "-50%", y: "-15%" }}
              animate={letterControls}
            >
              <img
                ref={letterImgRef}
                src="/Letter.png"
                alt="Save the date invitation"
                className="block w-full h-auto"
                style={{ visibility: isExpanded || isClosing ? "hidden" : "visible" }}
              />
            </motion.div>

            <img
              src="/Evelope-open.png"
              alt=""
              className="absolute inset-0 w-full h-full z-[3]"
              style={{ objectFit: "fill", clipPath: "inset(42% 0 0 0)" }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Tap hint */}
      <motion.p
        className="mt-16 text-[24px] tracking-[0.2em] uppercase"
        style={{ color: "rgba(70,55,40,0.5)", fontFamily: "Georgia, serif" }}
        initial={{ opacity: 0, filter: "blur(16px)" }}
        animate={{ opacity: !mounted || !titleDone || hasOpened ? 0 : 1, filter: !mounted || !titleDone || hasOpened ? "blur(16px)" : "blur(0px)" }}
        transition={{ duration: 0.3, opacity: { duration: 1.5, delay: 0.5, ease: [0.23, 1, 0.32, 1] }, filter: { duration: 1.5, delay: 0.5, ease: [0.23, 1, 0.32, 1] } }}
      >
        tap to open
      </motion.p>

      {/* ── Full-screen letter ── */}
      <AnimatePresence>
        {isExpanded && overlayInit && (
          <>
            {/* z-20: cream background */}
            <motion.div
              key="bg"
              className="fixed inset-0 z-20 cursor-pointer"
              style={{
                backgroundColor: "#f0ebe0",
                backgroundImage: "url('/bg-texture.png')",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundBlendMode: "multiply",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              onClick={closeToEnvelope}
            />

            {/* z-30: THE single letter element. Starts at the source's measured
                screen position (x/y/scale), springs to fullscreen center.
                No second copy anywhere, no opacity transitions on the source. */}
            <motion.img
              key="letter"
              src="/Letter.png"
              alt="We're getting married! Justine & Mike"
              className="fixed z-30 cursor-pointer"
              style={{
                inset: 0,
                margin: "auto",
                width: overlayInit.w,
                height: overlayInit.h,
                objectFit: "contain",
              }}
              initial={prefersReducedMotion
                ? { opacity: 0 }
                : { x: overlayInit.x, y: overlayInit.y, scale: overlayInit.scale, opacity: 1 }
              }
              animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
              onClick={closeToEnvelope}
            />
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
