import path from "node:path";
import { parentPort, workerData } from "node:worker_threads";
import { getLogger } from "@kabukisolutions/js-logger";
import { getPatrika } from "../index.js";
import { Template } from "./Template.js";
import { copyStaticAssets } from "./copyStaticAssets.js";
import { renderAllContentItems } from "./renderAllContentItems.js";

export enum Message {
  DONE = "done",
  ERROR = "error",
};

const rootLogger = getLogger("worker");

const loadTemplate = async (templatePath: string, terminate?: boolean): Promise<Template> => {
  const logger = getLogger("loadTemplate", rootLogger);
  try {
    logger.debug(`called with (templatePath: ${templatePath}, terminate: ${terminate})`);
    return (await import(templatePath)).default;
  } catch (err) {
    if (!terminate) {
      logger.debug("Retry, might be a file path. Try with process.cwd()");
      return loadTemplate(path.join(workerData.cwd, templatePath), true);
    }

    logger.error(err);
    logger.debug("Terminal call. Throw error down the stack.");
    throw err;
  }
};

const workerMain = async () => {
  const logger = getLogger("main", rootLogger);
  logger.debug("Start", workerData);
  const { templatePath } = workerData;
  logger.debug(`Load templatePath: ${templatePath}`);
  const template = await loadTemplate(templatePath);
  logger.debug("Successfully loaded the template.", template);
  const conf = template.getConfig();
  const {
    getSlug,
    getURLRelativeToRoot,
    onShortCode,
    renderToString,
    getExtraContentItems,
  } = template;
  const {
    contentGlob,
    outDir,
  } = conf;

  logger.debug("Get Patrika instance.");
  const patrika = await getPatrika({
    contentGlob,
    getSlug,
    getURLRelativeToRoot,
    onShortCode,
    outDir,
    getExtraContentItems,
  });

  logger.debug("Build everything...");
  await Promise.all([
    copyStaticAssets(conf),
    renderAllContentItems({
      getURLRelativeToRoot,
      items: await patrika.find(),
      outDir,
      patrika,
      renderToString,
    }),
  ]);

  logger.debug("All done. Signal main thread.");
  parentPort.postMessage(Message.DONE);
};

workerMain();
