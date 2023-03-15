import ClientEvent from "../util/ClientEvent.js";
import InviteTracker from "../util/InviteTracker.js";

export default new ClientEvent("guildMemberUpdate", async function guildMemberUpdateEvent(member, oldMember) {
    if (oldMember === null || !(member.pending === false && oldMember.pending === true)) {
        return;
    }

    await InviteTracker.applyRole(member);
});
