import React, { useRef, useState } from "react";

export function SpotlightText({ children, className = "", textClassName = "" }) {
  const containerRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

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
    </div>
  );
}
