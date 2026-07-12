export async function loadTestEnvFiles() {
  for (const relativePath of [".env", ".env.local"]) {
    const file = Bun.file(`${import.meta.dir}/../../${relativePath}`);

    if (!(await file.exists())) {
      continue;
    }

    const text = await file.text();

    for (const line of text.split("\n")) {
      const trimmed = line.trim();

      if (trimmed.length === 0 || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (key.length > 0 && Bun.env[key] === undefined) {
        Bun.env[key] = value;
      }
    }
  }
}
