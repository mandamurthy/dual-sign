# Dual Sign

A modern, robust, and user-friendly React-based web application designed for any user community (operations, finance, or other teams). Dual Sign streamlines user onboarding, environment management, and the Maker-Checker process for file adjustments, with comprehensive audit tracking and role-based access.

---

## Repository

The source code is managed using Bitbucket.

- **Repository URL:** `https://bitbucket.org/your-org/dual-sign` (replace with actual URL)
- **Clone the repository:**
  ```powershell
  git clone https://bitbucket.org/your-org/dual-sign.git
  cd dual-sign
  ```

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [User Roles](#user-roles)
- [Environments](#environments)
- [Maker-Checker Workflow](#maker-checker-workflow)
- [Audit & Compliance](#audit--compliance)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

**Dual Sign** is a user interface for any user team to manage, review, and audit file changes that require a Maker-Checker process. The application supports multiple user roles, environment configurations, and a comprehensive Maker-Checker process. It is designed for generic use across different domains, not limited to financial operations.

---

## Features

- Modern, responsive UI for daily operational use
- User onboarding with role assignment (Admin, Developer, Tester, Maker, Checker, ReadOnly, SuperUser)
- Project onboarding: add new reporting systems ("Projects") with:
  - Project Name
  - Products (files/products to undergo Maker-Checker process, with descriptions)
  - Path (location of files for Maker-Checker process)
- Environment management (Development, SIT, UAT, DR, Production)
- Maker-Checker workflow for file management:
  - File listing by date, environment, and project
  - Download, upload, and version control for files
  - Review, approve, or reject changes with comments
- Audit trail for all actions and changes (for compliance and regulatory review)
- Granular, maintainable React component structure

---

## User Roles & Project Structure

- Roles are created and managed per project
- Users are onboarded and mapped to roles within each project
- Each project can have its own set of users and roles
- Projects contain multiple products/files, each going through the Maker-Checker process
- Maker and Checker processes are executed by users assigned to those roles within a project

---

## Environments

- **Development**
- **SIT (System Integration Testing)**
- **UAT (User Acceptance Testing)**
- **DR (Disaster Recovery)**
- **Production**

All features and configurations are environment-aware for seamless transitions and testing.

---

## Maker-Checker Workflow

### Maker

- Selects a date to view available files
- For each file:
  - **Download**: Get the latest version
  - **Upload**: Submit a new version (triggers Checker approval)
  - **Display Versions**: View all versions, upload times, and approval statuses
  - **Download Specific Version**: Retrieve any previous version
  - **Restore To Specific Version**: Overwrite with a selected version

### Checker

- Views pending approval tasks
- For each file:
  - **Review Changes**: See differences between versions
  - **Approve**: Accept changes, update file, and generate Done.txt
  - **Reject**: Discard changes with comments

---

## Audit & Compliance

- All actions (uploads, approvals, rejections, restores) are logged
- Audit trail available for review and compliance purposes
- Audit logs are designed to meet financial industry regulations and compliance requirements for Maker-Checker workflows

---

## Project Structure

```
dual-sign/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── Components/
│   │   └── ListGroup.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── main.tsx
│   ├── Message.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
```

> The codebase is organized for scalability and maintainability, with granular React components.

---

## Getting Started

1. **Clone the repository**

   ```powershell
   git clone https://bitbucket.org/your-org/dual-sign.git
   cd dual-sign
   ```

2. **Install dependencies**

   ```powershell
   npm install
   ```

3. **Start the development server**

   ```powershell
   npm run dev
   ```

4. **Open in browser**
   - Visit [http://localhost:5173](http://localhost:5173)

---

## Tech Stack

- React JS (TypeScript)
- Vite (build tool)
- Modern CSS (with support for theming)
- Redux for state management
- Additional libraries for UI/UX and file management as needed

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

---

## License

[MIT License](LICENSE)

---

## Recommended Implementation Approach

To ensure a robust and maintainable build, follow this implementation order:

1. **User Onboarding**
   - Implement user registration, authentication, and role assignment.
   - Set up role management (Admin, Developer, Tester, Maker, Checker, ReadOnly, SuperUser).
   - This is foundational, as all other features depend on user identity and permissions.
2. **Environment Onboarding**
   - Build the ability to define and manage environments (Development, SIT, UAT, DR, Production).
   - Make sure environment selection/configuration is available for users and projects.
3. **Project with Products/Files Onboarding**
   - Allow onboarding of new projects, including:
     - Project name
     - Products/files (with descriptions)
     - File paths
   - Map users and roles to specific projects.
4. **Maker and Checker Process**
   - Implement the core Maker-Checker workflow:
     - File listing, versioning, upload/download, approval/rejection, audit trail.
   - Integrate with user roles, environments, and project structure.

> This order ensures a solid, extensible foundation and smooth integration of all features.

---

## Current Status (as of June 14, 2025)

- Project scaffolded with Vite + React + TypeScript.
- Material-UI integrated for a modern, responsive UI.
- Sidebar navigation with icons for all major features.
- User Onboarding: Add/edit/delete users, assign roles per environment, localStorage sync, clean UI.
- Environment Onboarding: Add/edit/delete environments, localStorage sync, clean UI.
- Project Onboarding: Add/edit/delete projects and products, assign products to projects/environments, file path and pattern configuration, localStorage sync, clean UI.
- Maker-Checker Process:
  - Role, Project, Environment, Product dropdowns are on a single line, spaced and non-overlapping.
  - File listing for selected product, showing real files from workspace folders matching the configured pattern.
  - File names left-aligned, action buttons (Download, Upload, Display Versions, Restore To Version) right-aligned for each file.
  - Frame dynamically resizes and is left-aligned for a professional look.
- Audit Trail: Dedicated tab, visible to all users, showing all audit events.
- All UI/UX improvements as per feedback (alignment, spacing, dropdowns, etc.).
- README updated with implementation approach and tech stack.

## Pending / Next Steps

- Pending verification on Audit displayed on UI.
- Pagination addition is pending.
- ElasticSearch integration is pending.
- Access control is pending.
- Moving away from localStorage to backend API for all tabs is pending.
- Product path logic is currently hardcoded and needs to be adjusted for unique paths per product/project.
- Wire up file action buttons (Download, Upload, Display Versions, Restore To Version) in Maker-Checker tab.
- Implement file versioning, approval/rejection, and Maker-Checker workflow logic.
- Add backend/API integration for real file system access (currently, file listing works for workspace folders only; remote/server folders will require backend support).
- Add authentication and user session management.
- Advanced validation, error handling, and accessibility improvements.
- Further UI/UX refinements as needed.
- Update documentation as new features are added.

---

_Last updated: June 14, 2025_
