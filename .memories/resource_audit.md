---
name: Resource Audit
description: How to run a structured audit on a single routes resource folder — what to check, what to extract, and what to refuse
type: feedback
originSessionId: fd08e3f3-76f3-4ba8-ba2d-8cd8c13f6cea
---
Never run a resource audit on the whole backend or the whole package. If the user does not specify a single routes resource folder (e.g. `testator/wills/`), refuse and ask them to name the folder.

**Why:** The audit is designed to be scoped — running it broadly produces noise and loses the per-resource signal.

**How to apply:** If asked to "audit the backend" or "audit testator", ask: "Which resource folder? (e.g. `testator/wills/`)"

---

## When a folder is specified, produce all of the following:

### 1. AUDIT.md findings
Work through every section of `AUDIT.md` (Backend Bugs, Backend Style, Backend Structure, ORM Bugs, ORM Style, ORM Structure, and Frontend sections if applicable). For every finding, quote the offending code and state which rule it violates. For comments/docstrings flagged for removal, quote the full text.

### 2. Dependencies
List all imports across every file in the folder that come from **outside** this resource folder. Categorise as:
- **Standard library** (e.g. `os`, `re`, `typing`)
- **Third-party** (e.g. `fastapi`, `sqlalchemy`, `pydantic`, `openai`)
- **Internal — other route folders/resources/packages** (e.g. `testator.orm.wills`, `utils.databases`) — include the full import path

Do NOT list imports from within the resource folder itself.

### 3. ERRORS dictionary entries
List every key-value pair defined in any `ERRORS` dict across the folder's files, in the format:
```
"KEY": "Message text."   # filename.py
```

### 4. Pydantic models
List the name of every Pydantic model class defined in the folder (request and response models), grouped by file.

### 5. Endpoints
List every route handler in the format:
```
METHOD /prefix/path   →   function_name()   # filename.py
```

Flag any route whose function name uses a CRUD verb (`create_*`, `read_*`, `update_*`, `delete_*`) but whose body calls inference functions (`generate_text`, `embed`, `generate_model`, similarity projection, or similar) — both the name and the file placement are wrong.

Flag any `embed_*` or `project_*` route in `infer.py` that does not 422 before calling the inference tool when the prerequisite field (generated text or embedding) is null.

### 6. Tools
List every tool function defined in `tools.py` and note which route handler (if any) calls it, in the format:
```
tool_function_name()   # tools.py  (called by filename.py / no consumer)
```
