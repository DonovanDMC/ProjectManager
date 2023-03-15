import ClientEvent from "../util/ClientEvent.js";
import InviteTracker from "../util/InviteTracker.js";

export default new ClientEvent("inviteCreate", async function inviteCreateEvent(invite) {
    if (invite.guildID === null) {
        return;
    }

    await InviteTracker.trackCreate(invite.code);
});
