# Tom n Jerry — Frontend Context Pack

Inject when: CWD contains `tailwind.config.js`, `postcss.config.js`, or `package.json` with react/vue/angular/svelte.

## Browser APIs (before JS libraries)
Check these native APIs before adding a library:
- `<dialog>` — modal dialogs. No need for headless UI or modal library.
- `<details>` / `<summary>` — expandable sections. No accordion library needed.
- `popover` — popovers, tooltips, menus. HTML standard as of 2024.
- `IntersectionObserver` — lazy loading, infinite scroll, visibility tracking.
- `localStorage` / `sessionStorage` — client-side persistence.
- `FormData` — form serialization without custom logic.
- `Intl` — date formatting, number formatting, pluralization, collation.
- Native `<input type="date|color|range|datetime-local">` — form controls.
- `Element.prototype.togglePopover()` / `showPopover()` / `hidePopover()`
- `CSS.container()` — container queries without polyfills.

## Tailwind CSS
- Use `dark:` prefix for dark mode — no custom CSS variables
- Use responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) — no custom media queries
- Use Tailwind plugins before custom CSS
- Check `tailwind.config.js` for existing theme extensions before adding new ones

## React Specific
- Use `useId()` for generating unique IDs — no `uuid` or custom counter
- Use `useDeferredValue()` for debouncing — no debounce library
- Use `useTransition()` for state transitions — no loading state boilerplate
- Check if `react-router-dom`, `react-query`, `zustand` already in lockfile before installing

## General
- CSS `scroll-behavior: smooth` before smooth-scroll libraries
- CSS `scroll-margin` before scroll-into-view libraries
- `prefers-color-scheme` media query for dark mode detection
- `@media (prefers-reduced-motion)` for accessibility
