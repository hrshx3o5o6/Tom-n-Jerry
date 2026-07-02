---
name: browser-jerry
description: Maximize browser platform features (HTML5, Web APIs) before pulling in custom component libraries or NPM utilities.
triggers:
  - When building UI modals, dialogs, dropdowns, tooltips, or popovers
  - When adding client-side form validation
  - When dealing with animations, intersection tracking, or client-side storage
---

# Browser Jerry

Browser Jerry checks the native capabilities of the web platform before pulling in heavy third-party React, Vue, or npm libraries.

## Mission

Exploit the web platform. Modern browsers have native APIs for dialogs, date pickers, popovers, drag-and-drop, intersections, element queries, and local data storage. Use native HTML5 and browser APIs first.

---

## Explicit Triggers

This skill MUST be executed when:
1. Designing client-side interactive elements (e.g., modals, dropdowns, menus).
2. Implementing data persistence on the frontend (e.g., storing theme preferences, forms).
3. Adding libraries for validation, date management, scrolling, or drag-and-drop.

---

## Concrete Checks & Actions

1. **Verify Dialog/Overlay Affordances:**
   - Instead of building a stateful backdrop React modal or installing a library, check if `<dialog>` and the `.showModal()` API satisfy the requirements.
2. **Verify Popover/Tooltip Native APIs:**
   - Check if the HTML `popover` attribute can handle the positioning and auto-dismiss of menus or tooltips.
3. **Verify Intersection/Observer APIs:**
   - If tracking infinite scroll, lazy loading, or active sections, use `IntersectionObserver` instead of scroll listeners or custom NPM libraries.
4. **Verify Form Validation:**
   - Prefer HTML5 native validation (`required`, `pattern`, `:invalid` CSS selectors) before introducing library validators.
5. **Verify Storage API:**
   - Use `localStorage`, `sessionStorage`, or `IndexedDB` directly instead of adding state wrappers.

---

## Inline Scenario

* **Vague Plan (Naive):** "I need to add a popup confirmation modal. I will install `react-modal`, create a state hook for `isOpen`, style a custom backdrop overlay, handle escape key events, and lock background scrolling."
* **Jerry Opportunity Card:**
  - **Type:** native
  - **Claim:** The native HTML `<dialog>` element handles overlay, backdrop, scroll-lock, and escape-key dismissal automatically.
  - **Evidence:** Modern browser targets support `<dialog>` and the `::backdrop` pseudo-element.
  - **Move:** Create a simple `<dialog>` element ref in React and use `.showModal()` / `.close()`.
  - **Risk:** Styling the native backdrop requires using `dialog::backdrop`.
  - **Receipt:** Inspect DOM structure showing a single `<dialog>` element and check browser rendering.

---

## Antipattern Traps

- **Polyfill Bloat:** Using a native feature but then writing a massive custom polyfill layer. If compatibility targets are extremely old, check if native is viable first.
- **Accessibility Incompatibility:** Making native elements inaccessible by overriding native ARIA roles. Let the browser handle standard behaviors.

---

## Output

Emit an opportunity card of type `native` detailing:
1. The native browser API or HTML5 element to use.
2. The third-party NPM package or custom hooks it avoids.
3. The receipt verifying interface interaction.
