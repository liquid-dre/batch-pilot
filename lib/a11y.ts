import type { KeyboardEvent } from "react";

/**
 * Makes a non-button element (e.g. a table row) behave like a button for
 * keyboard users: focusable, activatable with Enter/Space, announced as a
 * button. Spread onto the element alongside the visual `cursor-pointer`.
 */
export function rowActivation(onActivate: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    },
  };
}
