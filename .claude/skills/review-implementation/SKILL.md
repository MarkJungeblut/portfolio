---
name: review-implementation
description: Independently review the current implementation against its plan for correctness, edge cases, and scope creep
agent: general-purpose
allowed-tools: Read, Grep, Glob
background: false
disable-model-invocation: true
---

<!--
Frontmatter notes — these choices are load-bearing, don't "tidy" them away:

- No `context:` key, so the reviewer starts from a fresh context. It must NOT
  inherit this session's conversation: the planning discussion and the
  reasoning used to justify the implementation are exactly the contamination
  the "independent reviewer" framing below is guarding against.
- `general-purpose` rather than `Explore`, because this is a judgement task
  (per-criterion pass/fail, edge cases, test quality), not a code search.
- `allowed-tools` withholds Edit/Write/Bash, so read-only is structural rather
  than a request the model can talk itself out of. The diff is injected below,
  so the reviewer needs no shell of its own.
-->

## Plan for this increment
@docs/plans/current-plan.md

## Implementation diff
!`git diff $(git merge-base HEAD main)`

## Changed files
!`git diff --name-only $(git merge-base HEAD main)`

## Your task

First, check that the plan section above actually contains a plan. If it is
empty or missing — docs/plans/current-plan.md does not exist, because it was
already archived or /plan was never run for this increment — stop immediately
and report exactly that. Do not review the diff against nothing, and do not
reconstruct the plan from the diff: a review that infers intent from the code
it is reviewing cannot detect missing work or scope creep, which is most of
what this review is for.

Second, check that the diff section above is non-empty. If it is empty, stop
and report exactly that — do not report the acceptance criteria as passing.
An empty diff means the review is looking at nothing, not that the work is
clean. Likely causes: the branch has no commits and no working-tree changes
yet, or the `git merge-base HEAD main` above failed because this project's
trunk is not called `main` or exists only as `origin/main` (say so, and name
the branch it should be compared against instead).

Otherwise, review this implementation as an independent reviewer with no
prior context on this project beyond what's above. Do not assume anything
was discussed elsewhere — evaluate only against the plan and the diff.

1. Does the diff actually implement what the plan describes? Flag anything
   missing, anything added that wasn't in the plan (scope creep), and
   anything that diverges from the stated approach.
2. Check the plan's acceptance criteria one by one — does the code satisfy
   each, explicitly? Report pass/fail per criterion.
3. Look for edge cases the plan didn't anticipate: empty/null inputs,
   error paths, boundary conditions, race conditions.
4. Flag anything over-engineered relative to what the plan called for.
5. Check test coverage: do the tests assert behavior described in the plan's
   acceptance criteria, or do they merely mirror what the implementation
   currently does? Flag any test whose expected values look like they were
   derived from running the code rather than from the plan.

Report findings as a short list: pass/fail per acceptance criterion, then
any additional issues found, each with the file and line. Do not modify any
files — report only.