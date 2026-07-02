# Opportunity Cards

Opportunity cards are the standard output format for Jerry skills.

They turn vague shortcut instincts into reviewable claims.

## Format

- **Type:** reuse | native | delete | shell | history | dependency | trap | defer | receipt
- **Claim:** The opportunity the skill noticed.
- **Evidence:** Files, commands, docs, dependencies, or observations that support the claim.
- **Move:** The recommended next action.
- **Risk:** What could go wrong if we take the shortcut.
- **Receipt:** How to verify the move worked.

## Example

**Type:** native

**Claim:** Tailwind already supports dark mode.

**Evidence:** `tailwind.config.*` exists and components already use `dark:` classes.

**Move:** Enable class-based dark mode and add a small toggle.

**Risk:** Existing theme assumptions may conflict.

**Receipt:** Verify both themes in a browser screenshot or UI test.

## Rules

- Emit one to three cards, not a long essay.
- Treat each card as a falsifiable claim.
- Cite evidence before recommending a shortcut.
- Include a receipt that can be checked by the host agent.
- If no useful opportunity exists, say so plainly and let momentum continue.
