import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionTemplate } from "framer-motion";

export function SpotlightText({ children, className = "", textClassName = "" }) {
  const containerRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 85%", "end 45%"]
  });

  const gradientStop = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const maskImage = useMotionTemplate`linear-gradient(to bottom, black ${gradientStop}%, transparent calc(${gradientStop}% + 25%))`;

  const handleMouseMove = (e) => {
    if (isMobile || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => !isMobile && setIsHovered(true);
  const handleMouseLeave = () => !isMobile && setIsHovered(false);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative cursor-default select-none ${className}`}
    >
      {/* Base Layer (Gray) */}
      <h2 className={`text-[#A1A1AA] w-full font-heading font-medium ${textClassName}`}>
        {children}
      </h2>

      {/* Spotlight Layer (Green) */}
      {isMobile ? (
        <motion.h2
          className={`text-[#5D8B66] absolute inset-0 w-full font-heading font-medium pointer-events-none ${textClassName}`}
          style={{
            WebkitMaskImage: maskImage,
            maskImage: maskImage,
          }}
        >
          {children}
        </motion.h2>
      ) : (
        <h2
          className={`text-[#5D8B66] absolute inset-0 w-full font-heading font-medium pointer-events-none transition-opacity duration-300 ${textClassName}`}
          style={{
            opacity: isHovered ? 1 : 0,
            WebkitMaskImage: `radial-gradient(circle 400px at ${position.x}px ${position.y}px, black 10%, transparent 100%)`,
            maskImage: `radial-gradient(circle 400px at ${position.x}px ${position.y}px, black 10%, transparent 100%)`,
          }}
        >
          {children}
        </h2>
      )}
    </div>
  );
}
