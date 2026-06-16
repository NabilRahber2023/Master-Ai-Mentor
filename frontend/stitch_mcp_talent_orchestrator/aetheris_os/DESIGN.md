# Design System Strategy: Cinematic Intelligence

## 1. Overview & Creative North Star
The goal of this design system is to transcend the "SaaS dashboard" cliché. We are moving away from the cluttered, grid-heavy utility look and toward a **"Cinematic Intelligence"** aesthetic. 

The Creative North Star is **The Digital Observatory**. This system treats data and AI insights as celestial objects moving through a deep, vast space. We break the template look through **intentional atmospheric depth**: using high-contrast typography, wide-tracking labels, and asymmetrical layouts where large "hero" metrics breathe alongside condensed, complex data. We don't just display information; we curate an enterprise-grade experience that feels both futuristic and authoritative.

---

## 2. Colors & Surface Philosophy

### The Tonal Palette
The palette is rooted in the absence of light, using vibrant cyan as a "pulse" of intelligence.
- **Surface (`#101416`)**: Our canvas. A deep, saturated onyx that provides more warmth than pure black.
- **Primary (`#c3f5ff`) & Primary Container (`#00e5ff`)**: Used for "Active Intelligence"—actions, status indicators, and critical highlights.
- **Secondary (`#44d8f1`)**: Reserved for data visualizations and secondary interactive paths.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To separate a sidebar from a main feed, or a header from a body, use background color shifts (e.g., `surface-container-low` against `surface`). Boundaries must be felt, not seen.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers:
1.  **Level 0 (Base):** `surface` (#101416) – The main application background.
2.  **Level 1 (Nesting):** `surface-container-low` (#181c1e) – Used for sidebars or secondary panels.
3.  **Level 2 (Active Components):** `surface-container-highest` (#313538) – Used for cards or modals that require focus.

### The "Glass & Gradient" Rule
Floating elements (modals, tooltips, or elevated cards) must use **Glassmorphism**. Apply a semi-transparent `surface-variant` with a `backdrop-blur` of 12px–20px. For primary CTAs, use a linear gradient from `primary` to `secondary` to give buttons a "liquid light" feel rather than a flat fill.

---

## 3. Typography
We utilize a dual-typeface system to balance high-tech precision with human readability.

*   **Display & Headlines (Space Grotesk):** This is our "Editorial" voice. Space Grotesk’s geometric quirks convey a sense of engineering and future-proofing. Use `display-lg` for key metrics or welcome states to create an "Impact First" hierarchy.
*   **Body & Titles (Inter):** Our "Functional" voice. Inter provides maximum legibility at small sizes for data-heavy dashboard tables and property panels.
*   **The "Wide-Label" Aesthetic:** All `label-sm` and `label-md` tokens should be set to Uppercase with a letter-spacing of +5% to +10%. This evokes an "instrument panel" feel common in high-end aeronautic or enterprise software.

---

## 4. Elevation & Depth

### The Layering Principle
Hierarchy is achieved through **Tonal Layering**. Instead of shadows, place a `surface-container-lowest` card on top of a `surface-container-low` section. This "recessed" or "raised" look is achieved through value shifts of +/- 2% brightness.

### Ambient Shadows
Shadows must never be black. Use a tinted shadow:
- **Color:** `on-surface` at 6% opacity.
- **Blur:** 40px to 60px.
- **Spread:** -5px.
This creates a "glow" effect rather than a "drop" effect, making components appear to be floating in an illuminated environment.

### The "Ghost Border" Fallback
If an element risks blending into the background (e.g., in accessibility-critical areas), use a **Ghost Border**:
- **Token:** `outline-variant`
- **Opacity:** 15%
- **Width:** 1px
- **Effect:** Add a `0 0 8px` outer glow in the same color to mimic a thin light-filament.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `secondary`), 0.5rem (DEFAULT) roundedness, white text.
- **Secondary:** Transparent background with a `Ghost Border` and `primary` text.
- **Tertiary:** Text-only, uppercase labels with wide tracking.

### Cards (The "AI-Mentor" Style)
Cards should not have visible borders. Use `surface-container-high` and apply a subtle inner-glow on the top edge (1px top-border, `primary` at 10% opacity) to simulate overhead lighting. 

### Sidebar Navigation
- **Default State:** `on-surface-variant` text, no background.
- **Active State:** `primary` text. Use a vertical "light-bar" (2px wide) on the far left of the item, using the `primary_container` (#00e5ff) token.

### Input Fields
- **Idle:** `surface-container-highest` fill. No border.
- **Focus:** 1px `Ghost Border` in `primary` with a 4px outer glow. Labels should "float" above the field using the `label-sm` style.

### Data Visualization
Forbid the use of standard red/green/yellow unless for errors. Use the `tertiary` (Gold/Amber) scale for "Warnings" and `primary` (Cyan) for "Success/Growth." This maintains the high-end, bespoke color harmony.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use generous white space. An enterprise-grade dashboard should feel organized, not cramped.
- **Do** use "Scanning Lines." Subtle, 5% opacity horizontal lines can be used in the background of hero sections to reinforce the high-tech aesthetic.
- **Do** use minimalist iconography with thin (1.5px) stroke weights.

### Don't:
- **Don’t** use pure `#000000` for cards; it kills the depth. Use the `surface-container` tiers.
- **Don’t** use standard 1px solid dividers. Use a 24px or 32px vertical gap instead.
- **Don’t** use heavy "drop shadows." If a component doesn't pop through tonal shift, your surface colors are too close in value.
- **Don’t** use rounded corners larger than `xl` (1.5rem) for functional containers; keep the "full" roundness only for chips and tags.