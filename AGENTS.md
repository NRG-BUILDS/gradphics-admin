# Repository Guidelines

## Project Structure & Module Organization

This folder is the standalone Gradgram admin application. Build it with Vite and React. Keep route-level screens in `src/pages/`, shared layout and feature components in `src/components/`, shadcn primitives in `src/components/ui/`, reusable hooks in `src/hooks/`, and API helpers and types in `src/lib/`. Put static assets in `public/`. Organize screens by dashboard, users, support, and templates; keep route composition in `src/App.tsx`.

## Required Stack & Data Access

Use Tailwind CSS strictly as the only styling system. Apply visuals with Tailwind utility classes and theme tokens; do not add CSS modules, styled-components, Sass, inline style objects, or a competing styling framework. Limit `src/index.css` to Tailwind imports, theme tokens, and global base rules written with `@apply`. Use React Router for navigation and shadcn components for interface primitives. Use the Fetch API for network requests and centralize request state and behavior in a reusable `useRequest` hook. Keep API request and response types explicit, and expose loading, error, and success states in the UI.

## Build, Test, and Development Commands

Run commands from `admin/`. Once the Vite app is scaffolded, use its package scripts: `npm run dev` for local development, `npm run build` for a production build, and `npm run lint` or `npm run typecheck` when configured. Add a test script if a test framework is introduced, and document its command here. Do not assume scripts are available until they appear in `package.json`.

## Coding Style & Naming Conventions

Use TypeScript and functional React components. Use PascalCase for component files (`UsersPage.tsx`), camelCase for hooks and helpers (`useRequest.ts`), and descriptive names for routes and feature modules. Keep components focused, use semantic accessible HTML, and prefer existing shadcn primitives. Put layout and component styling in readable Tailwind utility classes.

## Feature Guidance

The dashboard summarizes users, revenue, and designs created. User management supports creating, searching, and viewing user profiles and their designs. Support screens show user complaints and provide replies. Template management supports uploading a template, editing its price and input fields (including labels and placeholders) through a form or JSON, deleting templates, and changing their visibility. Keep destructive actions clear and provide feedback for saves and request failures.

## Security & Configuration

Keep credentials and secrets out of source control. Store environment-specific values in local environment files and provide only safe variable names and setup guidance in documentation. Validate and handle user-provided JSON and uploaded files before submitting them.

