// TypeScript 7 reports TS2882 for a side-effect import with no type declaration.
// @fontsource-variable/* ships CSS only; the bundler resolves it, so the import
// never reaches the TypeScript module resolver.
declare module "@fontsource-variable/*";
declare module "*.css";
