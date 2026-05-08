---
name: Institutional Integrity
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#00174b'
  on-tertiary-container: '#497cff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Public Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Public Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1024px
  gutter: 24px
  margin: 32px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The brand personality is rooted in absolute discretion, professional authority, and psychological safety. As a whistleblower platform, the interface must minimize user anxiety by projecting stability and "official" status. The design style follows a **Modern Corporate** aesthetic with a heavy emphasis on structural clarity and high-contrast information hierarchy. It avoids unnecessary flourishes, opting instead for a "fortified" look that uses crisp lines and a subdued, trustworthy color palette to reassure users that their sensitive data is handled with institutional-grade security.

## Colors

The color palette is anchored by **Deep Navy** (#0F172A) for primary branding and headers, establishing an immediate sense of gravity and security. **Slate Blues** (#334155) are utilized for secondary elements and secondary navigation to provide visual depth without sacrificing the professional tone. 

The interface background remains a clean **White** or a very soft **Slate Gray** (#F8FAFC) to ensure maximum legibility and a clinical, organized feel. A bright **Safety Blue** (#2563EB) is reserved strictly for primary calls-to-action and active progress indicators, acting as a beacon of guidance through complex reporting workflows.

## Typography

**Public Sans** is selected for its institutional heritage and exceptional clarity. It bridges the gap between a government-standard typeface and a modern sans-serif. 

- **Headlines:** Use Bold weights to establish clear hierarchy in multi-step forms.
- **Body Text:** Use Regular weights with generous line heights to reduce cognitive load during the reporting process.
- **Labels:** Use Medium or Semi-Bold weights in all-caps for form labels to ensure they are distinct from user input.
- **System Feedback:** Error messages and security confirmations should use the Small Body size for precision.

## Layout & Spacing

The design system utilizes a **Fixed Grid** model centered on the screen to create a "contained" and secure environment. The maximum container width is restricted to 1024px to prevent scanning fatigue and ensure high readability of sensitive text. 

A strict 8px spacing rhythm ensures alignment across all form components. Multi-step forms should utilize a vertical "stack" rhythm with 48px between major sections and 24px between individual input fields, providing enough "breathing room" to make the process feel manageable and non-threatening.

## Elevation & Depth

To maintain an official and secure feel, this design system avoids excessive shadows and depth. It uses **Tonal Layers** and **Low-Contrast Outlines** to define hierarchy. 

- **Surface Levels:** The primary background is the lowest level. Card-based forms sit one level above, distinguished by a subtle 1px border (#E2E8F0) rather than a heavy shadow.
- **Active State Elevation:** Only primary buttons and active accordion panels may use a very soft, diffused ambient shadow (4% opacity Navy) to suggest interactability. 
- **Security Overlays:** Modals and sensitive confirmation dialogs use a 40% opacity Navy backdrop blur to isolate the user from the background data, emphasizing a "vaulted" experience.

## Shapes

The shape language is **Soft** (Level 1). This choice provides a subtle approachability while maintaining the crisp, disciplined lines required for a professional tool. 

- **Inputs and Buttons:** A 0.25rem corner radius provides a modern touch without appearing "bubbly" or informal.
- **Cards and Modals:** A 0.5rem (Large) radius is used for larger containers to create a distinct framing effect.
- **Progress Bars:** These should remain sharp or minimally rounded to reinforce the idea of a linear, methodical process.

## Components

### Buttons
Primary buttons are solid Navy with White text, communicating authority. Secondary buttons use a Slate Blue outline. The "Submit Report" button is the only element allowed to use the Safety Blue primary color to signal finality and progress.

### Inputs & Multi-step Forms
Inputs feature clear, 1px Slate borders that thicken to 2px when focused. Labels must always be visible (never floating) to ensure the user always knows what data is being requested. Stepper components should be placed at the top, showing a clear, numbered path (e.g., "1. Incident Details", "2. Evidence", "3. Final Review").

### Accordions
Used for FAQs and secondary policy information. When expanded, the accordion should have a subtle Slate-100 background tint to visually group the related content and separate it from the main flow.

### Status Badges
High-contrast chips with descriptive icons (e.g., a shield for "Encrypted", a lock for "Private"). These are essential for reassuring the user of the system's security at every step.

### Progress Indicators
A simple, horizontal track at the top of the reporting flow. It should be segmented rather than fluid to show the user exactly how many "gates" remain in the process.