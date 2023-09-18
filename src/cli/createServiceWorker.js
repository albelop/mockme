import { dirname, join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import * as esbuild from "esbuild";

export default async function (output = "sw.js", mocks = []) {
  const FnReplacements = {};

  const mocksContent = JSON.stringify([...mocks.values()], (_, value) => {
    if (typeof value === "function") {
      const fnKey = `Fn_${Object.keys(FnReplacements).length}`;
      FnReplacements[fnKey] = value;
      return fnKey;
    }
    return value;
  });

  let formattedContent = `import { sw } from "mockme";
  sw(self, ${Object.keys(FnReplacements).reduce((result, key) => {
    return result.replace(`"${key}"`, FnReplacements[key].toString());
  }, mocksContent)});`;

  const esbuildOptions = {
    stdin: {
      contents: formattedContent,
    },
    bundle: true,
    write: false,
    format: "esm",
  };

  if (process.env.MOCKME_TEST) {
    esbuildOptions.alias = {
      mockme: "./src/index.js",
    };
  }
  // @ts-ignore
  let { outputFiles } = await esbuild.build(esbuildOptions);

  await mkdir(dirname(output), { recursive: true });
  // @ts-ignore
  await writeFile(join(process.cwd(), output), outputFiles[0].text, "utf-8");

  console.log("Service worker file generated!");
}
