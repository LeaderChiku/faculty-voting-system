const fs = require("fs");
const path = require("path");

// Keep installs consistent across environments.
// - Enforces pnpm usage (blocks npm/yarn installs)
// - Removes root lockfiles that can conflict with pnpm
const rootDir = path.resolve(__dirname, "..");

const userAgent = process.env.npm_config_user_agent || "";
const isPnpm = userAgent.startsWith("pnpm/");

if (!isPnpm) {
  // npm/yarn user agents typically won't match pnpm/<version>
  console.error("Use pnpm instead of npm/yarn for this workspace.");
  process.exit(1);
}

for (const lockfile of ["package-lock.json", "yarn.lock"]) {
  try {
    fs.rmSync(path.join(rootDir, lockfile), { force: true });
  } catch {
    // ignore
  }
}

