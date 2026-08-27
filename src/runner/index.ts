import { getLogger } from "@akshat1/js-logger";
import { loadTemplate } from "./Template.js";
import { build } from "./build.js";
import { doCommandLineValidation, getCommandLineOptions } from "./commandLineArgs.js";
import { debounce } from "./debounce.js";
import { watch } from "./watch.js";

const rootLogger = getLogger("runner");
// Main will be imported by bin/index.js
export const main = async () => {
  const logger = getLogger("main", rootLogger);
  logger.debug("Start");
  await doCommandLineValidation();
  const clOptions = getCommandLineOptions();
  logger.debug("command line options", clOptions);
  const template = await loadTemplate();
  const conf = template.getConfig();
  await build();

  let signalReload: () => void;
  if (clOptions.serve) {
    logger.info("Start live server...");
    const { startServer } = await import("./server.js"); // Only load the server if required.
    signalReload = await startServer(conf, clOptions.port);
  }

  if (clOptions.serve || clOptions.watch) {
    logger.info("Watching for changes...");
    await watch(conf.watchedPaths, debounce(async () => {
      logger.info("Change detected. Rebuilding...");
      await build();
      if (signalReload) {
        logger.info("Signalling reload...");
        signalReload();
      }
    }));
  }
};
