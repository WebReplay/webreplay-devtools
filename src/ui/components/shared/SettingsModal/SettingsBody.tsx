import React, { useEffect, useMemo, useState } from "react";
import { Setting } from "./types";
import { ApiKey, UserSettings } from "ui/types";
import ReplayInvitations from "./ReplayInvitations";
import "./SettingsBody.css";
import SettingsBodyItem from "./SettingsBodyItem";
import Spinner from "../Spinner";
import { handleIntercomLogout } from "ui/utils/intercom";
import useAuth0 from "ui/utils/useAuth0";
import hooks from "ui/hooks";
import TextInput from "../Forms/TextInput";
import MaterialIcon from "../MaterialIcon";

interface SettingsBodyProps {
  selectedSetting: Setting;
  userSettings: UserSettings;
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

function Personal() {
  const { logout, user } = useAuth0();
  const { name, picture, email } = user;

  return (
    <div className="space-y-16">
      <div className="flex flex-row space-x-4 items-center">
        <img src={picture} className="rounded-full w-16" />
        <div>
          <div className="text-xl">{name}</div>
          <div className="text-xl text-gray-500">{email}</div>
        </div>
      </div>
      <div>
        <button
          onClick={() => handleIntercomLogout(logout)}
          className="max-w-max items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

function Legal() {
  return (
    <div className="space-y-16 text-lg pr-48">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="text-2xl">
            <a
              className="underline"
              href="https://replay.io/tos.html"
              target="_blank"
              rel="noreferrer"
            >
              Terms of Use
            </a>
          </div>
          <div>{`The Terms of Use help define Replay's relationship with you as you interact with our services.`}</div>
        </div>
        <div className="space-y-2">
          <div className="text-2xl">
            <a
              className="underline"
              href="https://replay.io/privacy.html"
              target="_blank"
              rel="noreferrer"
            >
              Privacy Policy
            </a>
          </div>
          <div>{`Our Privacy Policy outlines how you can update, manage, and delete your information.`}</div>
        </div>
      </div>
    </div>
  );
}

function APIKeys({ apiKeys }: { apiKeys: ApiKey[] }) {
  const [keyValue, setKeyValue] = useState<string>();
  const [label, setLabel] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { addUserApiKey, loading: addLoading, error: addError } = hooks.useAddUserApiKey();
  const {
    deleteUserApiKey,
    loading: deleteLoading,
    error: deleteError,
  } = hooks.useDeleteUserApiKey();

  useEffect(() => {
    if (copied) {
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copied, setCopied]);

  const sortedKeys = useMemo(
    () =>
      [...apiKeys].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [apiKeys]
  );

  return (
    <div className="space-y-8 flex flex-col flex-auto h-0">
      <label className="setting-item">
        <div className="description">
          API Keys allow you to upload recordings programmatically from your automated tests or from
          your continuous integration environment.
        </div>
      </label>
      {addError ? (
        <div>Unable to add an API key at this time. Please try again later.</div>
      ) : keyValue ? (
        <>
          <div className="flex items-center justify-between space-x-4">
            <div className="flex flex-auto items-center px-3 h-12 border border-textFieldBorder rounded-md bg-blue-100">
              <span>{keyValue}</span>
              {copied ? (
                <div className="mx-3 text-primaryAccent">Copied!</div>
              ) : (
                <MaterialIcon
                  className="material-icons mx-3 w-7 h-7 text-primaryAccent"
                  onClick={() =>
                    navigator.clipboard.writeText(keyValue!).then(() => setCopied(true))
                  }
                >
                  assignment_outline
                </MaterialIcon>
              )}
            </div>
            <button
              className="inline-flex items-center px-3 py-2 h-12 border border-transparent text-lg leading-4 font-medium rounded-md shadow-sm text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:bg-primaryAccentHover"
              onClick={() => setKeyValue(undefined)}
            >
              Done
            </button>
          </div>
          <div className="flex items-center px-3 h-12 border border-textFieldBorder rounded-md bg-red-100">
            Make sure to copy your API key now. You won{"'"}t be able to see it again!
          </div>
        </>
      ) : (
        <>
          <form
            onSubmit={ev => {
              label &&
                addUserApiKey({ variables: { label: label, scopes: ["create:recording"] } }).then(
                  resp => {
                    setKeyValue(resp.data.createUserAPIKey.keyValue);
                    setLabel("");
                  }
                );

              ev.preventDefault();
            }}
            className="space-x-2"
          >
            <TextInput
              disabled={addLoading}
              placeholder="API Key Label"
              onChange={e => setLabel((e.target as HTMLInputElement).value)}
              value={label}
            />
            <button
              type="submit"
              disabled={addLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-lg leading-4 font-medium rounded-md shadow-sm text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:bg-primaryAccentHover"
            >
              Add
            </button>
          </form>
          <div className="flex-auto overflow-auto">
            {sortedKeys.map(apiKey => (
              <div className="flex flex-row items-center py-2 text-lg" key={apiKey.id}>
                <span className="flex-auto">{apiKey.label}</span>
                <button
                  className="inline-flex items-center p-3 text-sm shadow-sm leading-4 rounded-md bg-gray-100 text-red-500 hover:text-red-700 focus:outline-none focus:text-red-700"
                  onClick={() => {
                    const message =
                      "This action will permanently delete this API key. \n\nAre you sure you want to proceed?";

                    if (window.confirm(message)) {
                      deleteUserApiKey({ variables: { id: apiKey.id } });
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SettingsBody({ selectedSetting, userSettings }: SettingsBodyProps) {
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
  } else if (title == "Personal") {
    return (
      <main>
        <h1>{title}</h1>
        <Personal />
      </main>
    );
  } else if (title == "Legal") {
    return (
      <main>
        <h1>{title}</h1>
        <Legal />
      </main>
    );
  } else if (title == "API Keys") {
    return (
      <main>
        <h1>{title}</h1>
        <APIKeys apiKeys={userSettings.apiKeys} />
      </main>
    );
  }

  return (
    <main>
      <h1>{title}</h1>
      <ul>
        {items.map((item, index) => (
          <SettingsBodyItem
            {...{ item, userSettings }}
            key={index}
            setShowRefresh={setShowRefresh}
          />
        ))}
      </ul>
      {showRefresh ? <RefreshPrompt /> : null}
    </main>
  );
}
