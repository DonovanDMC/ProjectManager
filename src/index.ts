const initTime = process.hrtime.bigint();
import ProjectManager from "./main.js";
import Config from "./config/index.js";
import { StatusServer, Time } from "@uwu-codes/utils";
import Logger from "@uwu-codes/logger";
import { type Server } from "node:http";
Logger._saveToRotatingFile(Config.logsDirectory);

const bot = new ProjectManager(initTime);
await bot.rest.getBotGateway().then(function preLaunchInfo({ sessionStartLimit: { remaining, total, resetAfter }, shards }) {
    Logger.getLogger("Launch").info(`Mode: ${Config.isDevelopment ? "BETA" : "PROD"} | CWD: ${process.cwd()} | PID: ${process.pid}`);
    Logger.getLogger("Launch").info(`Session Limits: ${remaining}/${total} - Reset: ${Time.dateToReadable(new Date(Date.now() + resetAfter))} | Recommended Shards: ${shards}`);
    Logger.getLogger("Launch").info("Node Version:", process.version);
    Logger.getLogger("Launch").info(`Platform: ${process.platform} (Manager: ${Config.isDocker ? "Docker" : "None"})`);
    return bot.launch();
});

process
    .on("uncaughtException", err => Logger.getLogger("Uncaught Exception").error(err))
    .on("unhandledRejection", (r, p) => {
        Logger.getLogger("Unhandled Rejection | Reason").error(r);
        Logger.getLogger("Unhandled Rejection | Promise").error(p);
    })
    .once("SIGINT", () => {
        bot.shutdown();
        statusServer?.close();
        process.kill(process.pid, "SIGINT");
    })
    .once("SIGTERM", () => {
        bot.shutdown();
        statusServer?.close();
        process.kill(process.pid, "SIGTERM");
    });

let statusServer: Server | undefined;

if (Config.isDocker) {
    statusServer = StatusServer(() => bot.ready);
}
