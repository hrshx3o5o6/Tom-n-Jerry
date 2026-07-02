# Example: Dark Mode

## User Goal

Add dark mode to the app.

## Naive Candidate Move

Build a custom `ThemeProvider`, context state, local storage sync, CSS variable system, and toggle component.

## Jerry Scan

**Type:** native

**Claim:** The app may already have Tailwind or CSS support for dark mode.

**Evidence:** Check for `tailwind.config.*`, existing `dark:` classes, CSS variables, or a design system theme config.

**Move:** Use the existing theme mechanism instead of building a custom provider.

**Risk:** Existing components may assume a fixed light palette.

**Receipt:** Verify both themes in browser screenshots or a focused UI test.

## Revised Move

Enable the existing framework or CSS dark-mode path, add the smallest toggle needed, and update only components that fail the receipt.

## Why This Is Street Smart

The agent does not need to prove it can architect theming. It needs to notice whether the stack already solved most of the problem.
