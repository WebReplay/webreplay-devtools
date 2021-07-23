import React, { useState } from "react";
import hooks from "ui/hooks";
import "./ReplayInvitations.css";
import { TextInput } from "ui/components/shared/Forms";

const USE_AVAILABLE_INVITATIONS = false;

export default function ReplayInvitations() {
  const [inputValue, setInputValue] = useState("");
  const { invitations, loading: inviteLoading } = hooks.useGetInvitations();
  let {
    availableInvitations,
    loading: availableInvitationsLoading,
  } = hooks.useGetAvailableInvitations();
  const addInvitation = hooks.useAddInvitation();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInputValue("");
    addInvitation({ variables: { email: inputValue } });
  };

  if (inviteLoading || availableInvitationsLoading) {
    return (
      <li className="replay-invitations">
        <label className="setting-item">
          <div className="label">Loading...</div>
        </label>
      </li>
    );
  }

  if (availableInvitations === null) {
    return (
      <li className="replay-invitations">
        <label className="setting-item">
          <div className="label">Sorry! Invitations are only available to invited users.</div>
        </label>
      </li>
    );
  }

  if (availableInvitations > 1000000) {
    availableInvitations = Infinity;
  }

  const label = USE_AVAILABLE_INVITATIONS
    ? `You have ${availableInvitations} invite${availableInvitations == 1 ? "" : "s"} left`
    : "";

  return (
    <li className="replay-invitations">
      <label className="setting-item">
        <div className="label">{label}</div>
        <div className="description">
          Replay is meant for sharing. Invite your team and friends below so they can start creating
          their own replays.
        </div>
      </label>
      {(!USE_AVAILABLE_INVITATIONS || availableInvitations > 0) && (
        <form onSubmit={onSubmit} className="space-x-2">
          <TextInput
            placeholder="Email Address"
            value={inputValue}
            onChange={e => setInputValue((e.target as HTMLInputElement).value)}
          />
          <button
            type="submit"
            value="Invite"
            className="inline-flex items-center px-3 py-2 border border-transparent text-lg leading-4 font-medium rounded-md shadow-sm text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:bg-primaryAccentHover"
          >
            Invite
          </button>
        </form>
      )}
      <div className="invitations-list">
        {invitations!.map((invite, i) => (
          <div className="invitations" key={i}>
            <div className={`material-icons ${invite.pending || "finished"}`}>
              {invite.pending ? "pending" : "check_circle"}
            </div>
            <div>{invite.invitedEmail}</div>
          </div>
        ))}
      </div>
    </li>
  );
}
