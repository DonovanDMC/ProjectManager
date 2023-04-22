import Config from "../config/index.js";
import ClientEvent from "../util/ClientEvent.js";
import { InteractionTypes, MessageFlags } from "oceanic.js";

export default new ClientEvent("interactionCreate", async function interactionCreate(interaction) {
    if (interaction.type !== InteractionTypes.MESSAGE_COMPONENT) {
        return;
    }

    if (interaction.guildID === null) {
        return;
    }

    const [opt, invite] = interaction.data.customID.split(".");
    if (opt !== "roles") {
        return;
    }

    if (interaction.member?.pending) {
        return interaction.createMessage({
            content: "You need to pass the server's membership screening before you can use this button.",
            flags:   MessageFlags.EPHEMERAL
        });
    }

    const v = Config.roles.find(p => p.guild === interaction.guildID && p.code === invite);
    if (v && v.emoji !== null) {
        const member = interaction.member ?? await this.rest.guilds.getMember(interaction.guildID, interaction.user.id);
        if (member.roles.includes(v.id)) {
            await this.rest.guilds.removeMemberRole(interaction.user.id, v.id, "Component Interaction");
            return interaction.createMessage({
                content: `Your access to the <:${v.emoji.name}:${v.emoji.id}> **${v.name}** project has been removed.`,
                flags:   MessageFlags.EPHEMERAL
            });
        } else {
            await this.rest.guilds.addMemberRole(interaction.user.id, v.id, "Component Interaction");
            return interaction.createMessage({
                content: `You have been given access to the <:${v.emoji.name}:${v.emoji.id}> **${v.name}** project.`,
                flags:   MessageFlags.EPHEMERAL
            });
        }
    }

    return interaction.createMessage({
        content: "I couldn't figure out how to handle that button.",
        flags:   MessageFlags.EPHEMERAL
    });
});
