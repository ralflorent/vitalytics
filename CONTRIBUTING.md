# Contributing to Vitalytics

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork and set up the dev environment:
   ```bash
   nvm use
   yarn install
   yarn dev
   ```
3. Create a feature branch off `dev`:
   ```bash
   git checkout dev
   git checkout -b feat/your-feature
   ```

## Branch Naming

- `feat/<name>` — new features
- `fix/<name>` — bug fixes

All branches should be created off `dev`. PRs merge into `dev`. The `main` branch is stable and updated at sprint boundaries.

## Development

- **TypeScript** — strict mode is enabled. All new code must be `.ts`/`.tsx`.
- **Styling** — use Styled Components. Follow the existing design token pattern (`var(--color-*)`).
- **State** — use React hooks (`useState`, `useEffect`, `useCallback`). Global state lives in `localStorage`; per-conversation data in IndexedDB via Dexie.
- **Components** — functional components only. Keep them focused and composable.
- **No backend** — all processing is client-side. API calls go directly from the browser.

## Code Quality

- Run `yarn build` before submitting a PR to catch type errors
- Run `yarn test` to execute the test suite
- No hardcoded API keys or secrets
- No PII in logs, comments, or test fixtures

## Testing

Tests use Vitest with Testing Library. Run them with:

```bash
yarn test
```

When adding new features, include tests where practical, especially for:
- Utility functions and hooks
- Data layer operations (db, providers)

## Pull Requests

1. Keep PRs focused — one feature or fix per PR
2. Write a clear title and description
3. Reference related issues if applicable
4. Ensure the build passes (`yarn build`)
5. Request review from a maintainer

## Health Data Considerations

This app handles medical documents. When contributing, keep in mind:

- Never log or persist raw medical data outside IndexedDB
- PII masking must remain on the default path
- The "not medical advice" disclaimer must remain visible
- Test with synthetic data only — never use real patient data in code, tests, or screenshots

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
