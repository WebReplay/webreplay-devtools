import React, { useState } from "react";
import classnames from "classnames";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { getUserId } from "ui/utils/useToken";
import "./Invitations.css";
import { Workspace } from "ui/types";

function Invitation({ workspace }: { workspace: Workspace }) {
  const [isLoading, setIsLoading] = useState(false);

  const userId = getUserId();
  const acceptPendingInvitation = hooks.useAcceptPendingInvitation();
  const deleteUserFromWorkspace = hooks.useDeleteUserFromWorkspace();

  const handleAccept = (workspaceId: string) => {
    acceptPendingInvitation({
      variables: { workspaceId, userId },
    });
    setIsLoading(true);
  };
  const handleRefuse = (workspaceId: string) => {
    deleteUserFromWorkspace({
      variables: { userId, workspaceId },
    });
    setIsLoading(true);
  };

  return (
    <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-2 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
      <div className="flex-1 min-w-0 select-none">
        <p className="text-lg font-medium text-gray-900">{workspace.name}</p>
        <div className="text-lg text-gray-500 truncate space-x-2">
          {isLoading ? (
            "Loading..."
          ) : (
            <>
              <button onClick={() => handleRefuse(workspace.id)}>Refuse</button>
              <span>/</span>
              <button onClick={() => handleAccept(workspace.id)}> Accept</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Invitations() {
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();

  if (loading || pendingWorkspaces?.length == 0) {
    return null;
  }

  return (
    <div className="workspace-invites flex flex-col space-y-4 p-8 items-start">
      <h2 className="text-gray-500 font-medium uppercase tracking-wide">{`PENDING INVITATIONS`}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...pendingWorkspaces]
          .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
          .map(workspace => (
            <Invitation workspace={workspace} key={workspace.id} />
          ))}
      </div>
    </div>
  );
}
