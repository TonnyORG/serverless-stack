import path from "path";
import { Definition } from "./definition";
import fs from "fs-extra";
import { State } from "../../state";
import * as esbuild from "esbuild";

const BUILD_CACHE: Record<string, esbuild.BuildResult> = {};

type Bundle = {
  loader?: { [ext: string]: esbuild.Loader };
  externalModules?: string[];
  nodeModules?: string[];
  esbuildConfig?: {
    define?: { [key: string]: string };
    keepNames?: boolean;
    plugins?: string;
  };
  minify?: boolean;
};

export const NodeHandler: Definition<Bundle> = (opts) => {
  const dir = path.dirname(opts.handler);
  const ext = path.extname(opts.handler);
  const base = path.basename(opts.handler).split(".")[0];
  const file = [".ts", ".tsx", ".js", ".jsx"]
    .map((ext) => path.join(dir, base + ext))
    .find((file) => {
      const p = path.join(opts.srcPath, file);
      return fs.existsSync(p);
    })!;

  const target = State.Function.artifactsPath(
    opts.root,
    path.join(path.dirname(file), base + ".js")
  );
  const config: esbuild.BuildOptions = {
    incremental: true,
    define: opts.bundle.esbuildConfig?.define,
    keepNames: opts.bundle.esbuildConfig?.keepNames,
    entryPoints: [path.join(opts.srcPath, file)],
    bundle: true,
    external: [
      "aws-sdk",
      ...(opts.bundle.externalModules || []),
      ...(opts.bundle.nodeModules || []),
    ],
    sourcemap: "external",
    platform: "node",
    target: "node14",
    outfile: target,
  };

  return {
    build: async () => {
      const existing = BUILD_CACHE[opts.id];
      if (existing?.rebuild) {
        await existing.rebuild();
        return;
      }
      const result = await esbuild.build(config);
      BUILD_CACHE[opts.id] = result;
    },
    bundle: () => {
      esbuild.buildSync(config);
    },
    run: {
      command: "npx",
      args: ["aws-lambda-ric", target.replace(".js", ext)],
      env: {
        AWS_LAMBDA_NODEJS_USE_ALTERNATIVE_CLIENT_1: "true",
      },
    },
    watcher: {
      include: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"].map((glob) =>
        path.resolve(path.join(opts.srcPath, glob))
      ),
      ignore: [],
    },
  };
};
