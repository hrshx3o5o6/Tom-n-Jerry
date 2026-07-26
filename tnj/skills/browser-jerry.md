# browser-jerry

Use native browser APIs before pulling npm libraries.

## Trigger
Before adding libraries for: modals, dialogs, dropdowns, tooltips, popovers, form validation, animations, intersection tracking, lazy loading, client-side storage.

## Native First Checklist
1. **Dialogs/Modals**: `<dialog>` + `.showModal()` / `.close()` — handles backdrop, scroll-lock, escape key automatically.
2. **Popovers/Tooltips**: HTML `popover` attribute — handles positioning and auto-dismiss.
3. **Intersection**: `IntersectionObserver` — for infinite scroll, lazy loading, active sections. No scroll listeners.
4. **Form validation**: HTML5 `required`, `pattern`, `:invalid` CSS selectors — before library validators.
5. **Storage**: `localStorage`, `sessionStorage`, `IndexedDB` — before state wrapper libraries.
6. **Date formatting**: `Intl.DateTimeFormat` — before moment/date-fns.

## Action
If native API covers the requirement → use it. Emit Opportunity Card (type: native).

## Anti-Traps
- Polyfill bloat: using native then writing massive custom polyfills.
- Accessibility: do not override native ARIA roles.
