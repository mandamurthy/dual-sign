# Dual Sign

A modern, robust React-based web application for user onboarding, environment/project/product onboarding, and a Maker-Checker process, with full audit and role-based access. Built with Vite, React, TypeScript, and Material-UI. Data is persisted in localStorage for now.

## Features

### Completed (as of June 15, 2025)

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

## Pending / Next Steps

- Pagination addition for Audit Trail tab.
- Elastic search integration for scalable audit log search.
- Access control for Audit tab and all sensitive actions.
- Move away from local storage for all tabs (users, environments, projects, products, tasks, audit logs) to backend APIs.
- Product path logic: allow unique path per product/project.
- Further workflow automation and audit trail improvements as needed.
- Add authentication and user session management.
- Advanced validation, error handling, and accessibility improvements.
- Further UI/UX refinements as needed.
- Update documentation as new features are added.

---

_Last updated: June 15, 2025_

# Dual Sign Maker-Checker Workflow

## Status as of June 15, 2025

### Completed Features

- Maker-Checker workflow is robust and production-ready for file versioning, approval, and submission.
- Maker can upload new versions, view diffs, send to Checker (with required comment), and drop approval.
- Only one version can be under review at a time; UI disables actions as appropriate.
- Checker tab displays all pending tasks, with a modern modal for review (View Diff, Download, Approve, Reject, Approve & Submit), and requires a comment for all actions.
- Download button in Checker modal includes timestamp in filename.
- Status and comments from Checker are shown in Maker's Display Versions modal, with modern UI.
- Both Maker and Checker comments are visible in the workflow.
- "Restore To Version" and "Replace" actions removed from Maker UI and code.
- Product onboarding supports "Product Submit File Prefix" as a required field.
- File pattern matching supports wildcards (e.g., *.csv, *City\*).
- "Submit" button in Maker modal creates a file named Product+ProductSubmitFilePrefix.txt in the product path, enabled only when Checker action is Approved. After submit, button is renamed "SUBMITTED" and disabled.
- After Checker approves, the approved version is written to the product file path before status is updated.
- "Approve & Submit" in Checker modal performs both: replaces the file in the product path and creates the submit file, with full feedback.
- Snackbar feedback is provided for all major Checker actions (Approve, Reject, Approve & Submit, View Diff), making the UI user-friendly for Checkers.
- All UI/UX changes maintain modular, maintainable code structure.
- Audit log diff text output now always uses encapsulated quotes, matching the original CSV quoting.
- Audit Trail date filter defaults to today's date; user can clear for ALL or pick a specific date.
- Codebase cleaned of unused variables and debug logic.

### Pending / Next Steps

- Pagination addition for Audit Trail tab.
- Elastic search integration for scalable audit log search.
- Access control for Audit tab and all sensitive actions.
- Move away from local storage for all tabs (users, environments, projects, products, tasks, audit logs) to backend APIs.
- Product path logic: allow unique path per product/project.
- Further workflow automation and audit trail improvements as needed.
- Add authentication and user session management.
- Advanced validation, error handling, and accessibility improvements.
- Further UI/UX refinements as needed.
- Update documentation as new features are added.

---

This README is up to date with the current state of the Maker-Checker workflow and UI. Use this as a reference for future development or memory recovery.
