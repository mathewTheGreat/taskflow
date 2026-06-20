# TaskFlow UI Standards

## Design goals

- Elegant, calm, and professional
- Soft gradients, generous spacing, and subtle shadows
- Clear hierarchy for forms and actions
- Consistent spacing, rounded corners, and refined typography

## Color palette

- Primary brand: `var(--color-brand-500)`
- Accent: `var(--color-accent-500)`
- Background: `var(--color-surface-tertiary)`
- Surface: `var(--color-surface)`
- Border: `var(--color-border-strong)`
- Text primary: `var(--color-text-primary)`
- Text secondary: `var(--color-text-secondary)`

## Auth page standards

- Full-screen centered panel with subtle radial background accents.
- Use `auth-page`, `auth-page__panel`, `auth-brand`, and `auth-card` classes.
- Form sections should use large, rounded cards with soft borders and shadows.
- Header text should be strong and clear, with supporting subtitle copy.
- Inputs should be `rounded-xl`, with clear focus states and gentle inner shadows.
- Primary actions should be prominent with `rounded-xl` buttons and consistent padding.

## Spacing

- Use consistent spacing units: `1rem`, `1.5rem`, `2rem` for layout gaps.
- Form fields should stack with `1rem` vertical rhythm.
- Cards should use `var(--radius-xl)` for a polished, modern feel.

## Typography

- Use a clean system font stack.
- Heading weights should be bold and easy to scan.
- Body copy should remain readable at `0.95rem` to `1rem`.

## Components

### Buttons

- Use `rounded-xl` and `font-semibold`.
- Primary button should have a strong brand fill and smooth hover.
- Secondary buttons should use transparent or soft surface variants.

### Inputs

- Use generous padding and subtle border color.
- Focus ring should be brand-colored with a transparent glow.
- Placeholder text should remain low-contrast but legible.

## Implementation notes

- The auth page now uses a dedicated style section in `src/renderer/index.css`.
- Shared form component styles are updated in `src/renderer/components/ui/Input.tsx`.
- Buttons now use a more elegant `rounded-xl` form factor in `src/renderer/components/ui/Button.tsx`.
- The login page uses the new standardized auth classes and layout in `src/renderer/pages/Login.tsx`.
