"use client";

/**
 * Official Next.js App Router pattern (boneyard docs site):
 * apps/docs/src/bones/registry-client.tsx
 *
 * Server `layout.tsx` must not side-effect-import the registry alone.
 * Mount this client component so `registerBones` runs in the browser bundle.
 */
import "@/bones/registry";

export default function BoneRegistryInit() {
  return null;
}
