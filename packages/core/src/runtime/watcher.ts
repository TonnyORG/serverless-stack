import { State } from "../state";
import chokidar from "chokidar";
import { Handler } from "./handler";
import { Config } from "../config";
import path from "path";
import pm from "picomatch";

export class Watcher {
  private handleChange?: (opts: Handler.Opts[]) => void;

  public onChange(input: (opts: Handler.Opts[]) => void) {
    this.handleChange = input;
  }

  private chokidar?: chokidar.FSWatcher;

  public reload(root: string, config: Config) {
    const funcs = State.Function.read(root);
    const instructions = funcs.map(
      (f) => [f, Handler.instructions(f)] as const
    );
    const paths = instructions.flatMap(([_, i]) => i.watcher.include);
    const matchers = instructions.map(
      ([f, i]) => [f, i.watcher.include.map((p) => pm(p))] as const
    );
    if (this.chokidar) this.chokidar.close();
    const ignored = [
      path.resolve(path.join(root, path.dirname(config.main), "**")),
      "**/.build/**",
      "**/.sst/**",
    ];

    this.chokidar = chokidar.watch(paths, {
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      disableGlobbing: false,
      ignored,
      awaitWriteFinish: {
        pollInterval: 100,
        stabilityThreshold: 20,
      },
    });
    this.chokidar.on("change", (file) => {
      const funcs = matchers
        .filter(([_, matchers]) => matchers.some((m) => m(file)))
        .map(([f]) => f);
      this.handleChange?.(funcs);
    });
  }
}
