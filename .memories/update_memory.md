---
name: update-memory
description: Workflow for merging memory files from another project into this one
metadata:
  type: feedback
---

When you say "update [memory file] using [other project's memory]", I will:

1. Read both versions — this project's memory file and the corresponding one from the other project
2. Merge in additions — any rules/content in the other project's memory that aren't in this one get inserted in the appropriate place
3. Resolve conflicts in favour of the other project — if the same rule/topic exists but differs, the other project's version wins
4. Flag orphaned rules — anything in this project's memory that has no counterpart in the other project gets surfaced to you for a decision, but is left in place
5. Show a diff summary — a clear list of every change made (additions, replacements, flags)

Before executing, if not provided:
- Ask for the path to the memory folder of the other project
- Ask which file is to be updated (if not clear from the request)
