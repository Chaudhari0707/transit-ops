# Image Rules

- For SVG sources, add the `unoptimized` prop to `next/image` — Next.js auto-applies this when `src` ends in `.svg`, but explicit is required for clarity.
- Set `width` and `height` to match the SVG's actual aspect ratio. Do not use equal or arbitrary values.
- Do not use the `priority` prop — deprecated in Next.js 16. Use `loading="eager"` for above-fold images instead.
- For light/dark SVG variants, use CSS display toggling (`dark:hidden` / `dark:block`). Do not conditionally render with JS.
