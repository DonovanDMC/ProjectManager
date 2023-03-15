import ClientEvent from "../util/ClientEvent.js";
import InviteTracker from "../util/InviteTracker.js";

export default new ClientEvent("inviteDelete", async function inviteDeleteEvent(invite) {
    if (!invite.guild?.id) {
        return;
    }

    await InviteTracker.trackDelete(invite.code);
});
