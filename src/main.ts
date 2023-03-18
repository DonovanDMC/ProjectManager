import Config from "./config/index.js";
import ClientEvent from "./util/ClientEvent.js";
import Logger from "@uwu-codes/logger";
import { Client } from "oceanic.js";
import { Strings, Timer } from "@uwu-codes/utils";
import type { ModuleImport } from "@uwu-codes/types";
import { access, mkdir, readdir } from "node:fs/promises";

export default class ProjectManager extends Client {
    static INSTANCE: ProjectManager;
    events = new Map<string, ClientEvent>();
    firstReady = false;
    initTime = 0n;
    presenceUpdateInterval: NodeJS.Timeout | null = null;
    readyTime = 0n;
    constructor(initTime: bigint) {
        super(Config.clientOptions);
        ProjectManager.INSTANCE = this;
        this.initTime = initTime;
        this.presenceUpdateInterval = null;
    }

    async dirCheck() {
        const directories = [
            Config.logsDirectory,
            Config.dataDir,
            Config.eventsDirectory
        ];
        for (const dir of directories) {
            await mkdir(dir, { recursive: true });
        }
    }

    async getUser(id: string, forceRest = false) {
        const current = this.users.get(id);
        if (current && !forceRest) {
            return current;
        }
        return this.rest.users.get(id).catch(() => null);
    }

    async launch() {
        await this.dirCheck();
        await this.loadEvents();
        return this.connect();
    }

    async loadEvents() {
        const overallStart = Timer.getTime();
        if (!await access(Config.eventsDirectory).then((() => true)).catch(() => false))  {
            throw new Error(`Events directory "${Config.eventsDirectory}" does not exist.`);
        }
        const events = (await readdir(Config.eventsDirectory, { withFileTypes: true })).filter(ev => ev.isFile()).map(ev => `${Config.eventsDirectory}/${ev.name}`);
        for (const event of events) {
            const start = Timer.getTime();
            let ev = await import(event) as ModuleImport<ClientEvent>;
            if ("default" in ev) {
                ev = ev.default;
            }
            if (!(ev instanceof ClientEvent)) {
                throw new TypeError(`Export of event file "${event}" is not an instance of ClientEvent.`);
            }
            this.events.set(ev.name, ev);
            this.on(ev.name, ev.listener.bind(this));
            const end = Timer.getTime();
            Logger.getLogger("EventManager").debug(`Loaded the ${ev.name} event in ${Timer.calc(start, end, 3, false)}`);
        }
        const overallEnd = Timer.getTime();
        Logger.getLogger("EventManager").debug(`Loaded ${events.length} ${Strings.plural("event", events)} in ${Timer.calc(overallStart, overallEnd, 3, false)}`);
    }

    shutdown() {
        this.disconnect(false);
    }
}
