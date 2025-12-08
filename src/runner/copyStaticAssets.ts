import { promises as fs } from "node:fs";
import path from "node:path";
import { getLogger } from "@akshat1/js-logger";
import { RunnerConfiguration } from "./RunnerConfiguration";

export const copyStaticAssets = async (config: RunnerConfiguration) => {
  const { outDir, staticAssets } = config;
  const logger = getLogger("copyStaticAssets");
  logger.debug("Copying static assets to", outDir);

  for (const src in staticAssets) {
    const dest = staticAssets[src];
    const srcPath = path.resolve(process.cwd(), src);
    const destPath = path.resolve(outDir, dest);
    logger.debug(`${src} => ${srcPath}`);
    logger.debug(`${dest} => ${destPath}`);
    logger.debug("Copying", srcPath, "to", destPath);
    await fs.cp(srcPath, destPath, {
      recursive: true,
      force    : true,
    });
  }
    
  // staticAssets.map(async (staticAsset) => {
  //   const src = path.join(process.cwd(), staticAsset);
  //   const dest = path.join(outDir, staticAsset);
  //   logger.debug("Copying", src, "to", dest);
  //   await fs.cp(src, dest, {
  //     recursive: true,
  //     force: true,
  //   });
  // })

  logger.debug("Done copying static assets.");
};
