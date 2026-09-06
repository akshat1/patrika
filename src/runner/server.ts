import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { getLogger } from "@kabukisolutions/js-logger";
import express, { RequestHandler } from "express";
import ExpressWS from "express-ws";
import parseurl from "parseurl";
import { RunnerConfiguration } from "./RunnerConfiguration";

let runnerConfig: RunnerConfiguration;
let serverPort: number;

let scriptTextAddition = "";
const getClientScriptAddition = async (): Promise<string> => {
  if (scriptTextAddition) {
    return scriptTextAddition;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientScriptPath = path.join(__dirname, "../..", "assets", "client-script.js");
  try {
    scriptTextAddition =
      `<script>${(await fs.readFile(clientScriptPath)).toString("utf-8")}</script></body>`
        .replace("$$__PORT__$$", String(serverPort));

    return scriptTextAddition;
  } catch (err) {
    getLogger("getClientScriptAddition").error("Error reading client script:", err);
    return `<!-- Patrika Runner encountered error reading live-reload client script. ${err.message} -->\n</body>`;
  }
};

export const getContentType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html";
    case ".css":
      return "text/css";
    case ".js":
      return "application/javascript";
    case ".json":
      return "application/json";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".svg":
      return "image/svg+xml";
    case ".gif":
      return "image/gif";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
};

interface ContentResponse {
  contentType: string;
  content    : Buffer | string;
}

const getContent = async (reqPath: string): Promise<ContentResponse> => {
  const logger = getLogger("getContent");
  logger.debug(`Getting content for path: ${reqPath} => ${decodeURIComponent(reqPath)}`);
  let filePath = path.join(runnerConfig.outDir, decodeURIComponent(reqPath));
  let stat = await fs.stat(filePath);
  if (stat.isDirectory()) {
    filePath = path.join(filePath, "index.html");
    stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      const error = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).code = "ENOENT";
      throw error;
    }
  }

  logger.debug(`Reading: ${reqPath} => ${filePath}`);
  const response: ContentResponse = {
    contentType: getContentType(filePath),
    content    : await fs.readFile(filePath),
  };

  if (path.extname(filePath) === ".html") {
    logger.debug("Injecting script tag...");
    // inject script tag
    const responseBody = response.content.toString("utf-8");
    response.content = responseBody.replace("</body>", await getClientScriptAddition());
    response.contentType = "text/html"; // To account for situations where the name doesn't have .HTML extension.
  } // else

  logger.debug("Returning buffer.");
  return response;
};

const staticServer: RequestHandler = async (req, res, next) => {
  // A lot of code here is borrowed from serve-static.
  // Just greatly simplified for our simpler use-case.
  const logger = getLogger("staticServer");
  if (req.method === "GET" || req.method === "HEAD") {
    const originalUrl = parseurl.original(req);
    let pathName = parseurl(req).pathname;
    if (pathName === "/" && originalUrl.pathname.substr(-1) !== "/") {
      pathName = "";
    }

    logger.debug("Pathname:", pathName);
    if (pathName === "/.websocket") {
      return next();
    }

    try {
      const {
        contentType,
        content: responseBody,
      } = await getContent(pathName);
      logger.debug("Sending response with content-type", getContentType(pathName));
      res.setHeader("Content-Type", contentType);
      res.send(responseBody);
    } catch (err) {
      logger.error("Caught Error", err);
      console.error(err);
      if (err.code === "ENOENT") {
        res.status(404).send("Not Found");
      } else {
        res.status(500).send("Internal Server Error");
      }
    }
  } else {
    logger.debug("Method not allowed.", req.method);
    res
      .status(405)
      .setHeader("Allow", "GET, HEAD")
      .setHeader("Content-Length", "0")
      .end();
    return;
  }
};

type SignalReloadCB = () => void;

export const startServer = async (conf: RunnerConfiguration, port: number): Promise<SignalReloadCB> => {
  const logger = getLogger("startServer");
  runnerConfig = conf;
  serverPort = port;
  logger.info("Starting server...");
  // Build everything
  // Start the server
  const app = express();
  const expressWSS = ExpressWS(app);

  // Add our static server
  app.use(staticServer);

  // Add websocket server
  app.ws("/", (ws) => {
    logger.info("Websocket connection established.");
    ws.on("message", (msg) => {
      logger.info("Received message:", msg);
    });
    ws.send("Hello Client!");
  });

  // Start the server
  // The listen error surfaces on the WebSocketServer (express-ws wires the http server into it), so handle it on both.
  const onListenError = (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Pass --port to choose a different one.`);
      process.exit(1);
    }

    logger.error("Server error:", err);
    console.error(err);
    process.exit(1);
  };
  expressWSS.getWss().on("error", onListenError);
  const server = app.listen(port, () => {
    logger.info(`Server listening at http://localhost:${port}`);
  });
  server.on("error", onListenError);

  return () => {
    logger.info("Asked to signal reload...");
    expressWSS.getWss().clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        logger.info("Sending reload signal to client...");
        client.send("reload");
      }
    });
  };
};
