# Image Analysis Component Simplification Plan

- [x] **Centralize State Management:**
    - [x] Choose approach: `useReducer` or State Machine (e.g., XState/Zustand).
    - [x] Define combined state object (`WizardState`).
    - [x] Define action types/events (`WizardAction` / Events).
    - [x] Implement reducer function or state machine configuration.
- [x] **Fix Hook Implementation Issues:**
    - [x] Fix `useImageAnalysisWizard.ts` export type (changed from `default` to named export)
    - [x] Fix import paths and resolve "Cannot find module '../types'" issue
    - [x] Ensure `reducer` and `initialState` are properly defined
    - [x] Update imports in `ImageAnalysisWizardContext.tsx` to match the hook's export style
- [x] **Extract Logic into Custom Hook (`useImageAnalysisWizard`):**
    - [x] Create `useImageAnalysisWizard` hook.
    - [x] Move state logic (reducer/machine) into the hook.
    - [x] Move action handlers (`handleAnalyzeImages`, `handleSave`, etc.) into the hook, using `dispatch` or sending events.
    - [x] Integrate `useWebcam` logic within the hook.
    - [x] Return state and action dispatchers/functions from the hook.
- [x] **Use Context API for State/Action Distribution:**
    - [x] Create `ImageAnalysisWizardContext`.
    - [x] Implement Provider in `ImageAnalysisCapture` using the custom hook's return value.
    - [x] **Update step components (`wizard-steps/*`) to use `useContext` instead of props for state/actions.**
        - [x] UpdateUpcStep (completed)
        - [x] UpdatePrimaryStep (completed)
        - [x] UpdateNutritionStep (completed)
        - [x] UpdateIngredientsStep (completed)
- [x] **Add Missing Action Handlers in Hook:**
    - [x] Implement `goToNextStepFromReview` action for smarter transitions
    - [x] Implement `retakeImage` action that handles clearing state and navigation
    - [x] Update components to use these more specific actions
- [x] **Refactor `ImageAnalysisCapture` Component (In Progress):**
    - [x] Create `ImageAnalysisCaptureV2.tsx`.
    - [x] Implement basic structure using Provider/Context.
    - [x] Implement `handleFileChange` and `renderImageCaptureControls` using Context.
    - [x] Render step components based on context state.
    - [x] Implement Final Review step layout fully (form fields).
    - [x] Fix type errors related to imageState.previewUrl access (Defined `ImageStateWithPreview` locally)
    - [x] Fix JSX syntax errors.
    - [ ] Address ingredient update type errors (Used TEMP `as any` workaround - requires proper hook fix).
- [x] **Refine Step Transition Logic:**
    - [x] Moved basic transition logic into reducer.
    - [x] Remove/refactor `determineNextStep` logic from step components.
    - [x] Add logic to handle `activeImageType` setting during transitions.
    - [x] Centralize "next step" logic in the hook rather than components
- [ ] **Improve Error Handling:**
    - [x] Centralized `error` state in hook.
    - [x] Display basic error in Final Review step.
    - [x] Added basic Retry action and button in Final Review.
    - [x] Adjusted reducer logic to stay on step or revert to capture on error (not reset all).
    - [ ] Implement specific error display within steps/layout.
    - [ ] Enhance retry logic to re-trigger specific failed actions.
- [ ] **Testing:**
    - [ ] Add/update unit/integration tests for the hook and components.
- [ ] **Final Integration:**
    - [ ] Replace original `ImageAnalysisCapture` with V2 version
    - [ ] Ensure all imports are updated across the application
    - [ ] Fix underlying type issue for ingredient updates in the hook (remove `as any`).

## Remaining Tasks
1. Fix underlying type issue for ingredient updates in `useImageAnalysisWizard.ts` (remove `as any` from `ImageAnalysisCaptureV2`).
   - Ensure `UPDATE_FORM_FIELD` action type handles array/object keys correctly.
2. Implement specific error display and enhance retry logic
    - Add more granular error display in each step component (e.g., analysis steps).
    - Implement retry buttons for analysis and save operations.
    - Enhance `retryLastAction` in hook to re-trigger specific failed actions.
3. Add unit tests for the hook and components
    - Write tests for the reducer logic
    - Test step transitions and form field updates
4. Replace original component with V2 version and update imports
    - Update any code that imports the original component
    - Test the integration thoroughly

## Implementation Notes
- We've successfully updated the hook to use named exports and fixed all the module imports
- All step components now use the correct prop names for ReviewStepLayout
- The hook now includes additional action handlers for smart transitions and retaking images
- The form fields in the final review step have been implemented
- JSX/Structural errors in `ImageAnalysisCaptureV2` fixed.
- Type errors for `previewUrl` access fixed locally.
- Type errors for ingredient updates temporarily silenced with `as any`.
