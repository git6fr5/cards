---
name: Timeline Creation Workflow
description: Guided flow for generating a project timeline: read codebase state, gather inputs, draft structured plan, confirm, then save
type: project
---

I want to create a project timeline. Before drafting anything:

Read prototype_plan.md, notes.md, and survey the actual codebase (find backend -name "*.py", find frontend/app -type f) to get an accurate picture of what exists vs what's still to build.

Ask me: (a) deadline, (b) working days per week, (c) does the scope look right or are there things to add/drop/defer, (d) do you prefer backend-first then frontend, or mixed by domain?

Draft the timeline structured as: dependency chain → weekly milestones with a date + status + target table → risk flags → safe cuts. Use specific dates. Landmarks are resources (backend) and pages (frontend). Where a backend resource is a management/editing system intimately tied to its frontend page, pair them on the same day. Present the draft for confirmation before saving.

On confirmation, save to project_timeline.md in the project memory folder and add a pointer to MEMORY.md.
