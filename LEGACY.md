# Previous portfolio

The portfolio that existed before the 2026 redesign is preserved under the
`legacy/pre-redesign` tag at commit `cf9f8bf`.

Preview or restore it locally:

```bash
git switch --detach legacy/pre-redesign
npm install
npm run dev
```

Return to the current site:

```bash
git switch main
```

To restore the previous design on `main`, create a new branch from the
`legacy/pre-redesign` tag and merge or deploy that branch. Avoid rewriting `main`
history so both versions remain recoverable.
