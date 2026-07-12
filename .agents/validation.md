# Validation Architecture

- Form validation must be modular and colocated: schemas in route `_lib/*-schema.ts`, defaults and transforms in `_lib/*-helpers.ts`, server invariants in `src/modules/*` service or `_lib` helpers.
- **Client-side validation is for UX only.** Every persisted mutation must re-validate the same business invariants on the server/module path before writing data.
- React Hook Form forms must use realtime validation: `mode: "onChange"` or `"all"`, `reValidateMode: "onChange"`, `shouldFocusError: true`.
- Validation UI must connect errors to controls: `data-invalid` on `Field` wrappers, `aria-invalid` on the actual input/select/textarea/checkbox/switch.
- Do not hand-code repeated field wiring. Extract reusable field components when the same label/control/error pattern appears more than twice.
- Required-field UX must be immediate: realtime updates as the user edits, submit focuses the first invalid field, error text rendered adjacent to the control.
- When a frontend schema has cross-field rules, mirror those persisted rules in the module path and add focused tests under `test/`.

Enforced by lint rule `local/require-live-form-validation` where applicable.
