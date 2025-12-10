"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import "./MagicBento.css";

// ⚙️ Core config defaults
const DEFAULT_PARTICLE_COUNT = 14;
const DEFAULT_SPOTLIGHT_RADIUS = 400;
const DEFAULT_GLOW_COLOR = "79,124,167"; // brand blue
const MOBILE_BREAKPOINT = 768;

// 🎯 Prospra custom card set
const cardData = [
  {
    color: "rgba(26,41,66,0.9)", // brand navy
    title: "AI Mentor",
    description: "Ask anything. Get expert guidance, 24/7.",
    label: "Prospra Intelligence",
    icon: "🤖",
    href: "/chat",
  },
  {
    color: "rgba(26,41,66,0.9)",
    title: "Daily Journal",
    description: "Reflect, track progress, and sync your mind.",
    label: "MindSync",
    icon: "📝",
    href: "/journal",
  },
  {
    color: "rgba(26,41,66,0.9)",
    title: "Documents Vault",
    description: "Upload, organize, and revisit key assets.",
    label: "Vault",
    icon: "📂",
    href: "/documents",
  },
  {
    color: "rgba(26,41,66,0.9)",
    title: "Business Roadmap",
    description: "Your personalized entrepreneurial flight plan.",
    label: "Roadmap",
    icon: "🧭",
    href: "/roadmap",
  },
  {
    color: "rgba(26,41,66,0.9)",
    title: "Tools Library",
    description: "Frameworks, templates, and growth playbooks.",
    label: "Launchpad",
    icon: "🧰",
    href: "/launch-pad/resources",
  },
  {
    color: "rgba(26,41,66,0.9)",
    title: "Growth Coach",
    description: "Accountability, reflection, and next moves.",
    label: "Performance",
    icon: "🚀",
    href: "/coach",
  },
];

function MagicBento({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = true,
  enableMagnetism = true,
  clickEffect = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
}) {
  const wrapperRef = useRef(null);

  // 🌀 Hover tilt + magnetism
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || window.innerWidth < MOBILE_BREAKPOINT) return;

    const cards = wrapper.querySelectorAll(".magic-bento-card");

    const handleMove = (e) => {
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const midX = rect.width / 2;
        const midY = rect.height / 2;

        const rotateX = enableTilt ? -(y - midY) / 20 : 0;
        const rotateY = enableTilt ? (x - midX) / 20 : 0;

        const dx = (x - midX) / 15;
        const dy = (y - midY) / 15;

        gsap.to(card, {
          rotateX,
          rotateY,
          x: enableMagnetism ? dx : 0,
          y: enableMagnetism ? dy : 0,
          transformPerspective: 800,
          transformOrigin: "center",
          duration: 0.25,
          ease: "power2.out",
        });
      });
    };

    const reset = () => {
      gsap.to(cards, {
        rotateX: 0,
        rotateY: 0,
        x: 0,
        y: 0,
        duration: 0.35,
        ease: "power3.out",
      });
    };

    wrapper.addEventListener("mousemove", handleMove);
    wrapper.addEventListener("mouseleave", reset);

    return () => {
      wrapper.removeEventListener("mousemove", handleMove);
      wrapper.removeEventListener("mouseleave", reset);
    };
  }, [enableTilt, enableMagnetism]);

  // ✨ Click pulse
  const handleClick = (e, href) => {
    if (clickEffect) {
      const card = e.currentTarget;
      gsap.fromTo(
        card,
        { scale: 0.97 },
        { scale: 1, duration: 0.25, ease: "power2.out" }
      );
    }
    if (href) {
      window.location.href = href;
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="magic-bento-wrapper"
      style={{ "--magic-glow-color": glowColor }}
    >
      {enableSpotlight && (
        <div
          className="magic-bento-spotlight"
          style={{ "--spotlight-radius": `${spotlightRadius}px` }}
        />
      )}

      {enableStars && (
        <div className="magic-bento-stars">
          {Array.from({ length: particleCount }).map((_, i) => (
            <span key={i} className="magic-bento-star" />
          ))}
        </div>
      )}

      <div className="magic-bento-grid">
        {cardData.map((item, idx) => (
          <div
            key={idx}
            className={`magic-bento-card ${
              enableBorderGlow ? "magic-bento-card-glow" : ""
            }`}
            style={{ backgroundColor: item.color }}
            onClick={(e) => handleClick(e, item.href)}
          >
            <div className="magic-bento-card-inner">
              <div className="magic-bento-card-header">
                <span className="magic-bento-icon">{item.icon}</span>
                <span className="magic-bento-label">{item.label}</span>
              </div>

              <h3 className="magic-bento-title">{item.title}</h3>

              <p
                className={`magic-bento-description ${
                  textAutoHide ? "magic-bento-description-fade" : ""
                }`}
              >
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MagicBento;

