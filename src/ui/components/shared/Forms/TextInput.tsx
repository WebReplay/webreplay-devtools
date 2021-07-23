import React from "react";

export default function TextInput(
  props: Omit<React.HTMLProps<HTMLInputElement>, "type" | "className">
) {
  return (
    <input
      {...props}
      type="text"
      className="focus:ring-primaryAccent focus:primaryAccentHover block w-full text-lg border px-3 py-2 border-textFieldBorder rounded-md"
    />
  );
}
