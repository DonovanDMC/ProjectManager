/* eslint-disable @typescript-eslint/member-ordering */
import PrivateConfiguration from "./private/private.js";
import client from "./private/client.json" assert { type: "json" };
import emojis from "./emojis.json" assert { type: "json" };
import { type IProjects } from "../util/schema.js";
import { EnvOverride } from "@uwu-codes/utils";
import { ActivityTypes, type UpdatePresenceOptions, type ClientOptions } from "oceanic.js";
import { access, readFile } from "node:fs/promises";

const host = await readFile("/data/hostname", "utf8").then(val => val.trim(), () => null);

const isDocker = await access("/.dockerenv").then(() => true, () => false) || await readFile("/proc/1/cgroup", "utf8").then(contents => contents.includes("docker"));
let debugLogging: boolean;
const projects = JSON.parse(await readFile(isDocker ? "/app/projects.json" : new URL("../../projects.json", import.meta.url).pathname, "utf8")) as IProjects;
export class Configuration extends PrivateConfiguration {
    static get isDevelopment() {
        return !isDocker || host === "DONOVAN-PC";
    }

    static get debugLogging() {
        return debugLogging ?? this.isDevelopment;
    }

    static set debugLogging(val: boolean) {
        debugLogging = val;
    }

    static get isDocker() {
        return isDocker;
    }

    static get client() {
        return client;
    }

    static get projects() {
        return projects;
    }

    static get roles() {
        return this.projects.flatMap(p => p.roles.flatMap(r => ({
            ...r,
            guild: p.id
        })));
    }

    static get invites() {
        return Object.fromEntries(this.roles.map(role => [role.code, role.id]));
    }

    static get emojis() {
        return emojis;
    }

    static get clientOptions(): ClientOptions {
        return {
            allowedMentions: {
                users:       true,
                roles:       false,
                everyone:    false,
                repliedUser: false
            },
            disableMemberLimitScaling: true,
            auth:                      `Bot ${this.client.token}`,
            defaultImageFormat:        "png",
            defaultImageSize:          4096,
            gateway:                   {
                autoReconnect: true,
                concurrency:   "auto",
                intents:       [
                    "GUILDS",
                    "GUILD_MEMBERS",
                    "GUILD_INVITES"
                ],
                maxShards: "auto",
                presence:  {
                    activities: [{
                        type: ActivityTypes.GAME,
                        name: "Starting.."
                    }],
                    status: "dnd"
                }
            }
        };
    }

    static get guild() {
        return "957278461993558046";
    }

    static get rolesChannel() {
        return "1085640993514197136";
    }

    /* directories */
    static get baseDir() {
        return new URL(`../../${import.meta.url.endsWith(".js") ? "../" : ""}`, import.meta.url).pathname.slice(0, -1);
    }

    static get dataDir() {
        return isDocker ? "/data" : `${this.baseDir}/data/bot`;
    }

    static get logsDirectory() {
        return `${this.dataDir}/logs`;
    }

    static get eventsDirectory() {
        return new URL("../events", import.meta.url).pathname;
    }

    /* statuses */
    static getPresence(time = new Date()): UpdatePresenceOptions | undefined {
        const list: Array<{
            presence: UpdatePresenceOptions;
            filter(hour: number, minute: number, second: number): boolean;
        }> = [
            {
                presence: {
                    activities: [{
                        type: ActivityTypes.WATCHING,
                        name: "people complain."
                    }],
                    status: "dnd"
                },
                filter: (hour: number, minute: number, second: number) => (second % 20) === 0
            }
        ];

        return list.find(item => item.filter(time.getHours(), time.getMinutes(), time.getSeconds()))?.presence;
    }
}


const Config = EnvOverride("PROJECT_MANAGER_", Configuration);
export default Config;
