# Copilot Instructions for Elwin's Portfolio Site

## Architecture Overview

This is a **vanilla HTML/CSS/JavaScript single-page portfolio**—no build tools, no frameworks, no dependencies. The entire site is self-contained and renders directly in the browser.

### File Structure
- **index.html** - Main document structure; contains all page sections (intro, about, interests, projects, experience, contact) with semantic HTML and ARIA labels for accessibility
- **style.css** - Complete visual design with:
  - CSS custom properties for theming (colors, spacing, animations)
  - Fluid typography using `clamp()` for responsive scaling
  - Grid-based card layouts
  - Interactive animations (divider scrolling, interest card effects, game canvas)
- **main.js** - Interactive features bundled in a single IIFE (immediately invoked function expression):
  - Divider ticker (horizontally scrolling repeating text)
  - Mobile menu toggle with accessibility
  - Contact form integration (Formspree)
  - Interest card animations with cooldown throttling
  - Mini 2D fly-catch game (Canvas API)
  - Cursor-reactive tesseract rotation
  - Theme color randomization on load

### Design System
- **Colors**: Dark cyberpunk theme with three accent colors (neon green, blue, purple) randomly selected per session
- **Typography**: Poppins font with fluid sizing (scales with viewport)
- **Spacing**: CSS variable-based padding using `clamp()` for responsive scaling
- **Cards**: Grid-based layout with consistent visual hierarchy

## Key Conventions

### JavaScript Patterns
- **Namespace isolation**: All code runs in a single IIFE to avoid global pollution
- **State management**: Divider state is tracked in a `dividerStates` array; effect cooldowns use `WeakMap` and `Map`
- **Event handling**: Prefer `addEventListener` with named functions for clarity; use `preventDefault()` for forms
- **Canvas API**: DPI-aware scaling with `devicePixelRatio` for crisp rendering on high-DPI displays
- **Performance**: 
  - `requestAnimationFrame` for smooth 60fps animations
  - Throttle cooldowns on effects (700ms buffer after animation)
  - Rebalance divider items on each frame to cleanup offscreen elements

### CSS Conventions
- **Fluid sizing**: Use `clamp()` for responsive scaling instead of media queries where possible
- **Custom properties**: Define all colors, spacing, and animation values as CSS variables at `:root`
- **Animation timing**: Match CSS animation duration with JavaScript timeout for consistency (e.g., `effectDurations` in JS)
- **Accessibility**: Use `aria-label`, `aria-expanded`, `aria-live` for interactive components

### HTML Conventions
- **Semantic markup**: Use `<section>`, `<article>`, `<nav>`, `<main>` appropriately
- **Form accessibility**: Link all `<input>` and `<textarea>` with `<label>` elements; include `required` attributes
- **Data attributes**: Use `data-*` attributes for JavaScript hooks (e.g., `data-effect`, `data-text`)

## Development Notes

### No Build Tools Required
This site is production-ready as-is. Simply open `index.html` in a browser—no npm, no bundler, no compilation.

### When Modifying Interactions
- **Divider ticker**: Adjust `dividerSpeed` constant (px/second) and check `initDividerTicker()` logic
- **Interest card effects**: Update `effectDurations` object to match new CSS animation durations; ensure `effectCooldownBuffer` provides adequate spacing
- **Mini fly game**: Modify fly speed, canvas size calculations, or scoring logic in `initMiniFlyGame()`
- **Theme colors**: Add or modify colors in `:root` CSS variables; randomization happens in `window.programLoaded()`

### When Modifying Styles
- Keep all responsive behavior in CSS `clamp()` rather than JavaScript media query listeners
- Ensure animation durations in CSS match JavaScript timeout values for seamless UX
- Update CSS variable calculations in `syncEffectMetrics()` when visual element sizes change

### Mobile Considerations
- Mobile menu is hidden by default; toggled with `mobileMenuToggle` button above 760px viewport width
- Touch events on canvas game use `touchstart` with `preventDefault()` to avoid scroll interference
- All text scaling and card spacing respond fluidly to viewport size

### Form Integration
Contact form posts to Formspree (`https://formspree.io/f/mykqpgzr`). Update the `action` attribute in the form if changing email providers.

## Testing & Verification

There are no automated tests. Verify changes manually by:
1. Opening `index.html` in a browser (desktop and mobile)
2. Testing all interactive features:
   - Navigation menu (desktop and mobile)
   - Divider scrolling (both directions)
   - Interest card hover animations
   - Mini fly game (click/tap to play)
   - Contact form submission
   - Cursor-reactive tesseract rotation
3. Checking responsive behavior at breakpoints (760px mobile threshold)
4. Validating HTML with a validator (e.g., https://validator.w3.org/)
