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


    const invites = await this.guilds.get(Config.guild)!.getInvites();

    const contents: Record<string, number> = {};
    for (const i of invites) {
        contents[i.code] = i.uses;
    }
    await writeFile(invitesFile, JSON.stringify(contents, null, 4));

    const rolesMessages = await this.rest.channels.getMessages(Config.rolesChannel);
    let hasMessage = false;
    for (const m of rolesMessages) {
        if (m.author.id === this.user.id) {
            hasMessage = true;
            break;
        }
    }

    if (!hasMessage) {
        const components = new ComponentBuilder<MessageActionRow>();
        for (const p of Config.projects) {
            components.addInteractionButton({
                customID: `roles.${p.code}`,
                label:    p.name,
                emoji:    p.emoji,
                style:    ButtonStyles.PRIMARY
            });
        }
        await this.rest.channels.createMessage(Config.rolesChannel, {
            content:    "This server is home to multiple projects. Due to them having vastly different natures, they're each locked behind their own roles. Use the buttons below to manage which projects you can view. You've already been given access to a project based on the invite you joined with.",
            components: components.toJSON()
        });
    }
});
