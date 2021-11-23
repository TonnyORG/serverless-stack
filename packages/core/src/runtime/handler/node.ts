import path from "path";
import { Definition } from "./definition";
import fs from "fs-extra";
import { State } from "../../state";
import spawn from "cross-spawn";
import * as esbuild from "esbuild";

const BUILD_CACHE: Record<string, esbuild.BuildResult> = {};

export const NodeHandler: Definition = (opts) => {
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

  return {
    build: async () => {
      const start = Date.now();
      /*
      spawn.sync(cmd.command, cmd.args, {
        env: {
          ...cmd.env,
          ...process.env,
        },
        cwd: opts.srcPath,
      });
      */
      const existing = BUILD_CACHE[opts.id];
      if (existing?.rebuild) {
        await existing.rebuild();
        console.log("rebuilding", file, "took", Date.now() - start, "ms");
        return;
      }
      const result = await esbuild.build({
        incremental: true,
        entryPoints: [path.join(opts.srcPath, file)],
        bundle: true,
        external: ["pg", "deasync", "kysely", "aws-sdk"],
        sourcemap: "external",
        platform: "node",
        target: "node14",
        outfile: target,
      });
      BUILD_CACHE[opts.id] = result;
      console.log("building", file, "took", Date.now() - start);
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
