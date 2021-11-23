export type Command = {
  command: string;
  args: string[];
  env: Record<string, string>;
};

export type Instructions = {
  build?: Command | (() => Promise<void>);
  bundle?: Command | (() => void);
  run: Command;
  watcher: {
    include: string[];
    ignore: string[];
  };
};

export type Opts<T = any> = {
  id: string;
  root: string;
  runtime: string;
  srcPath: string;
  handler: string;
  bundle: T;
};

export type Definition<T = any> = (opts: Opts<T>) => Instructions;
