import { configDefaults, defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    // ponytail: stray .claude/worktrees/* checkouts contain their own test files;
    // without this exclude vitest picks them up too and duplicates/breaks the run
    exclude: [...configDefaults.exclude, ".claude/**"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
