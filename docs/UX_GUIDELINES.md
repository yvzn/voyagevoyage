# VoyageVoyage - UX Guidelines

## 1. Purpose

This document defines the core UX principles to follow across the VoyageVoyage application.

It complements the product and functional documentation by translating UX expectations into concrete design and implementation rules for the application stack.

These guidelines apply to all screens, components, forms, navigation patterns, and user-facing interactions.

## 2. Core objectives

- Make the application easy to understand on first use.
- Reduce cognitive load for recurring travel and expense tasks.
- Ensure every user can complete key workflows regardless of device, input method, or accessibility needs.
- Favor consistency, predictability, and traceability over decorative or complex interactions.

## 3. Accessibility first

Accessibility is a non-negotiable product requirement.

### 3.1 Standards to meet

- Meet WCAG 2.2 level AAA whenever technically and functionally possible. When AAA is not achievable, meet level AA.
- Meet applicable RGAA 4.1 level AA requirements.
- Treat accessibility defects as product quality defects, not optional enhancements.
- Validate accessibility continuously during design, implementation, and review.

### 3.2 Semantic structure

- Use semantic HTML first: `header`, `nav`, `main`, `section`, `article`, `form`, `label`, `button`, `table`, and other native elements must be preferred over generic containers.
- Use ARIA only when native HTML semantics are insufficient.
- Avoid replacing native controls with custom interactive elements unless there is a strong functional reason.
- Ensure headings follow a logical hierarchy and reflect the real content structure.
- Ensure lists, tables, landmarks, and form fields are represented with their proper HTML semantics.

### 3.3 Screen reader support

- HTML must follow a natural reading order that matches the visual and functional structure.
- Important page content must be understandable without relying on visual layout alone.
- Form labels, hints, validation messages, and status messages must be programmatically associated with the relevant controls.
- Dynamic updates such as loading states, validation errors, and success messages must be announced appropriately.
- Do not encode meaning through color, position, or iconography alone.

### 3.4 Keyboard navigation

- All interactive features must be fully usable with a keyboard.
- Focus order must be logical and follow the visible reading flow.
- Focus states must remain visible at all times.
- Users must be able to open, use, and close dialogs, menus, and other overlays without a mouse.
- Avoid keyboard traps.
- Provide skip links or equivalent mechanisms when pages contain repeated navigation blocks.

### 3.5 Content and language

- Use clear, plain, and direct language.
- Structure content so users can scan it quickly with headings, labels, and grouped information.
- Define the correct document and content language in HTML.
- All user-facing text must be internationalized.
- Do not hardcode visible strings, labels, placeholders, helper text, validation messages, or empty-state messages in templates or components.

## 4. Design principles

The product should follow the practical usability principles described by Don Norman in The Design of Everyday Things.

### 4.1 Visibility and discoverability

- Make primary actions and critical information immediately visible.
- Ensure users can tell what actions are available on a page without exploring the interface.
- Surface system status, page purpose, and next steps clearly.
- Do not hide important actions behind ambiguous icons or low-visibility affordances.

### 4.2 Feedback and system response

- Every user action should trigger clear and timely feedback.
- Show loading, saving, success, warning, and error states explicitly.
- When an action fails, explain what happened, what the impact is, and what the user can do next.
- Long-running processes must expose progress or at least confirm that processing is underway.

### 4.3 Consistency and reusable patterns

- Reuse the same patterns for navigation, forms, validation, tables, filters, and status display throughout the app.
- Equivalent actions must use consistent labels, placement, and interaction rules.
- Similar data must be presented in similar ways across screens.
- Introduce a new interaction pattern only when an existing one is clearly insufficient.

### 4.4 Progressive disclosure

- Do not overwhelm users with dense screens or too many simultaneous choices.
- Break complex tasks into smaller, understandable steps.
- Reveal advanced options only when they are relevant.
- Group related information so users can focus on one decision at a time.

## 5. Intuitive navigation and comprehension

The application should also follow the usability recommendations popularized by Steve Krug in Don't Make Me Think.

### 5.1 Immediate clarity

- The purpose of each page must be obvious within seconds.
- Users must be able to identify where they are, what they can do, and what information matters most.
- Page titles, section headings, and introductory text must remove ambiguity rather than add it.

### 5.2 Clear labels

- Buttons, links, tabs, filters, and menu items must use descriptive labels.
- Avoid vague actions such as "Submit", "Validate", or "Open" when a more specific label is possible.
- Labels must reflect user intent and domain language.

### 5.3 Efficient task completion

- Minimize the number of steps and clicks required for common workflows.
- Prefer sensible defaults, autofill, remembered context, and contextual actions when they reduce repetitive effort.
- Keep primary workflows short, especially for frequent tasks such as trip creation, receipt upload, and expense entry.

### 5.4 Simplicity over cleverness

- Avoid decorative complexity, hidden logic, or surprising behavior.
- Prefer straightforward layouts and familiar interaction patterns.
- If an element requires explanation to be understood, it should usually be redesigned.

## 6. Technical UI conventions

### 6.1 Stack usage

- Favor the existing UX stack: Angular, Tailwind CSS, and Flowbite.
- Use as few custom styles as possible.
- Prefer composition of existing utility classes and library components over bespoke visual implementations.
- Add custom CSS only when the stack cannot reasonably provide the required behavior or accessibility.

### 6.2 Component design

- Build simple, focused Angular components.
- Avoid oversized components with mixed responsibilities.
- Break complex screens into smaller reusable pieces when that improves clarity, maintainability, or testability.
- Keep presentation concerns separated from orchestration and data access when practical.

### 6.3 Forms and interaction patterns

