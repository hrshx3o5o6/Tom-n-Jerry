# Contributing

Tom n Jerry grows by adding narrow behavioral primitives.


Each new skill should make agents notice a specific class of opportunity before they build.

## New Skill Rules

- One skill per behavioral primitive.
- Keep the mission narrow.
- Make the trigger condition explicit.
- Use concrete checks.
- Prefer opportunity cards as output.
- Require evidence.
- Require receipts.
- Avoid runtime-specific assumptions in core skills.
- Put agent-specific advice in compatibility docs.

## Skill Template

```markdown
---
name: <skill-name>
description: <when to use this skill>
---

# <Skill Title>

## Mission

<One-paragraph behavioral mission.>

## Checks

- <Concrete check 1>
- <Concrete check 2>
- <Concrete check 3>

## Opportunity Card Bias

Prefer cards of type: <types>.

## Guardrails

- Cite evidence.
- Preserve correctness.
- Require receipts.
```

## New Skill Checklist

- [ ] The skill has a narrow behavioral mission.
- [ ] The trigger condition is clear.
- [ ] The checks are concrete.
- [ ] The skill emits or informs opportunity cards.
- [ ] The skill requires evidence.
- [ ] The skill requires receipts.
- [ ] The skill is portable across agents.

## Good Fit

A good Jerry skill says:

> Before building this class of thing, check this existing affordance.

Examples:

- browser-native behavior
- package-manager scripts
- existing database schema
- existing test helpers
- deleted code in git history
- framework configuration
- database triggers or security rules
- domain-specific languages (IaC, Unity/C#, mobile native layouts)

## Poor Fit

A poor Jerry skill says:

> Be better at engineering.

That is too broad to be useful.

---

## Agent Self-Generation Guidelines (Dynamic Adaptability)

If you are an AI coding agent operating in a workspace that is out of scope of the pre-existing 12 skills (e.g., you are building a Unity 3D game, a Swift SwiftUI app, or a Terraform architecture plan), you are authorized and encouraged to self-generate a new local Jerry skill.

### Steps to Self-Generate:

1. **Identify the Gap:** Recognize a repetitive abstraction, boilerplate code pattern, or environment affordance unique to the workspace's domain.
2. **Scaffold Local Custom Skill:**
   - Create folder: `skills/custom-<domain-name>/`
   - Create file: `skills/custom-<domain-name>/SKILL.md`
3. **Write Using the Robust Template:**
   - Define concrete domain-specific triggers.
   - Outline concrete checks (e.g., search patterns, CLI targets).
   - Write a Before/After Inline Scenario showing how this skill intercepts naive implementation patterns.
   - Outline common Antipattern Traps.
   - Define concrete Receipt Targets.
4. **Register locally:** Commit the new skill file back to the repository. Future runs in the workspace will automatically trigger it.

