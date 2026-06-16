---
name: Aetheric Intelligence
colors:
  surface: '#0d1516'
  surface-dim: '#0d1516'
  surface-bright: '#333a3c'
  surface-container-lowest: '#080f11'
  surface-container-low: '#151d1e'
  surface-container: '#192122'
  surface-container-high: '#242b2d'
  surface-container-highest: '#2e3638'
  on-surface: '#dce4e5'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#dce4e5'
  inverse-on-surface: '#2a3233'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#49d8ea'
  on-secondary: '#00363c'
  secondary-container: '#00b7c8'
  on-secondary-container: '#004249'
  tertiary: '#dfeff8'
  on-tertiary: '#243239'
  tertiary-container: '#c3d3db'
  on-tertiary-container: '#4c5b62'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#91f1ff'
  secondary-fixed-dim: '#49d8ea'
  on-secondary-fixed: '#001f23'
  on-secondary-fixed-variant: '#004f57'
  tertiary-fixed: '#d5e5ed'
  tertiary-fixed-dim: '#b9c9d1'
  on-tertiary-fixed: '#0f1d24'
  on-tertiary-fixed-variant: '#3a4950'
  background: '#0d1516'
  on-background: '#dce4e5'
  surface-variant: '#2e3638'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-md:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: '0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style
The design system embodies a premium, futuristic AI aesthetic tailored for high-level academic research and enterprise insights. It balances a deep, "void-space" atmosphere with razor-sharp neon precision.

The style is a hybrid of **High-End Glassmorphism** and **Cyber-Tech Minimalism**. It evokes a sense of advanced intelligence through high-contrast typography, vast negative space, and translucent surfaces that feel like floating HUD elements. The emotional response is one of authority, cutting-edge innovation, and sophisticated clarity.

## Colors
The palette is rooted in a deep obsidian base to provide maximum contrast for neon accents. 

- **Primary & Secondary:** A cyan-to-teal spectrum used exclusively for interactive elements, status indicators, and data visualizations. 
- **Neutrals:** Grays are slightly cool-tinted to maintain the "tech" atmosphere, moving from pure white for high-readability headers to muted slate for metadata.
- **Glass Effects:** Overlays use a semi-transparent cyan tint (`rgba(0, 229, 255, 0.05)`) to bridge the gap between the dark background and bright accents.

## Typography
The system uses a pairing of **Manrope** for high-impact headlines and **Inter** for functional body text. 

Headlines are tight, bold, and authoritative, utilizing negative letter-spacing to create a "machined" look. Body text prioritizes legibility with generous line heights. Small labels should frequently use uppercase and slightly wider tracking to mimic technical readouts.

## Layout & Spacing
This design system employs a **Fluid Grid** model with high-breathability margins inspired by premium hardware interfaces.

- **Grid:** 12-column system for desktop, 4-column for mobile.
- **Rhythm:** An 8px linear scale (8, 16, 24, 32, 48, 64, 80).
- **White Space:** Information density should be kept low to medium. Use large 80px or 120px vertical sections to separate major content blocks, creating an "Apple-level" sense of focus and calm.

## Elevation & Depth
Depth is created through **refractive layering** rather than traditional drop shadows.

1.  **Base Layer:** `#05090C` pure dark.
2.  **Surface Layer (Cards):** `rgba(8, 23, 29, 0.85)` with `backdrop-filter: blur(20px)`.
3.  **Borders:** Subtle `1px` solid `rgba(0, 229, 255, 0.15)` to define edges without adding visual weight.
4.  **Accents:** Soft cyan "blobs" (`rgba(0, 229, 255, 0.08)`) placed behind key cards to create a volumetric glow effect.

## Shapes
The design system uses a **Rounded** language to soften the futuristic "cyber" edges, making the tool feel approachable despite its technical power. 

- **Standard Elements:** 8px radius (Buttons, Inputs).
- **Containers/Cards:** 24px radius for a distinct, modern dashboard feel.
- **Micro-elements:** 4px radius (Tooltips, small Tags).

## Components

- **Primary Buttons:** High-gloss gradient from `#00E5FF` to `#00B8C9`. Include a outer glow `0 0 15px rgba(0, 229, 255, 0.4)` on hover. Text should be black for maximum contrast on the bright background.
- **Secondary Buttons:** Ghost style with a `1px` cyan border and subtle `rgba(0, 229, 255, 0.05)` fill.
- **Cards/Widgets:** Use the glassmorphism recipe: dark semi-transparent fill, 24px corner radius, and a faint cyan top-down stroke to simulate light catching the edge of a glass pane.
- **Inputs:** Darker than the card background (`#020405`), with a cyan focus ring that glows subtly.
- **Chips/Badges:** Small, high-contrast pills with `0.5em` letter spacing. Use `rgba(0, 229, 255, 0.1)` background with cyan text.
- **Data Visualization:** Use thin lines, neon points, and soft area gradients. Avoid heavy solid fills.