- Use native form behavior whenever possible.
- Keep forms concise and grouped by user intent.
- Show validation close to the relevant fields and in a form-level summary when necessary.
- Preserve user input during validation failures or recoverable errors.
- Make destructive actions explicit and confirm them when risk is significant.

### 6.4 Cursor affordance

- Always add `cursor-pointer` (Tailwind) to every `<button>` element that acts as a clickable affordance, even when it receives a native button role. Browsers apply `cursor: default` to buttons by default; this makes clickable elements unmistakably interactive.
- This applies equally to icon-only buttons, list-item navigation buttons, and any other interactive `<button>` that is not disabled.
- Disabled buttons must use `cursor-not-allowed` or `disabled:cursor-not-allowed` via Tailwind to signal non-interactivity.
- Never use a `<div>` or `<span>` as a clickable element. Use a semantic `<button>` or `<a>` and apply `cursor-pointer`.

## 7. Application rules by area

### 7.1 Navigation

- Navigation structures must remain stable across the application.
- Users must always have a clear path back to the previous context or higher-level section.
- Active location and current context must be visually and semantically identifiable.

### 7.2 Data display

- Prioritize the most useful information first.
- Use progressive detail instead of presenting all data at once.
- Empty, loading, and error states must be designed explicitly.
- Tabular information must remain readable, accessible, and usable with keyboard and screen readers.

### 7.3 Status and validation

- Status values must be explicit, readable, and consistent across the product.
- Validation rules must be communicated before or during input, not only after failure.
- Error messages must be actionable and specific.

## 8. Delivery expectations

These UX guidelines must be applied in:

- design reviews
- component implementation
- code reviews
- accessibility testing
- product acceptance criteria

Any deviation should be intentional, documented, and justified by a concrete functional or technical constraint.

## 9. Loading and saving feedback patterns

These patterns ensure consistent, accessible, and layout-stable feedback during async operations.

### 9.1 Non-blocking loading (calendar, dashboards)

Use when content should remain interactive while data loads in the background.

- Show a compact informative spinner in a **stable placeholder area** sized to prevent CLS (see section 9.5).
- Use `aria-live="polite"` and `aria-atomic="true"` on the container so screen readers announce the change without interrupting current activity.
- Use `role="status"` on the spinner message.
- **Do not disable navigation or grid controls** while loading is in progress.
- If loading fails, replace the spinner with an error message (`role="alert"`) and a **Retry** button that re-dispatches the load action.
- On screens with a visible section heading, place the spinner **inline to the right of the heading** inside a flex row. Reserve a minimum width (e.g. `min-w-[1.5rem]`) for the spinner area to prevent layout shift.
- While loading, show **skeleton placeholder cards** in the content area (animated with `animate-pulse`) so the layout is stable and the user understands that items will appear.

### 9.1.1 Heading + spinner pattern

Use this pattern for standalone dashboard screens and list pages that have a visible section heading:

```html
<div class="mb-4 flex items-center gap-3">
  <h2>{{ 'section.heading' | translate }}</h2>
  <!-- Stable spinner area: min-w prevents CLS when spinner appears/disappears -->
  <div class="min-w-[1.5rem]" aria-live="polite" aria-atomic="true">
    @if (isLoading()) {
      <svg class="h-4 w-4 animate-spin" role="status" aria-label="...">...</svg>
    }
  </div>
</div>
```

### 9.1.2 Skeleton loading pattern

Use when the number of items is expected to be similar on each load. Show 3 skeleton cards with `animate-pulse`:

```html
@if (isLoading()) {
  <ul aria-busy="true" aria-live="polite">
    @for (_ of [1, 2, 3]; track $index) {
      <li class="animate-pulse rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800">
        <div class="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div class="mt-2 h-3 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
      </li>
    }
  </ul>
}

### 9.2 Blocking loading (forms)

Use when a form must not be submitted while its initial data is loading.

- Wrap all form controls in a `<fieldset [disabled]="isDataLoading()">` to prevent interaction.
- Set `[attr.aria-busy]="isDataLoading() ? 'true' : null"` on the `<form>` element.
- Show a spinner inside the fieldset (e.g. in the first control group) as a loading indicator.
- On load failure, show a visible error banner above the form with a **Retry** button (`role="alert"`).

### 9.3 Inline spinner for save actions

Use when a user triggers a save/update/delete and the form should remain visible but clearly indicate progress.

- Place a spinner SVG **inline inside the triggering button**, before the button label.
- Set `aria-busy` on the button while the operation is in flight.
- **Disable form controls** during saving using a `<fieldset [disabled]>` wrapper; prevent duplicate submissions in component logic as well.
- When multiple action buttons exist (e.g. Save and Delete), track each operation separately so the spinner appears only on the button that was actually clicked.

### 9.4 Spinner SVG

Use a standard CSS-animated SVG spinner that inherits the button's `currentColor`, set `aria-hidden="true"` since the button or container already has a text label or `aria-label`.

### 9.5 CLS prevention

- Always reserve space for the spinner/error area so that the surrounding layout does not shift when the loading state changes. The appropriate technique depends on context: a minimum dimension (`min-w`, `min-h`), a fixed flex or grid slot, or a reserved column in a flex row all work.
- Prefer `flex` layout inside spinner containers to keep icon and text aligned without affecting surrounding layout.

## 10. Definition of done for UX

A feature is not complete unless:

- the UI is understandable without prior product knowledge
- all user-facing text is internationalized
- keyboard-only navigation works end-to-end
- semantic HTML is used correctly
- ARIA is added only where needed and correctly implemented
- feedback states are present for loading, success, warning, and error situations where relevant
- the solution aligns with the shared Angular, Tailwind CSS, and Flowbite approach
- the screen does not introduce unnecessary complexity or inconsistent patterns