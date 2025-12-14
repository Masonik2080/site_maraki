"use client";

import { useState, useCallback } from "react";

export function useEditorUI() {
  const [showPreview, setShowPreview] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const togglePreview = useCallback(() => setShowPreview((v) => !v), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  return {
    showPreview,
    sidebarOpen,
    togglePreview,
    toggleSidebar,
  };
}
