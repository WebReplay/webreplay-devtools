import React, { useState } from "react";
import Modal from "ui/components/shared/Modal";
import hooks from "ui/hooks";
import SettingsNavigation from "./SettingsNavigation";
import SettingsBody from "./SettingsBody";

import { Settings } from "./types";

import "./SettingsModal.css";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import * as selectors from "ui/reducers/app";
import { SettingsTabTitle } from "ui/state/app";
import * as actions from "ui/actions/app";

const settings: Settings = [
  {
    title: "Personal",
    icon: "person",
    items: [],
  },
  {
    title: "Invitations",
    icon: "stars",
    items: [],
  },
  {
    title: "API Keys",
    icon: "vpn_key",
    items: [],
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
        label: "Enable repainting",
        type: "checkbox",
        key: "enableRepaint",
        description: "Repaint the DOM on demand",
        disabled: false,
        needsRefresh: false,
      },
    ],
  },
  {
    title: "Support",
    icon: "support",
    items: [],
  },
  {
    title: "Legal",
    icon: "gavel",
    items: [],
  },
];

function SettingsModal({ defaultSettingsTab }: PropsFromRedux) {
  // No need to handle loading state here as it's already cached from the useGetUserSettings
  // query in the DevTools component
  const { userSettings, loading } = hooks.useGetUserSettings();
  const [selectedTab, setSelectedTab] = useState<SettingsTabTitle>(defaultSettingsTab);
  const selectedSetting = settings.find(setting => setting.title === selectedTab)!;

  if (loading) {
    return (
      <div className="settings-modal">
        <Modal></Modal>
      </div>
    );
  }

  return (
    <div className="settings-modal">
      <Modal>
        <SettingsNavigation {...{ settings, selectedTab, setSelectedTab }} />
        <SettingsBody {...{ selectedSetting, userSettings: userSettings! }} />
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
