# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Raycast extension for Kotobaten, a Japanese language learning application. The extension provides quick access to search words and add new vocabulary items directly from Raycast. It integrates with the Kotobaten API backend hosted on Azure Container Apps.

## Build and Development Commands

### Development
```bash
npm run dev          # Start development mode with hot reload
npm run build        # Build the extension for distribution
npm run lint         # Run ESLint to check for issues
npm run fix-lint     # Auto-fix linting issues
npm run publish      # Publish the extension to Raycast store
```

## Architecture

### Entry Points
The extension has two main commands and three AI tools:
- **Commands** (user-facing UI):
  - `src/search.tsx` - Full-text search interface for both user collection and dictionary
  - `src/add-word.tsx` - Form to add new words to collection
- **AI Tools** (for Raycast AI to use):
  - `src/tools/collection-search.ts` - Search user's learned words
  - `src/tools/dictionary-search.ts` - Search the full Japanese dictionary
  - `src/tools/add-word-tool.ts` - Add words programmatically

### Core Services Layer
Located in `src/services/`:
- **api.ts** - All backend API communication (login, search, add words, reset progress)
- **authentication.ts** - Token management using Raycast LocalStorage
- **validation.ts** - Form validation utilities

### Authentication Flow
1. All protected views use `useRedirectIfUnauthenticated()` hook
2. Hook checks for token in LocalStorage and redirects to `authenticate.tsx` if missing
3. API calls automatically handle 401 responses by clearing token via `logoutIfNeeded()`
4. Backend URL: `https://kotoprdapiapp.salmonsmoke-5b2676a9.northeurope.azurecontainerapps.io/`

### Data Types
Core types in `src/types/`:
- **StackCard** - User's saved vocabulary with progress tracking (retention scores, practice queue status)
- **DictionaryCard** - Dictionary entries with senses and parts of speech
- **SearchResult** - Unified response containing both stack cards and dictionary cards

### Key Patterns

#### Request Cancellation
The search view implements proper request cancellation using AbortController to prevent race conditions when user types quickly.

#### Form Validation
Forms use real-time validation with error states displayed inline. Validation occurs on both change and blur events.

#### API Error Handling
All API calls follow the pattern:
```typescript
try {
  const response = await axios.post/get(...)
  // handle success
} catch (error) {
  await logoutIfNeeded(error) // Auto-logout on 401
  // handle failure
}
```

#### Navigation
Uses Raycast's navigation stack - protected views push `<Authenticate />` when token is missing, then pop back on successful login.

## Development Notes

### Adding New API Endpoints
1. Add the path constant at top of `src/services/api.ts`
2. Create the function using `createAuthenticationHeaders(token)` helper
3. Add error handling with `logoutIfNeeded(error)` in catch block

### Adding New Commands
1. Add command definition to `package.json` under `commands` array
2. Create corresponding `.tsx` file in `src/`
3. Use `useRedirectIfUnauthenticated()` for protected views
4. Use `requireToken()` to get auth token for API calls

### Adding New AI Tools
1. Add tool definition to `package.json` under `tools` array
2. Create corresponding file in `src/tools/`
3. Export default async function with typed Input parameter
4. Return structured data (not JSX) for AI consumption
