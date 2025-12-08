import { createRequire } from "node:module";
import path from "node:path";
import { getLogger } from "@akshat1/js-logger";
import { getExtraContentItems } from "../GetExtraContentItems.js";
import { GetSlug } from "../GetSlug.js";
import { GetURLRelativeToRoot } from "../GetURLRelativeToRoot.js";
import { RenderToString } from "../RenderToString.js";
import { OnShortCode } from "../markdown/extensions/OnShortCode.js";
import { RunnerConfiguration } from "./RunnerConfiguration.js";
import { getCommandLineOptions } from "./commandLineArgs.js";

export interface Template {
  renderToString       : RenderToString;
  getSlug              : GetSlug;
  getURLRelativeToRoot : GetURLRelativeToRoot;
  getConfig            : () => RunnerConfiguration;
  onShortCode?         : OnShortCode;
  getExtraContentItems?: getExtraContentItems;
};

const rootLogger = getLogger("Template");

const validateTemplate = (template: Template): boolean => {
  const logger = getLogger("validateTemplate", rootLogger);
  if (typeof template.renderToString !== "function") {
    logger.error("Template does not have a renderToString method.", JSON.stringify(template, null, 2));
    throw new Error("Template does not have a renderToString method.");
  }

  if (typeof template.getSlug !== "function") {
    logger.error("Template does not have a getSlug method.", JSON.stringify(template, null, 2));
    throw new Error("Template does not have a getSlug method.");
  }

  if (typeof template.getURLRelativeToRoot !== "function") {
    logger.error("Template does not have a getURLRelativeToRoot method.", JSON.stringify(template, null, 2));
    throw new Error("Template does not have a getURLRelativeToRoot method.");
  }

  return true;
};

let template: Template;

const tryLoading = async (flushTemplate: boolean, templatePath: string, terminate?: boolean) => {
  const logger = getLogger("tryLoading", rootLogger);
  try {
    if (flushTemplate) {
      logger.debug("Flushing require cache...");
      const require = createRequire(import.meta.url);
      for (const key in require.cache) {
        // logger.debug(`Delete ${key}`);
        delete require.cache[key];
      }
    }
    
    logger.debug(`Importing template from ${templatePath}...`);
    return await import(`${templatePath}?t=${Date.now()}`);
  } catch (err) {
    if (!terminate) {
      logger.debug("Error loading template. Try again with a path from cwd");
      return tryLoading(flushTemplate, path.join(process.cwd(), templatePath), true);
    }

    throw err;
  }
};

/**
 * We expect this to only be called from the runner; i.e., when Patrika is used from the command line with a template.
 * This file is not involved when Patrika is used programmatically.
 * @returns
 */
export const loadTemplate = async (flushTemplate?: boolean) => {
  const logger = getLogger("loadTemplate", rootLogger);
  const { template: templatePath } = getCommandLineOptions();

  if (flushTemplate || !template) {
    logger.debug(`Loading template (flushTemplate: ${flushTemplate}) from ${templatePath}...`);
    // logger.debug({
    //   templatePath,
    //   cwd: process.cwd(),
    // });
    template = (await tryLoading(flushTemplate, templatePath)).default;
    validateTemplate(template);
  }
  
  return template;
};
