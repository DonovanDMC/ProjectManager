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

    const v = Config.projects.find(p => p.code === invite);
    if (v) {
        if (interaction.member!.roles.includes(v.role)) {
            await interaction.member!.removeRole(v.role, "Component Interaction");
            return interaction.createMessage({
                content: `Your access to the <:${v.emoji.name}:${v.emoji.id}> **${v.name}** project has been removed.`,
                flags:   MessageFlags.EPHEMERAL
            });
        } else {
            await interaction.member!.addRole(v.role, "Component Interaction");
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
