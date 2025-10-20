/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Avoid failing production builds on ESLint rule violations.
  // See: https://nextjs.org/docs/app/api-reference/config/eslint#ignoreduringbuilds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default config;
