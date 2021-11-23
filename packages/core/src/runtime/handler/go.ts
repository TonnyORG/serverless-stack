import path from "path";
import { State } from "../../state";
import { Definition } from "./definition";

export const GoHandler: Definition = (opts) => {
  const target = State.Function.artifactsPath(
    opts.root,
    path.join(
      path.dirname(opts.handler),
      path.basename(opts.handler).split(".")[0]
    )
  );
  return {
    build: {
      command: "go",
      args: ["build", "-o", target, opts.handler],
      env: {},
    },
    run: {
      command: target,
      args: [],
      env: {},
    },
    watcher: {
      include: [path.join(opts.srcPath, "**/*.go")],
      ignore: [],
    },
  };
};
