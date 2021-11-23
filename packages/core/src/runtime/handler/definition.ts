export type Command = {
  command: string;
  args: string[];
  env: Record<string, string>;
};

export type Instructions = {
  build?: Command | (() => Promise<void>);
  run: Command;
  watcher: {
    include: string[];
    ignore: string[];
  };
};

export type Opts = {
  id: string;
  root: string;
  runtime: string;
  srcPath: string;
  handler: string;
};

export type Definition = (opts: Opts) => Instructions;
