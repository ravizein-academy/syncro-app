"use client";

import React from "react";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = "" }: ThemeToggleProps) {
  // Dark mode has been completely removed - returning null to disable toggle
  return null;
}
