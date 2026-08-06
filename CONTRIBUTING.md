# Contributing

Tom n Jerry grows by adding narrow behavioral primitives.

Each new skill should make agents notice a specific class of opportunity before they build.

## Skill Format

Skills live in `tnj/skills/` (published to npm) and `.tnj/skills/` (project copy).

Each skill is a Markdown file with:

- **Trigger**: When does this skill fire?
- **Checks**: Concrete steps Jerry runs
- **Action**: What Jerry does if a shortcut is found

## New Skill Rules

- One skill per behavioral primitive
- Keep the mission narrow
- Make the trigger condition explicit
- Use concrete checks
- Prefer opportunity cards as output
- Require evidence
- Require receipts

## Skill Template

```markdown
# <skill-name>

## Trigger
Before [action], run this skill.

## Checks
1. Check [specific file/pattern/API]
2. Check [another affordance]

## Action
- Shortcut found → emit Opportunity Card
- Nothing found → Tom implements
```

## Good Fit

A good Jerry skill says: "Before building this class of thing, check this existing affordance."

Examples:

- package.json for existing dependencies
- browser native behavior (`<input type="date">`)
- framework config conventions
- git history for deleted code
- database schema already exists
- shell tools (rg, jq, awk)

## Poor Fit

> Be better at engineering.

That's too broad to be useful.

## Running Tests

```bash
npm test          # Run doctor + version check
npm run doctor    # Just the doctor checks
```

## Submitting Changes

1. Fork the repo
2. Make your change
3. Run `npm test` — must pass
4. Submit a PR

## Reporting Issues

Open an issue at https://github.com/hrshx3o5o6/Tom-n-Jerry/issues

Include:
- What you expected vs what happened
- opencode version and TNJ version (`tomnjerry doctor`)
- Steps to reproduce
