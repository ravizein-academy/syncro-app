"use client";

import React from "react";

interface ItsecLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  subtitle?: string;
}

export function ItsecLogo({
  className = "",
  size = "md",
}: ItsecLogoProps) {
  const heights = {
    sm: "h-7 sm:h-8",
    md: "h-8 sm:h-9",
    lg: "h-10 sm:h-11",
  };

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src="/images/syncro-logo.png"
        alt="Syncro"
        className={`${heights[size]} w-auto object-contain`}
      />
    </div>
  );
}
