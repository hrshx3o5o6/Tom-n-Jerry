---
name: framework-jerry
description: Use before custom abstractions to find framework-native behavior, conventions, utilities, and configuration.
triggers:
  - Before creating custom routing, caching, validation, or styling solutions
  - Before writing custom hooks or context providers in web frameworks
  - When modifying framework files (e.g., config.js, next.config, spring context)
---

# Framework Jerry

Framework Jerry prefers the framework's blessed path before inventing custom wrappers, providers, services, routers, validators, or caching schemes.

## Mission

Exploit framework affordances. Don't build custom components or middleware if the underlying framework (React, Angular, Spring Boot, NestJS, Next.js, Django, etc.) already provides it out of the box.

---

## Explicit Triggers

This skill MUST be executed when:
1. Proposing a custom caching layer, router, authentication handler, or request validator.
2. Creating complex, application-wide helper modules or wrappers.
3. Custom-building visual behaviors like transitions, dark mode, or forms.

---

## Concrete Checks & Actions

1. **Identify Framework Capabilities:**
   - Scan manifest files (`package.json`, `pom.xml`, etc.) to map out the framework version.
   - Look up official documentation for the framework version to see if the target feature is native.
2. **Review Existing Architecture:**
   - Search the project for existing configurations (e.g., `next.config.js`, `tailwind.config.js`, `application.properties`) to see what conventions are configured.
3. **Compare Effort:**
   - Weigh standard configuration/conventions (low maintenance) against a custom-built solution (high maintenance).

---

## Inline Scenario

* **Vague Plan (Naive):** "I will write a custom authentication middleware in my Next.js project that checks cookies, decodes jwt tokens, verifies expiry, and handles page redirects."
* **Jerry Opportunity Card:**
  - **Type:** native
  - **Claim:** Next.js and next-auth already provide built-in middleware configurations that handle callback validation and redirection automatically.
  - **Evidence:** `next-auth` is listed in dependencies; config exists under `/api/auth/[...nextauth]`.
  - **Move:** Configure Next.js native `middleware.ts` targeting protected pages using the existing next-auth config.
  - **Risk:** Custom redirects might need to be ported to the middleware config.
  - **Receipt:** Request page `/dashboard` without credentials and verify redirect status `307` to login.

---

## Antipattern Traps

- **The Version Disconnect:** Assuming a modern framework feature exists when the project is running an outdated version. Always check the version first.
- **The "Over-Configuration" Trap:** Writing massive configurations that are harder to maintain than simple, clean code.
- **Framework Hijacking:** Forcing a framework design pattern that the codebase is actively trying to migrate away from.

---

## Output

Emit an opportunity card of type `native` showing:
1. The framework utility, config, or convention to utilize.
2. Code references proving the framework is active.
3. The custom logic this bypasses.
4. The receipt to prove correct integration.
