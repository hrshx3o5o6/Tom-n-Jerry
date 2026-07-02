---
name: trap-jerry
description: Detect high-complexity infrastructure traps (bespoke authentication, custom caching, home-rolled state machines, custom scheduling, cryptography) and redirect to standard cloud/managed patterns.
triggers:
  - When the plan involves building authentication, session, or encryption logic
  - When building a caching layer, queue scheduler, or state transition machine
  - When creating file-based database or data synchronization schemes
---

# Trap Jerry

Trap Jerry flags high-risk engineering "traps" (custom security, cache invalidation systems, home-grown queue engines, bespoke file-synchronization). It redirects the agent to standard cloud services, robust libraries, or framework implementations.

## Mission

Avoid premature infrastructure. Custom security, scheduling, and queue engines are highly prone to race conditions, security holes, and scaling bugs. Stop custom construction of these components and force the use of standard solutions.

---

## Explicit Triggers

This skill MUST be executed when:
1. Writing cryptography, password hashing, token validation, or custom OAuth code.
2. Building local database file sync routines or custom lock mechanisms.
3. Writing a memory cache, redis invalidator, job queue, or cron trigger processor from scratch.

---

## Concrete Checks & Actions

1. **Detect Complexity Triggers:**
   - Are we writing code involving `crypto.pbkdf2`, setting up background polling loops, handling queue retries, or managing mutex locks?
2. **Scan Ecosystem Solutions:**
   - Identify standard libraries or external APIs (e.g., Auth0, Firebase Auth, Redis, RabbitMQ, BullMQ, native cron, crypto libraries) that solve this cleanly.
3. **Compare Security Risks:**
   - Verify that standard security compliance (JWT parsing, hashing) is delegable to audited libraries rather than a custom-built utility.

---

## Inline Scenario

* **Vague Plan (Naive):** "I will write a custom scheduling loop inside my node app. It will use a `setInterval` running every 10 seconds that scans the database `jobs` table, checks if a task's schedule time has passed, marks the row as `in-progress` and runs the task."
* **Jerry Opportunity Card:**
  - **Type:** trap
  - **Claim:** Home-rolled interval schedulers fail under cluster scale (duplicate task runs) and crash processes on failures.
  - **Evidence:** Codebase is deployed as a cluster on AWS ECS; the plan has no mutex lock to prevent concurrent runs.
  - **Move:** Use an established library like `BullMQ` or configure a serverless cron job (AWS EventBridge triggering an ECS task).
  - **Risk:** Requires setting up a Redis connection for BullMQ.
  - **Receipt:** Inspect queue worker initialization tests.

---

## Antipattern Traps

- **"I Can Write It in 50 Lines" Trap:** Underestimating the edge cases of caching, queue concurrency, authentication, or task retries.
- **Home-Grown Cryptography:** Implementing custom XOR routines, manual salt generation, or hand-rolled cipher algorithms. **Always use standard libraries.**

---

## Output

Emit an opportunity card of type `trap` showing:
1. The complex infrastructure component to avoid building.
2. The standard package, cloud service, or architectural pattern to use instead.
3. The receipt verifying configuration integration.
