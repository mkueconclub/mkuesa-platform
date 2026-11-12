import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const root = process.cwd();

/** All files under a folder (relative to the project root), skipping build output and dependencies. */
export function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const name of readdirSync(join(root, dir))) {
    const rel = join(dir, name);
    if (name === "node_modules" || name === ".next") continue;
    if (statSync(join(root, rel)).isDirectory()) out.push(...walk(rel, exts));
    else if (exts.some((e) => name.endsWith(e))) out.push(rel.split("\\").join("/"));
  }
  return out;
}

export const read = (rel: string) => readFileSync(join(root, rel), "utf8");
export const srcFiles = () => walk("src", [".ts", ".tsx"]);
export const sqlFiles = () => walk("supabase/migrations", [".sql"]).sort();
export { relative };
