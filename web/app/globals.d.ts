// TypeScript has no built-in type declarations for plain (non-module) CSS
// side-effect imports like `import "./globals.css";`. Next.js's bundler
// handles the actual CSS import at build/runtime — this file only satisfies
// the TypeScript compiler during type-checking (tsc / the editor's TS
// server). Without it, TS reports TS2882 "Cannot find module or type
// declarations for side-effect import of './globals.css'."
declare module "*.css";