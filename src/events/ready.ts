import ClientEvent from "../util/ClientEvent.js";
import Config from "../config/index.js";
import { invitesFile } from "../util/InviteTracker.js";
import Logger from "@uwu-codes/logger";
import { Time } from "@uwu-codes/utils";
import { ComponentBuilder } from "@oceanicjs/builders";
import { ButtonStyles, type MessageActionRow } from "oceanic.js";
import { writeFile } from "node:fs/promises";

export default new ClientEvent("ready", async function readyEvent() {
    if (this.firstReady === true) {
        return Logger.getLogger("Ready").warn("Ready event called after first ready, ignoring.");
    }
    this.firstReady = true;
    this.readyTime = process.hrtime.bigint();
    this.presenceUpdateInterval = setInterval(async() => {
        const presence = Config.getPresence();
        if (presence) {
            await this.editStatus(presence.status, presence.activities);
        }
    }, 1e3);
    Logger.info(`Ready as ${this.user.tag} in ${Time.ms((this.readyTime - this.initTime) / 1000000n, { words: true, ms: true, shortMS: true })}`);


    const contents: Record<string, number> = {};

    for (const p of Config.projects) {
        const invites = await this.rest.guilds.getInvites(p.id);
        for (const i of invites) {
            contents[i.code] = i.uses;
        }
        if (p.message === null) {
            continue;
        }
        const messages = await this.rest.channels.getMessages(p.message.channel);
        if (messages.some(m => m.author.id === this.user.id)) {
            continue;
        }
        const components = new ComponentBuilder<MessageActionRow>();
        for (const r of p.roles) {
            components.addInteractionButton({
                customID: `roles.${r.code}`,
                label:    r.name,
                emoji:    r.emoji ?? undefined,
                style:    ButtonStyles.PRIMARY
            });
        }
        await this.rest.channels.createMessage(p.message.channel, {
            content:    p.message.content,
            components: components.toJSON()
        });
    }
    await writeFile(invitesFile, JSON.stringify(contents, null, 4));
});
