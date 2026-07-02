# Design Principles

Street Smart Skills gives coding agents opportunistic engineering instincts.

The project starts as readable Markdown because the first goal is portability, not orchestration.

## Tom Is Momentum

Tom is the force that keeps work moving.

Tom turns vague intent into candidate moves, decomposes work into small actions, recovers from blocks, and keeps the agent pointed at a receipt.

Tom is not the villain. Without Tom, Jerry becomes endless cleverness with no shipping.

## Jerry Is Opportunism

Jerry is the street-smart layer.

Jerry intercepts a candidate move and asks whether the environment already contains a cheaper path.

Jerry looks for:

- existing code
- existing dependencies
- framework conventions
- browser and platform APIs
- shell tools
- git history
- safe deletion
- traps and overbuilding

## Receipts Are Proof

Street-smart moves still need evidence.

Every shortcut should identify a receipt: a command, test, screenshot, diff, log, or artifact that proves the move worked.

## The Core Loop

```text
Intent -> Tom candidate move -> Jerry opportunity scan -> revised move -> execution -> receipt
```

This loop can run inside any capable coding agent.

## Agent-Agnostic First

The skills should avoid assumptions about one host runtime.

Each skill should be useful as:

- a Codex skill
- a Claude Code command or memory fragment
- an opencode instruction
- a Cursor or Aider rule
- a generic preflight prompt

## Human-Readable First

The first version should be inspectable and editable by humans.

Do not hide the behavior inside a runtime until the skill primitives are proven useful.

## Non-Goals

- Do not build a full agent framework in v0.
- Do not make cartoon language more important than the mechanism.
- Do not reward cleverness without receipts.
- Do not block progress when no useful opportunity exists.
- Do not encourage unsafe shortcuts.

## Contribution Philosophy

Add a new skill only when it represents a distinct behavioral primitive.

Good skills are narrow, evidence-seeking, portable, and receipt-driven.
