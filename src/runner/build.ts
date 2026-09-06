import path from "node:path";
import { Worker } from "node:worker_threads";
import { getLogger } from "@kabukisolutions/js-logger";
import { getCommandLineOptions } from "./commandLineArgs.js";

const logger = getLogger("build");

let isBuilding = false;
export const build = (): Promise<void> => {
  if (isBuilding) {
    logger.debug("Already building. Skipping this call.");
    return;
  }

  logger.debug("Build everything...");
  isBuilding = true;

  // We use a single worker thread; not for concurrency but to load the template afresh
  // We have had to resort to this since we had to switch to ESMs (hurray for dependencies!). I have omitted describing
  // my feelings on the subject, for the sake of keeping this SFW.
  logger.debug("Get a new worker thread.");
  
  return new Promise((resolve) => {
    const { template: templatePath } = getCommandLineOptions();
    logger.debug("templatePath:", templatePath);
    const workerPath = path.join(import.meta.dirname, "worker.js");
    const worker = new Worker(workerPath, {
      workerData: {
        templatePath,
        cwd: process.cwd(),
      },
    });
    
    worker.on("message", (messageValue) => {
      isBuilding = false;
      if (messageValue === "done") {
        getLogger("worker.onMessage", logger).debug("Done building.");
        resolve();
      } else {
        getLogger("worker.onMessage", logger).debug(`Unknown message value ${messageValue}`);
        process.exit(1);
      }
    });
    worker.on("error", (err) => {
      isBuilding = false;
      getLogger("worker.onError", logger).error("Error in the worker thread.", err);
      process.exit(1);
    });
    worker.on("exit", () => {
      getLogger("worker.onExit", logger).debug("Worker exit.");
    });
  });
};
