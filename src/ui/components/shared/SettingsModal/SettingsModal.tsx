import React, { useState } from "react";
const Modal = require("ui/components/shared/Modal").default;
import SettingsNavigation from "./SettingsNavigation";
import SettingsBody from "./SettingsBody";

import { Settings } from "./types";

import "./SettingsModal.css";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import { SettingsTabTitle } from "ui/state/app";
import { actions } from "ui/actions";

const settings: Settings = [
  {
    title: "Personal",
    icon: "person",
    items: [
      {
        label: "Default workspace",
        type: "dropdown",
        key: "defaultWorkspaceId",
        description: "New replays will be saved here automatically",
        disabled: false,
        needsRefresh: false,
      },
    ],
  },
  {
    title: "Experimental",
    icon: "biotech",
    items: [
      {
        label: "Enable the Elements pane",
        type: "checkbox",
        key: "showElements",
        description: "Inspect HTML markup and CSS styling",
        disabled: false,
        needsRefresh: false,
      },
      {
        label: "Enable React DevTools",
        type: "checkbox",
        key: "showReact",
        description: "Inspect the React component tree",
        disabled: false,
        needsRefresh: false,
      },
      {
        label: "Enable teams",
        type: "checkbox",
        key: "enableTeams",
        description: "Add teams to your Replay library",
        disabled: false,
        needsRefresh: false,
      },
      {
        label: "Enable repainting",
        type: "checkbox",
        key: "enableRepaint",
        description: "Repaint the DOM whenever we jump in time",
        disabled: false,
        needsRefresh: false,
      },
    ],
  },
  {
    title: "Invitations",
    icon: "stars",
    items: [],
  },
  {
    title: "Support",
    icon: "support",
    items: [],
  },
];

function SettingsModal({ defaultSettingsTab }: PropsFromRedux) {
  const [selectedTab, setSelectedTab] = useState<SettingsTabTitle>(defaultSettingsTab);
  const selectedSetting = settings.find(setting => setting.title === selectedTab)!;

  return (
    <div className="settings-modal">
      <Modal>
        <SettingsNavigation {...{ settings, selectedTab, setSelectedTab }} />
        <SettingsBody selectedSetting={selectedSetting} />
      </Modal>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    defaultSettingsTab: selectors.getDefaultSettingsTab(state),
  }),
  { setDefaultSettingsTab: actions.setDefaultSettingsTab }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SettingsModal);
