# Dual Sign

A modern, robust React-based web application for user onboarding, environment/project/product onboarding, and a Maker-Checker process, with full audit and role-based access. Built with Vite, React, TypeScript, and Material-UI. Data is persisted in localStorage for now.

## Features

### Completed (as of June 8, 2025)

- **Project Scaffold**: Vite + React + TypeScript.
- **Material-UI Integration**: Modern, responsive UI.
- **Sidebar Navigation**: With icons for each feature.
- **User Onboarding**:
  - Add users, assign to multiple environments and roles.
  - Edit and delete users.
  - Data persists in localStorage and syncs across navigation/tabs.
  - UI split into "Add User" and "User List" frames, side by side, with proper alignment and no overlap.
- **Environment Onboarding**:
  - Add, edit, and delete environments.
  - Data persists in localStorage and syncs across navigation/tabs.
- **Project Onboarding**:
  - Add new projects with Project Name and Environment.
  - List all onboarded projects in a separate frame.
  - Add new products with Project Name (dropdown: "ProjectName | Environment"), Product Name, File Path (as hyperlink with copy button), and File Pattern.
  - List all products in a separate frame, with clean layout and truncated/copyable file paths.
  - All onboarding frames are centered and have fixed min/max widths for clean layout.
- **Maker-Checker Process**:
  - Role, Project, Environment, Product dropdowns are on a single line, spaced and non-overlapping.
  - File listing for selected product, showing real files from workspace folders matching the configured pattern.
  - File names left-aligned, action buttons (Download, Upload, Display Versions) right-aligned for each file.
  - **Restore To Version** button and functionality have been removed from the Maker-Checker UI (June 8, 2025).
  - Frame dynamically resizes and is left-aligned for a professional look.
- **Display Versions Modal**:
  - Lists all versions (workspace and uploaded), with actions for View Diff, Download, Replace, Drop Version.
  - **Send To Checker** button added for each non-current version (currently disabled; will be enabled with approval workflow).
  - All actions have confirmation dialogs where appropriate.
- **Diff View**: Modern, user-friendly CSV diff with column selection, sorting, and record filtering. Cell-level diff highlighting (including quoted values).
- **Versioning**: Each upload creates a new version (v1, v2, ...), never overwriting previous uploads. All versions are listed in a modal with metadata.
- **Download Naming**: Downloaded versioned files include version and upload timestamp in the filename.
- **Replace (Simulated)**: Replacing a version updates the simulated workspace file in localStorage, which is used for all future diff and download actions.
- **UI Consistency**: All action buttons in the modal and main page have a consistent, modern outlined style.
- **Snackbar Feedback**: Uploads and actions provide clear feedback, including a working View Diff link.
- **Audit Trail**: Dedicated tab, visible to all users, showing all audit events.
- **README.md**:
  - Updated to reflect project renaming, structure, implementation approach, and current status (as of June 8, 2025).

## Pending / Next Steps

- Implement approval/reject workflow for checker, with status tracking and integration with the new 'Send To Checker' and 'Replace' actions.
- Wire up 'Send To Checker' button to initiate the approval process (currently disabled placeholder).
- Log all actions (upload, replace, drop, approve, reject) and display in a dedicated Audit Trail tab.
- Add backend/API integration for real file system access (currently, file listing works for workspace folders only; remote/server folders will require backend support).
- Add authentication and user session management.
- Advanced validation, error handling, and accessibility improvements.
- Further UI/UX refinements as needed.
- Update documentation as new features are added.

## How to Resume

- Start with the Maker-Checker process: connect file management to onboarded projects/products, add approval/rejection, and audit trail.
- Add audit/compliance logging for all onboarding and file actions.
- Plan for authentication and backend integration if moving beyond localStorage.

---

_Last updated: June 8, 2025_

# Dual Sign Maker-Checker Workflow

## Status as of June 8, 2025

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

### Pending / Next Steps

- Further workflow automation and audit trail improvements as needed.
- Add backend/API integration for real file system access and multi-user support.
- Add authentication and user session management.
- Advanced validation, error handling, and accessibility improvements.
- Further UI/UX refinements as needed.
- Update documentation as new features are added.

---

This README is up to date with the current state of the Maker-Checker workflow and UI. Use this as a reference for future development or memory recovery.
