import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

interface CommandLineOptions {
  template: string;
  help    : boolean;
  port    : number;
  serve   : boolean;
  verbose : boolean;
  version : boolean;
  watch   : boolean;
}

export const DefaultPort = 3000;

const clOptionDefinitions = [{
  name       : "help",
  alias      : "h",
  type       : Boolean,
  description: "Print this usage guide.",
}, {
  name       : "template",
  alias      : "t",
  type       : String,
  description: "Path to the template file.",
}, {
  name       : "verbose",
  alias      : "v",
  type       : Boolean,
  description: "Not implemented yet; everything is verbose ATM.",
}, {
  name       : "watch",
  alias      : "w",
  type       : Boolean,
  description: "Watch for changes and rebuild.",
}, {
  name       : "serve",
  alias      : "s",
  type       : Boolean,
  description: "Start a live reloading server. This also implies --watch (and ocverrides any explicit value for it).",
}, {
  name        : "port",
  alias       : "p",
  type        : Number,
  defaultValue: DefaultPort,
  description : `Port for the live reloading server (only meaningful with --serve). Defaults to ${DefaultPort}.`,
}, {
  name       : "version",
  alias      : "V",
  type       : Boolean,
  description: "Print the version of the runner.",
}];

let pkgJSON: Record<string, unknown>;
const getPackageJSON = async () => {
  if (pkgJSON) {
    return pkgJSON;
  }

  /// @ts-expect-error - Calm down TS.
  pkgJSON = (await import("../../package.json", { with: { type: "json" } })).default;
  return pkgJSON;
};

interface PrintUsageHelpArgs {
  errorMessage?: string;
}

export const printUsageHelp = async (args: PrintUsageHelpArgs = {}) => {
  const { errorMessage } = args;
  const sections: Record<string, unknown>[] = [{
    header : "Patrika Runner",
    content: "A tool to turn your markdown and temmplates into a static website.",
  }, {
    header : "Sample Usage",
    content: "$ patrika-runner -t template/index.js",
  }, {
    content: "$ patrika-runner -t template/index.js -w",
  }, {
    content: "$ patrika-runner -t template/index.js -s",
  }];

  if (errorMessage) {
    sections.push({
      header : "Error",
      content: errorMessage,
    });
  }

  sections.push({
    header    : "Options",
    optionList: clOptionDefinitions,
  }, {
    header : "Project Information",
    content: `Project home: ${(await getPackageJSON()).homepage}`,
  });

  const usage = commandLineUsage(sections);
  console.log(usage);
};

let clOptions: CommandLineOptions;
export const getCommandLineOptions = (): CommandLineOptions => {
  if (clOptions) {
    return clOptions;
  }

  clOptions = commandLineArgs(clOptionDefinitions);
  return clOptions;
};

/**
 * Validate the command line options. Display help or appropriate error messages and exit if needed.
 */
export const doCommandLineValidation = async () => {
  const clOptions = getCommandLineOptions();
  if (clOptions.help) {
    await printUsageHelp();
    process.exit(0);
  }

  if (clOptions.version) {
    const version = (await getPackageJSON()).version;
    console.log(version);
    process.exit(0);
  }

  if (!clOptions.template) {
    await printUsageHelp({ errorMessage: "Template path is required." });
    process.exit(1);
  }

  if (!Number.isInteger(clOptions.port) || clOptions.port < 1 || clOptions.port > 65535) {
    await printUsageHelp({ errorMessage: `Invalid port "${clOptions.port}". Expected an integer between 1 and 65535.` });
    process.exit(1);
  }
};
