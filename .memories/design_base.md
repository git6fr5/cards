---
name: Design Base
description: Spec for {Project} design system components in components/ui/, components/forms/, components/layout/, components/table/ — props, variants, layout rules, and universal conventions
type: feedback
originSessionId: 790f8a7e-f1b0-4161-8dcf-470ff0e29c3b
---

## `{Project}` token

Throughout this guide, `{Project}` is a placeholder for the project-specific prefix used in component names and CSS custom properties. Replace with the actual project name when instantiating this template.

---

## Design tokens — `globals.css` `@theme inline`

This project uses **Tailwind v4**. All design tokens live in `globals.css` inside an `@theme inline` block — there is no `tailwind.config.mjs`. The CSS variable prefix determines the utility class generated automatically by Tailwind v4 (see the style guide for the full prefix → utility mapping table).

Token set:
- `--color-{project}-*` hex values → `bg-*`, `text-*`, `border-*`, etc.
- `--border-radius-none/sm/md/lg` in px → `rounded-*`
- `--font-size-xs` through `--font-size-xl` in rem → `text-*`
- `--line-height-tight/normal/loose` → `leading-*`
- `--opacity-disabled: 0.4`, `--opacity-muted: 0.6` → `opacity-*`
- `--width-sidebar: 13rem` → `w-sidebar`
- `--max-width-modal-sm/md/lg` → `max-w-modal-*`
- `--z-index-dropdown: 10`, `--z-index-modal: 50`, `--z-index-toast: 60` → `z-*`

**Focus ring:** use Tailwind ring utilities — `ring-2 ring-{project}-black` — not a CSS variable.

---

## Universal Rules (all components/ui/, components/forms/, components/layout/, components/table/)

**`alt` boolean** — always the first prop in the interface. Controls inverted/secondary color state. All style differences driven by `alt` are resolved into named variables at the top of the component body, before the return. Never inline conditional classes scattered through JSX.

```ts
const color = alt ? 'var(--color-{project}-white)' : 'var(--color-{project}-black)';
const bg    = alt ? 'bg-{project}-black' : 'bg-{project}-white';
```

**`className` escape hatch** — always present, always last in the interface, default `''`. Appended to the outermost element. Never overrides internal structure.

**Spacing** — use Tailwind spacing classes (`px-3`, `py-2`, `gap-2`, etc.). Do not accept spacing as number props or use a `rem()` helper.

**No raw hex codes** — use Tailwind utility classes (`bg-{project}-black`, `text-{project}-white`) or CSS variables in style props (`var(--color-{project}-black)`). Never write hex directly.

**Discriminated union for multi-variant components** — when a component renders fundamentally different HTML depending on a `variant` prop, use a discriminated union with `never` to make invalid combinations a compile error. Shared props go in a `SharedProps` interface; variant-specific props in named interfaces that extend it.

**`fullWidth` boolean** — when a component needs a "take up all available width" mode, use `fullWidth?: boolean` (default `false`).

**File order:**
1. `'use client'` (only if the component uses hooks or browser APIs)
2. Imports — external first (`react`, `next/*`), then internal via `@`
3. Interfaces/types
4. Default-exported component function

**No comments** — follow the project-wide rule. No docblocks, no section labels, no inline explanations unless the WHY is genuinely non-obvious.

**{Project} prefix** — all components in `components/ui/`, `components/forms/`, `components/layout/`, and `components/table/` are prefixed with `{Project}` (e.g. `{Project}Button`, `{Project}Input`, `{Project}Header`). This signals "shared design system component." Page-specific components in `_components/` are never prefixed.

**Build on base components** — page-specific components in `_components/` should compose these base components rather than re-implementing styling from scratch.

---

## `components/ui/`

Design building blocks — atomic visual elements that are not form inputs or layout shells.

*(Current list to be defined as components are created)*

---

## `components/forms/`

### `{Project}Button`
Discriminated union: `variant="action"` renders `<button>`, `variant="link"` renders Next.js `<Link>`.

