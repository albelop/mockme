import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import * as prettier from "prettier";
import { mockSchema } from "../common/schemas.js";

export default async function createMocksAction({ config: configFileName }) {
  try {
    const config = await import(join(process.cwd(), configFileName));
    generateMocksFile(
      config.default.output,
      await processPlugins(config.default.plugins)
    );
  } catch (error) {
    console.log(`${configFileName} was not found.`);
  }
}

function mockKey(mock) {
  return [
    mock.request.method,
    mock.request.path,
    mock.scenario,
    JSON.stringify(mock.request.conditions || "default"),
  ]
    .filter((x) => x)
    .join("--")
    .toLowerCase();
}

async function processPlugins(plugins = []) {
  const pluginsOutput = await Promise.all(
    plugins.map((plugin) => Promise.resolve().then(() => plugin()))
  );

  // Validate plugins output
  const validMocks = pluginsOutput
    .filter((x) => x)
    .flat()
    .map(mockSchema.parse.bind(mockSchema));

  // Reduce valid mocks to avoid duplications
  return validMocks.reduce((mocks, mock) => {
    mocks.set(mockKey(mock), mock);
    return mocks;
  }, new Map());
}

async function generateMocksFile(output = "mockme.js", mocks = []) {
  if (mocks.length === 0)
    return console.log("No mocks generated, nothing to write.");

  const prettierOptions = await prettier.resolveConfig(process.cwd(), {
    editorconfig: true,
  });

  const FnReplacements = {};
  let content = `export default ${JSON.stringify(
    [...mocks.values()],
    (key, value) => {
      if (typeof value === "function") {
        const fnKey = `Fn_${Object.keys(FnReplacements).length}`;
        FnReplacements[fnKey] = value;
        return fnKey;
      }
      return value;
    }
  )}`;
  content = await prettier.format(
    Object.keys(FnReplacements).reduce((result, key) => {
      return result.replace(`"${key}"`, FnReplacements[key].toString());
    }, content),
    // @ts-ignore
    { parser: "babel", ...prettierOptions }
  );

  await writeFile(join(process.cwd(), output), content, "utf-8");

  console.log("Mocks file generated!");
}
