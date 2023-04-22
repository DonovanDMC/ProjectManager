import ClientEvent from "../util/ClientEvent.js";
import InviteTracker from "../util/InviteTracker.js";

export default new ClientEvent("guildMemberAdd", async function guildMemberAddEvent(member) {
    await InviteTracker.handleJoin(member);

    if (member.pending === false) {
        await InviteTracker.applyRole(member);
    }
});
