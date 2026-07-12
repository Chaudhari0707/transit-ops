# Performance and Data Fetching

- Follow YAGNI: do not add custom cross-tab sync, localStorage propagation, polling, or WebSockets unless a concrete requirement exists.
- Use `revalidatePath` / `revalidateTag` in Server Actions for server-side cache invalidation after mutations.
- Perform list sorting, filtering, and pagination at the **database query level** via Drizzle. Do not pull full snapshots and sort client-side.
- Keep route middleware / proxy as a coarse request gate only — no business rules or authorization logic there.
- Wrap auth/cookie readers in `Suspense` when using Next.js 16 `cacheComponents` to permit static prerendering.
- Prefer server components for data fetching; push client components to leaf nodes that need interactivity.
