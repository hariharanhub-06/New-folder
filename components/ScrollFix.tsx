"use client";

import { useEffect } from "react";

/**
 * ScrollFix prevents numeric input values from changing when the user scrolls 
 * over them with a mouse wheel. This improves UX by preventing accidental 
 * value modifications during page navigation.
 */
export default function ScrollFix() {
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            const target = e.target as HTMLElement;
            // If it's a number input and currently focused, prevent scroll-to-change
            if (
                target instanceof HTMLInputElement &&
                target.type === "number" &&
                document.activeElement === target
            ) {
                // Blur the element to stop the native scroll handling on the input
                target.blur();
            }
        };

        // Add event listener with passive: false to allow potential preventDefault if needed,
        // though blurring is more effective for preventing value changes.
        window.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            window.removeEventListener("wheel", handleWheel);
        };
    }, []);

    return null;
}