```ts
interface SharedProps {
  alt?: boolean;
  text: string;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

interface ActionVariant extends SharedProps {
  variant: 'action';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  href?: never;
}

interface LinkVariant extends SharedProps {
  variant: 'link';
  href?: string;
  target?: string;
  onClick?: never;
  type?: never;
}
```

`disabled` dims via opacity and sets `cursor-not-allowed`. All background/color logic resolved at top via variables before JSX.

---

### `{Project}TextField`
Label + single-line text input + inline error. The standard form field.

`'use client'` required — holds internal validation state.

```ts
interface {Project}TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  error?: string;
  className?: string;
}
```

Layout: `flex flex-col gap-2`. Label above, input middle, error below. `type="email"` activates onBlur format validation automatically. `error` prop shows inline error style — caller-provided error wins if both exist. `name` defaults to `id`.

---

### `{Project}TextArea`
Label + multiline input + inline error + optional render overlay.

`'use client'` required.

```ts
interface {Project}TextAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  name?: string;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  renderOverlay?: (value: string) => React.ReactNode;
  className?: string;
}
```

`renderOverlay` receives the current value and returns a React node rendered below the textarea. `rows` defaults to 4.

---

### `{Project}Dropdown`
Label + `<select>` + inline error.

`'use client'` required.

```ts
interface DropdownOption {
  value: string;
  label: string;
}

interface {Project}DropdownProps {
  id: string;
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}
```

Same `flex flex-col gap-2` layout as TextField. `placeholder` renders as a non-selectable first option with muted style.

---

### `{Project}Checkbox`
Single checkbox with label. Compose multiple for a group.

`'use client'` required.

```ts
interface {Project}CheckboxProps {
  alt?: boolean;
  id: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
}
```

`alt` controls label color for dark backgrounds. Renders `flex items-center gap-2` — checkbox left, label right.

---

### `{Project}Radio`
A group of radio inputs sharing a `name`.

`'use client'` required.

```ts
interface RadioOption {
  value: string;
  label: string;
}

interface {Project}RadioProps {
  alt?: boolean;
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}
```

`onChange` receives the selected value string directly — not the raw event. `alt` controls label color.

---

### `{Project}FileUpload`
File picker with filename feedback.

`'use client'` required.

```ts
interface {Project}FileUploadProps {
  label: string;
  onChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}
```

Shows selected filename below input. `accept` constrains the file picker (e.g. `'application/pdf,image/*'`).

---

### `{Project}DatePicker`
Label + `<input type="date">` + inline error.

```ts
interface {Project}DatePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}
```

`value` is an ISO date string (`'YYYY-MM-DD'`). Same layout as TextField. No `'use client'` required unless extended.

---

## `components/layout/`

Layout components are structural shells. They accept `children: React.ReactNode`, not content props. They have no opinions about what goes inside them.

### `{Project}Header`
```ts
interface {Project}HeaderProps {
  alt?: boolean;
  text: string;
  em?: string;
  className?: string;
}
```

`em` is a substring of `text` to wrap in `<em>`. `alt` renders inverted color state.

### `{Project}Footer`
```ts
interface {Project}FooterProps {
  alt?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

Structural shell — links, copy, and logo passed as children.

### `{Project}Section`
Full-width section block for dividing page content into bands.

```ts
interface {Project}SectionProps {
  alt?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

`alt` sets alternate background. Controls background only — does not dictate inner layout.

### `{Project}Modal`
Base modal shell — backdrop + centered container. All modals compose this.

```ts
interface {Project}ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

Renders fixed backdrop (`bg-black/50`), centered panel, title bar with close button. `children` is the modal body.

### `{Project}Loader`
Animated spinning circle loading indicator.

```ts
interface {Project}LoaderProps {
  alt?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

`alt` inverts the spinner color for dark backgrounds (`border-t-{project}-white` vs `border-t-{project}-black`). Track opacity set via `/20` modifier on the same color. `size` maps to `w-4 h-4` (sm), `w-6 h-6` (md), `w-10 h-10` (lg). Classic border-top spin via `animate-spin`. No `'use client'` required.

---

## `components/table/`

Generic table system. *(Spec to be defined when table components are created)*
