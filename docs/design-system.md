# Fat2Fit - Design System

## Pattern
* **Name:** Feature-Rich + Data
* **CTA:** Above fold
* **Sections:**
  1. Hero
  2. Features
  3. CTA

## Style
* **Name:** Vibrant & Block-based
* **Mode Support:** Light & Dark Full Support (Defaults to immersive dark mode for SweatSnap)
* **Keywords:** Bold, energetic, playful, block layout, geometric shapes, high color contrast, duotone, modern, energetic
* **Best For:** Startups, creative agencies, gaming, social media, youth-focused, entertainment, consumer
* **Performance:** ⚡ Good | **Accessibility:** ◐ Ensure WCAG Contrast

## Colors
Our core palette uses an energetic orange paired with a success green, set against a deep dark background to make the action pop.

* **Primary:** `#F97316` (`--color-primary`)
* **On Primary:** `#0F172A` (`--color-on-primary`)
* **Secondary:** `#FB923C` (`--color-secondary`)
* **Accent/CTA:** `#22C55E` (`--color-accent`)
* **Background:** `#020617` (`--color-background`)
* **Foreground:** `#F8FAFC` (`--color-foreground`)
* **Muted:** `#37414F` (`--color-muted`)
* **Border:** `#374151` (`--color-border`)
* **Destructive:** `#EF4444` (`--color-destructive`)
* **Ring:** `#F97316` (`--color-ring`)

## Typography
We use **Barlow Condensed** and **Barlow** for a sports, athletic, and action-oriented mood.

* **Mood:** Sports, fitness, athletic, energetic, condensed, action
* **Google Fonts Import:**
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&display=swap');
  ```
* **Best For:** Sports, fitness, gyms, athletic brands, competition

## Key Effects & Gamification
To achieve the futuristic and highly gamified look, we apply the following interactive effects:
* Large sections (48px+ gaps)
* Animated backgrounds and noise patterns
* Bold hover effects (color shifts, scaling)
* Scroll-snap (where applicable)
* Large type (32px+ for key metrics and combo counters)
* 150-300ms animation durations for snappy feedback
* Particle effects or subtle shadows (`shadow-[0_0_40px_rgba(249,115,22,0.3)]`) to emphasize action

## Anti-Patterns to Avoid
* Static design with no gamification or feedback
* Low-contrast grays for primary text

## Pre-Delivery Checklist
* [ ] No emojis as icons (use SVG: Lucide)
* [ ] `cursor-pointer` on all clickable elements
* [ ] Hover states with smooth transitions (150-300ms)
* [ ] Focus states visible for keyboard nav
* [ ] `prefers-reduced-motion` respected
* [ ] Responsive: 375px, 768px, 1024px, 1440px
