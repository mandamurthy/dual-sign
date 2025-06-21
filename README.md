Rules to Github by Copilot :

1. Do not execute premium request without taking the confirmation.
2. Coding should be modular, wherever funcationlaity can be reusable do code in such a way.
3. When recovering or fixing, always check the README.md for open issues and rules before proceeding.
4. When migrating from localStorage to backend, ensure all CRUD, versioning, and UI flows are tested and match previous behavior.
5. For any UI action (like View Diff), ensure the user experience matches or improves upon the previous implementation.

# Dual Sign

A modern, robust React-based web application for user onboarding, environment/project/product onboarding, and a Maker-Checker process, with full audit and role-based access. Built with Vite, React, TypeScript, and Material-UI. Data is persisted in localStorage for now.

## Features

### Completed (as of June 18, 2025)

- Project Scaffold: Vite + React + TypeScript.
- Material-UI Integration: Modern, responsive UI.
- Sidebar Navigation: With icons for each feature.
- User Onboarding: Add/edit/delete users, assign to environments and roles. Data persists in localStorage.
- Environment Onboarding: Add/edit/delete environments. Data persists in localStorage.
- Project Onboarding: Add projects and products, including Retention Days, Audit Path, Audit Capture Approach, and Audit Log Granularity (Diff Lines/Diff Columns). Product onboarding supports Product Submit File Prefix, file pattern matching, and Audit Must Columns (pipe-delimited).
- Maker-Checker Process: Full file versioning, diff, approval/reject, and submission flows. Only one version can be under review at a time. All actions require comments and provide clear feedback.
- Checker Tab: Modern modal for review (View Diff, Download, Approve, Reject, Approve & Submit). Status and comments are shown in both Maker and Checker UIs.
- Audit Logging: Robust, production-grade audit logging on backend after Checker approval. Audit logs are reliably created in correct folder structure, with all required metadata and diff. Audit logs are immutable and write-once. Diff logic supports both Diff Lines and Diff Columns granularity, and always includes must columns.
- Audit Log Viewer: Modern UI for viewing audit logs, with filtering by project, file, maker, checker, action, and date. Full details and diff viewer for each log entry. Download/export option for JSON and Excel logs. CSV download removed.
- Audit Log Index: Fast lookup via audit-index.json. All audit log writes update the index for scalable search.
- Retention/Cleanup: Audit logs are cleaned up based on retention days per project.
- All debug output removed for production. Only user-facing error messages remain.
- Audit log diff text output now always uses encapsulated quotes, matching the original CSV quoting.
- Audit Trail date filter defaults to today's date; user can clear for ALL or pick a specific date.
- Codebase cleaned of unused variables and debug logic.
- **Versioning:** All uploaded versions now use timestamp-based identifiers (VYYYYMMDDHHMMSS) instead of numeric (V1, V2, ...), with V0 reserved for the workspace. All version usage (DiffViewer, Audit Log, Display Versions modal, downloads, etc.) is consistent with the new format.
- **Download Fixes:** Download logic for V0 and versioned files in the Display Versions modal is unified and fixed. No hardcoded paths; all file operations use parameterized paths from onboarding/product config.
- **Audit Log Local Time:** Audit log filenames now use local (Singapore) time, and the timestamp field in the log uses the local time string from the frontend.
- **Granular Debug Logging:** Backend audit log creation now includes granular debug logging for every step, aiding troubleshooting and transparency.
- **Audit Trail Pagination:** Audit Trail tab supports pagination and filtering for scalable log browsing.

## Pending / Next Steps

- Access control for Audit tab and all sensitive actions.
- Move away from local storage for all tabs (users, environments, projects, products, tasks, audit logs) to backend APIs.
- Product path logic: allow unique path per product/project.
- **OPEN ISSUES (as of June 21, 2025):**
  - [ ] View Diff link in snackbar after upload does not always appear or work as expected. Should always open the diff viewer for the latest version.
  - [ ] Uploaded versions are not always displayed in the modal after upload. Modal should open and show the new version immediately.
  - [ ] Ensure all versioning, diff, and download flows are fully migrated from localStorage to backend API, including for Checker and Audit tabs.
  - [ ] Remove all remaining localStorage usage for tasks, checker flows, and any other state.
  - [ ] Test and validate all Maker/Checker flows after backend migration, including edge cases and error handling.
  - [ ] Document any UI/UX differences or regressions from the localStorage version for future recovery.
- Further workflow automation and audit trail improvements as needed.
- Add authentication and user session management.
- Advanced validation, error handling, and accessibility improvements.
- Further UI/UX refinements as needed.
- Update documentation as new features are added.

---

_Last updated: June 21, 2025_

This README is up to date with the current state of the Maker-Checker workflow and UI. Use this as a reference for future development or memory recovery.
