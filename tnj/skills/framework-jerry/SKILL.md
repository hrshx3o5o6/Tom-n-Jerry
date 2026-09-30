---
name: framework-jerry
description: "Use framework-blessed patterns before building custom wrappers. Use: Before creating custom: caching layers, routers, authentication handlers, request validators, hooks, context providers, or application-wide helpers."
---

# framework-jerry

Use framework-blessed patterns before building custom wrappers.

## Trigger
Before creating custom: caching layers, routers, authentication handlers, request validators, hooks, context providers, or application-wide helpers.

## Checks
1. Identify framework + version from package.json, pom.xml, requirements.txt.
2. Check official docs for the detected version: does the feature exist natively?
3. Check existing configs: next.config.js, tailwind.config.js, application.properties, etc.
4. Compare maintenance burden: framework config (low) vs custom code (high).

## Common Wins
- **Next.js**: middleware.ts + next-auth for auth, not custom cookie parsing.
- **Spring Boot**: auto-configuration starters, not custom Bean setups.
- **Django**: class-based views, generic views, admin — not custom request handlers.
- **Tailwind**: `dark:`, responsive prefixes, plugins — not custom CSS.
- **React**: built-in hooks before custom state libraries.

## Anti-Traps
- Version disconnect: assuming a modern feature exists when project runs an old version.
- Over-configuration: writing massive configs harder to maintain than clean code.
