import React, { useState } from "react";
import { Setting } from "./types";
import ReplayInvitations from "./ReplayInvitations";
import "./SettingsBody.css";
import SettingsBodyItem from "./SettingsBodyItem";

interface SettingsBodyProps {
  selectedSetting: Setting;
}

function RefreshPrompt() {
  return (
    <div className="refresh-prompt">
      <span>You need to refresh this page for the changes to take effect.</span>
      <button onClick={() => location.reload()}>Refresh</button>
    </div>
  );
}

function Support() {
  return (
    <li>
      <label className="setting-item">
        <div className="label">Join us on Discord</div>
        <div className="description">
          Come chat with us on our{" "}
          <a href="https://discord.gg/n2dTK6kcRX" target="_blank" rel="noreferrer">
            Discord server.
          </a>
        </div>
        <br />
        <div className="label">Send us an email</div>
        <div className="description">
          You can also send an email at <a href="mailto:support@replay.io">support@replay.io</a>. It
          goes straight to the people making the product, and we'd love to hear your feedback!
        </div>
      </label>
    </li>
  );
}

export default function SettingsBody({ selectedSetting }: SettingsBodyProps) {
  const { title, items } = selectedSetting;
  const [showRefresh, setShowRefresh] = useState(false);

  // Special screens that don't change anything in the settings table.
  if (title == "Support") {
    return (
      <main>
        <h1>{title}</h1>
        <ul>
          <Support />
        </ul>
      </main>
    );
  } else if (title == "Invitations") {
    return (
      <main>
        <h1>{title}</h1>
        <ul className="overflow-hidden flex">
          <ReplayInvitations />
        </ul>
      </main>
    );
  }

  return (
    <main>
      <h1>{title}</h1>
      <ul>
        {items.map((item, index) => (
          <SettingsBodyItem item={item} key={index} setShowRefresh={setShowRefresh} />
        ))}
      </ul>
      {showRefresh ? <RefreshPrompt /> : null}
    </main>
  );
}
