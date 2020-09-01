/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

function storeAsGlobal(actor) {
  return async ({ client, hud }) => {
    const evalString = `{ let i = 0;
      while (this.hasOwnProperty("temp" + i) && i < 1000) {
        i++;
      }
      this["temp" + i] = _self;
      "temp" + i;
    }`;

    const res = await client.evaluateJSAsync(evalString, {
      selectedObjectActor: actor,
    });
    hud.focusInput();
    hud.setInputValue(res.result);
  };
}

function copyMessageObject(actor, variableText) {
  return async ({ client }) => {
    if (actor) {
      // The Debugger.Object of the OA will be bound to |_self| during evaluation.
      // See server/actors/webconsole/eval-with-debugger.js `evalWithDebugger`.
      const res = await client.evaluateJSAsync("copy(_self)", {
        selectedObjectActor: actor,
      });
      navigator.clipboard.writeText(res.helperResult.value);
    } else {
      navigator.clipboard.writeText(variableText);
    }
  };
}

module.exports = {
  storeAsGlobal,
  copyMessageObject,
};
