import { join } from "node:path";
import { mockSchema } from "../schemas.js";
import createServiceWorker from "./createServiceWorker.js";

export default async function createMocksAction(
  { config: configFileName },
  command
) {
  try {
    const config = await import(configFileName);
    createServiceWorker(
      config.default.output,
      await processPlugins(config.default.plugins)
    );
  } catch (error) {
    command.error(`${configFileName} was not found.`);
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
