"use client"

import { useEffect } from "react";

/**
 * A small utility component to programmatically clear onboarding
 * and task-related states from local and session storage.
 */
export default function OnboardingCleanup() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Clear common storage keys used for onboarding state
      const keysToClear = [
        "onboarding_completed",
        "guided_task_state",
        "task_progress",
        "show_pass_prompt",
        "onboarding_step"
      ];

      keysToClear.forEach(key => {
        localStorage.setItem(key, "true"); // Or "completed"
        sessionStorage.removeItem(key);
      });

      // Specific request: mark onboarding as "Completed"
      localStorage.setItem("onboarding_status", "Completed");
      localStorage.setItem("project_state", "ready");
      
    } catch (e) {
      // Fail silently to ensure main app logic isn't affected
    }
  }, []);

  return null;
}
