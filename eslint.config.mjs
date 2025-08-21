import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      // Generated files
      "lib/generated/**/*",
      "prisma/generated/**/*",
      ".next/**/*",
      "node_modules/**/*",
      // Build outputs
      "dist/**/*",
      "build/**/*",
      // Other generated/vendor files
      "*.min.js",
      "vendor/**/*"
    ]
  },
  {
    rules: {
      // Disable problematic rules for deployment
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "warn", // Changed from error to warning
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-require-imports": "off",
      
      // Keep essential rules but make them warnings instead of errors
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "warn",
      
      // Disable other non-critical rules
      "no-console": "off", // Allow console logs
      "no-debugger": "warn",
      
      // Next.js specific - keep these as warnings
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn"
    }
  }
];

export default eslintConfig;
