import Config from "../config/index.js";
import { type Invite, type Member } from "oceanic.js";
import { access, readFile, writeFile } from "node:fs/promises";

export const invitesFile = `${Config.dataDir}/invites.json`;
export const membersFile = `${Config.dataDir}/members.json`;
export default class InviteTracker {
    static async applyRole(member: Member) {
        let members: Record<string, string> = {};
        if (await access(membersFile).then(() => true).catch(() => false)) {
            members = JSON.parse(await readFile(membersFile, "utf8")) as typeof members;
        }

        const v = members[`${member.guildID}:${member.id}`];
        if (v === undefined) {
            return;
        }

        const role = Config.invites[v];
        if (role && !member.roles.includes(role)) {
            await member.addRole(role);
        }
    }

    static async handleJoin(member: Member) {
        let contents: Record<string, number> = {};
        if (await access(invitesFile).then(() => true).catch(() => false)) {
            contents = JSON.parse(await readFile(invitesFile, "utf8")) as typeof contents;
        }

        const invites = await member.client.rest.guilds.getInvites(member.guildID);
        let invite: Invite | undefined;
        for (const i of invites) {
            if (contents[i.code] === undefined) {
                continue;
            }
            if (contents[i.code] < i.uses) {
                invite = i;
                break;
            }
        }

        for (const i of invites) {
            contents[i.code] = i.uses;
        }
        await writeFile(invitesFile, JSON.stringify(contents, null, 2));

        if (invite === undefined) {
            return;
        }
        let members: Record<string, string> = {};
        if (await access(membersFile).then(() => true).catch(() => false)) {
            members = JSON.parse(await readFile(membersFile, "utf8")) as typeof members;
        }
        members[`${member.guildID}:${member.id}`] = invite.code;
        await writeFile(membersFile, JSON.stringify(members, null, 4));
    }

    static async trackCreate(code: string) {
        let contents: Record<string, number> = {};
        if (await access(invitesFile).then(() => true).catch(() => false)) {
            contents = JSON.parse(await readFile(invitesFile, "utf8")) as typeof contents;
        }

        contents[code] = 0;

        await writeFile(invitesFile, JSON.stringify(contents, null, 4));
    }

    static async trackDelete(code: string) {
        if (!await access(invitesFile).then(() => true).catch(() => false)) {
            const f = await readFile(invitesFile, "utf8");
            const contents = JSON.parse(f) as Record<string, number>;
            delete contents[code];
            if (JSON.stringify(contents) !== f) {
                await writeFile(invitesFile, JSON.stringify(contents, null, 4));
            }
        }
    }
}
