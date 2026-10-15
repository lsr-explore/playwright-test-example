import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const marker = "// Generated pages are registered below.";
const validName = (name) =>
  typeof name === "string" && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name);

/** @param {import('plop').NodePlopAPI} plop */
export default function (plop) {
  plop.setGenerator("page", {
    description:
      "Create a React page, jest-axe test, Playwright axe and performance tests, and route",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Page name (kebab-case, e.g. payment-history):",
        validate: (name) => validName(name) || "Use lowercase kebab-case, e.g. payment-history.",
      },
    ],
    actions: (data) => {
      // Validate again here because CLI arguments can bypass prompt validation.
      if (!validName(data.name)) throw new Error("Use lowercase kebab-case, e.g. payment-history.");
      const parts = data.name.split("-").map((part) => part[0].toUpperCase() + part.slice(1));
      data.componentName = parts.join("") + "Page";
      data.title = parts.join(" ");
      const root = plop.getDestBasePath();
      const registry = readFileSync(join(root, "src/pages/registry.ts"), "utf8");
      const outputs = [
        `src/pages/${data.componentName}.tsx`,
        `src/pages/${data.componentName}.test.tsx`,
        `e2e/app/${data.name}.performance.spec.ts`,
        `e2e/app/${data.name}.a11y.spec.ts`,
      ];
      // Check every destination before any action, so collisions leave no partial page.
      if (
        outputs.some((path) => existsSync(join(root, path))) ||
        new RegExp(`path:\\s*["']/${data.name}["']`).test(registry) ||
        new RegExp(`\\b${data.componentName}\\b`).test(registry)
      ) {
        throw new Error("Page already exists; no files were changed.");
      }
      if (!registry.includes(marker))
        throw new Error("Page registry marker is missing; no files changed.");
      return [
        { type: "add", path: outputs[0], templateFile: "plop-templates/page/page.tsx.hbs" },
        { type: "add", path: outputs[1], templateFile: "plop-templates/page/page.test.tsx.hbs" },
        {
          type: "add",
          path: outputs[2],
          templateFile: "plop-templates/page/page.performance.spec.ts.hbs",
        },
        {
          type: "add",
          path: outputs[3],
          templateFile: "plop-templates/page/page.a11y.spec.ts.hbs",
        },
        {
          type: "modify",
          path: "src/pages/registry.ts",
          transform: (content) =>
            `import { ${data.componentName} } from './${data.componentName}';\n` +
            content.replace(
              marker,
              `{ path: '/${data.name}', title: '${data.title}', component: ${data.componentName} },\n  ${marker}`,
            ),
        },
      ];
    },
  });
}
