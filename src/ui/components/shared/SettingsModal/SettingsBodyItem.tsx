import React, { Dispatch, SetStateAction } from "react";
import { ApiKey, UserSettings } from "ui/types";
import { SettingItem } from "./types";
import hooks from "ui/hooks";
import { SelectMenu } from "ui/components/shared/Forms";
import { updateEnableRepaint } from "protocol/enable-repaint";
import "./SettingsBodyItem.css";

interface SettingsBodyItemProps {
  item: SettingItem;
  userSettings: UserSettings;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
}

function Checkbox({
  item,
  value,
  setShowRefresh,
}: {
  item: SettingItem;
  value: boolean;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
}) {
  const { key, needsRefresh } = item;

  const updateUserSetting = hooks.useUpdateUserSetting(key, "Boolean");
  const toggleSetting = () => {
    if (needsRefresh) {
      setShowRefresh(true);
    }

    const newValue = !value;
    updateUserSetting({ variables: { newValue } });

    if (key === "enableRepaint") {
      updateEnableRepaint(newValue);
    }
  };

  return <input type="checkbox" id={key} checked={value} onChange={toggleSetting} />;
}

function Dropdown({
  item,
  value,
  setShowRefresh,
}: {
  item: SettingItem;
  value: string;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
}) {
  const onChange = () => {};

  return (
    <div className="w-64">
      <SelectMenu selected={value} setSelected={onChange} options={[]} />
    </div>
  );
}

function Input({
  item,
  value,
  setShowRefresh,
}: {
  item: SettingItem;
  value: boolean | string | ApiKey[] | null;
  setShowRefresh: Dispatch<SetStateAction<boolean>>;
}) {
  if (item.type == "checkbox") {
    return <Checkbox {...{ item, value: value as boolean, setShowRefresh }} />;
  }

  return <Dropdown {...{ item, value: value as string, setShowRefresh }} />;
}

export default function SettingsBodyItem({
  item,
  userSettings,
  setShowRefresh,
}: SettingsBodyItemProps) {
  const { label, key, description } = item;

  return (
    <li>
      <label className="setting-item" htmlFor={key}>
        <div className="label">{label}</div>
        {description && <div className="description">{description}</div>}
      </label>
      <Input item={item} value={userSettings[key]} setShowRefresh={setShowRefresh} />
    </li>
  );
}
