---
created: 2026-10-25
updated: 2026-10-25
---

# Add an "AI" group to the Skills section

## Context

The Skills section ([libs/features/skills](libs/features/skills)) shows four
groups (Architecture, Backend, Frontend, Platform). They are typed content in
`SKILLS` in [portfolio-content.ts](libs/data/src/lib/portfolio-content.ts#L136).
Mark wants a fifth group for AI work he has done: efficient skill usage,
multi-agent work with Claude and Copilot, and the standard MCP stack.

**Does this count as spec-driven development?** Mostly yes. Spec-driven
development (SDD) means writing a spec first and having the agent implement
against it, as GitHub Spec Kit and Kiro do. This repo already works that way:
- CLAUDE.md and the guidelines act as the standing spec.
- The mockup and brand guide are the source of truth for the UI.
- Every increment gets a written plan with acceptance criteria and an
  out-of-scope list, which is approved before any code is written.
- The plan is checked against the diff (`/review-implementation`) and
  archived in `docs/plans/NNNN-*.md`.

It isn't the strictest form, where code is regenerated from the spec, but the
term fits a portfolio honestly. Recommendation: include it.

## Approach

This is a content change only. Add one `SkillGroup` to the end of
`SKILLS.groups`:

```ts
{
  label: 'AI',
  items: [
    'Spec-Driven Development',
    'Context Engineering',
    'Custom Agent Skills',
    'Multi-Agent Orchestration',
    'AI Code Review',
    'Claude Code',
    'GitHub Copilot',
    'MCP',
  ],
},
```

The list has eight items, the same length as Backend. It goes from practices
to tools, matching how Backend runs from languages to protocols. Mark's
answers map to the items like this:

| What Mark did | Item |
|---------------|------|
| Plan → acceptance criteria → review → archive workflow | Spec-Driven Development |
| Shaping CLAUDE.md, memory and guidelines; curating plugin skills to keep context lean | Context Engineering |
| Writing his own skills and slash commands | Custom Agent Skills |
| Subagents and parallel agents, Copilot's coding agent on PRs | Multi-Agent Orchestration |
| One agent writes, another reviews; agent review as a PR gate | AI Code Review |
| The tools themselves, named so a recruiter's keyword scan finds them | Claude Code, GitHub Copilot |
| The standard MCP servers wired into the workflow | MCP |

Why this wording: the existing items are short terms ("Domain Driven
Design", "gRPC"), not sentences. "Efficient Skill usage" would read oddly
in a section titled *Skills*, so it is split into "Context Engineering" and
"Custom Agent Skills".

Rolling these practices out to his org is a leadership claim, not a skill.
It belongs in Profile or Portfolio copy, not in this list. Left out here and
flagged for Mark.

Also update the two doc comments that say "four groups":
- `SkillsContent` in [portfolio-content.ts:51](libs/data/src/lib/portfolio-content.ts#L51)
- `SkillsSection` in [skills-section.ts:5](libs/features/skills/src/lib/skills-section/skills-section.ts#L5)

Use "five groups", or drop the number so the comment doesn't go stale again.
Recommendation: drop the number.

The layout needs no change. [skills-section.scss](libs/features/skills/src/lib/skills-section/skills-section.scss)
is a grid with one column, which becomes two columns once the content box
reaches 440px (a container query). With five groups, AI sits alone in the
left cell of the third row on wide screens. That reads as a normal list
continuing. On narrow screens it is simply the fifth item in the stack.

### Alternatives considered

- **Make the AI group span both columns** (`grid-column: 1 / -1` on the last
  odd group). This avoids the half-empty row, but it gives AI more visual
  weight than the other groups and adds a layout rule the mockup doesn't
  have. Rejected. It's easy to add later if the orphan cell bothers Mark.
- **Put AI first.** This would lead with the newest skill, but it breaks the
  current order, which goes from architecture through the stack layers.
  Rejected; AI goes last.
- **Fold the AI items into existing groups** (e.g. Copilot under Platform).
  This scatters the topic Mark wants to highlight. Rejected.
- **Keep Mark's phrasing word for word** ("Efficient Skill usage", ...).
  Rejected for consistency with the other items, as explained above.

## Acceptance criteria

- The Skills section shows a fifth group labelled "AI", after Platform, with
  the items listed above (or Mark's revised wording).
- No doc comment claims there are four groups.
- On wide and narrow viewports the group uses the same styling as the
  others, and nothing in the layout overflows.
- `npm run verify` passes (build, typecheck, lint, test, format:check).

## Out of scope

- Any change to grid layout or styling.
- Rewording the Skills title ("The stack I reach for…") or other groups.
- The Contact section.
- CLAUDE.md: this is content, not an architectural fact, so it needs no
  update.

## Tests

None added. This is a typed content constant rendered by a purely
presentational `@for`, which is exempt under the Test Requirements. Existing
specs must stay green.

## Verification

1. `npm run verify`
2. `npm start`, open `/#skills` at about 375px and at about 1440px, and
   check the AI group renders and wraps like the others.
3. Check the prerendered `dist/apps/digital-portfolio/browser/index.html`
   contains the AI group, so it is there without JavaScript.
