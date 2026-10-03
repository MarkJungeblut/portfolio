---
name: plan
description: Full planning workflow — branch, plan mode, implement, archive. Use for any non-trivial change.
---

Follow this workflow whenever the user wants to plan and implement a change.
Apply @docs/guidelines/ai-collaboration.md throughout — it is not optional
reading, it governs every step below.

## Step 1 — Clarify
If the user hasn't described what they want precisely enough to plan against,
ask them now before proceeding. Don't guess at ambiguous requirements.

## Step 2 — Create a branch
Before writing any code, create and check out a new git branch. Use the branch
naming convention from @docs/guidelines/git-workflow.md:
  <type>/<short-description>
Types: feat/, fix/, chore/, docs/, refactor/, test/
Example: feat/task-list-api

Do NOT start implementing on main.

## Step 3 — Plan
Enter plan mode. Explore the codebase and design the implementation.

The plan must include:
- The approach, plus alternatives considered, per "Proposing Alternatives" in
  @docs/guidelines/ai-collaboration.md — this is not optional, even for a plan
  that feels obvious.
- Explicit acceptance criteria: what must be true for this to be done.
- What is explicitly out of scope for this increment.

Present the plan and wait for the user to approve it. Only once they have:

1. Exit plan mode with the approved plan content.
2. Write that content to docs/plans/current-plan.md (overwrite if it already
   exists from a prior increment). This is the canonical location for the
   in-progress plan — the review skill reads from this exact path, so it must
   exist before implementation begins. The file is gitignored; the archived
   copy written in Step 6 is the durable record.

Do not write any code — including the plan file — before that approval.

## Step 4 — Implement
Execute the approved plan exactly as approved, observing "Scope" and
"Incremental Changes" in @docs/guidelines/ai-collaboration.md. If the task
turns out larger than the plan assumed, stop and confirm direction before
continuing.

Write tests per "Test Requirements" in @docs/guidelines/ai-collaboration.md.

Commit the work before moving on, using the Conventional Commits format from
@docs/guidelines/git-workflow.md. This is not optional bookkeeping: the review
in Step 5 reads the branch diff, and `git diff` cannot see untracked files, so
anything added but never committed — typically the new modules and their tests,
i.e. most of the implementation — is invisible to the reviewer. It would then
review a partial diff without knowing it. Commit as you go for a larger
increment; the branch is squash-merged in Step 7, so granularity costs nothing.

## Step 5 — Verify definition of done
Before archiving, confirm every item in "Definition of Done" in
@docs/guidelines/ai-collaboration.md. Do not proceed to archiving on a red
build or a "should be fine."

Stop here and tell the user: "Implementation complete and definition of done
verified. Run /review-implementation before archiving." Do not proceed to
Step 6 until the user confirms the review has been run and issues addressed.

/review-implementation checks the diff against the plan — scope, acceptance
criteria, missing work. It is not a correctness audit. For anything with
non-trivial logic, suggest /code-review as well; the two are complementary.

## Step 6 — Archive the plan
1. List docs/plans/ to find the highest existing plan number. `_template.md`
   is not a numbered plan — ignore it. If there are no numbered plans yet,
   start at 0001.
2. Copy docs/plans/_template.md to docs/plans/NNNN-<slug>.md, where NNNN is
   the next number.
3. In the new file, replace the
   `<!-- Copy the implemented session plan verbatim above this line, then
   adjust the frontmatter. -->` comment with the full content of
   docs/plans/current-plan.md, then remove the comment itself. Preserve all
   design decisions, context, and detail exactly as implemented, including
   the alternatives considered in Step 3 — do not summarize or rewrite.
4. Update the frontmatter: set `created` to the date work started and
   `updated` to today.
5. Delete docs/plans/current-plan.md now that it's archived, so the next
   increment starts clean and the review skill never reads a stale plan.
6. Commit the archive file together with any other final tidy-up commits.

## Step 7 — Open the pull request
The branch from Step 2 is not the deliverable — `main` is protected and all
changes land through a PR, per "Pull Request Process" in
@docs/guidelines/git-workflow.md. Leaving the branch sitting locally leaves
the increment unfinished.

Pushing and opening a PR is outward-facing, so ask the user before doing it
rather than assuming. Once they confirm:

1. Push the branch and open the PR with `gh pr create`.
2. Fill in .github/pull_request_template.md rather than writing a free-form
   body: summary, the type of change (matching the branch type from Step 2),
   and a test plan describing how the Definition of Done was verified in
   Step 5.

Then hand back to the user — CI, review, approval, and the squash merge are
theirs. Do not merge the PR.
