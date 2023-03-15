import type ProjectManager from "../main.js";
import type { ClientEvents } from "oceanic.js";

export default class ClientEvent<K extends keyof ClientEvents = keyof ClientEvents> {
    listener: (this: ProjectManager, ...args: ClientEvents[K]) => void;
    name: K;
    constructor(event: K, listener: (this: ProjectManager, ...args: ClientEvents[K]) => void) {
        this.name = event;
        this.listener = listener;
    }
}
