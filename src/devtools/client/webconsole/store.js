/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

import { FilterState } from "devtools/client/webconsole/reducers/filters";
import { PrefState } from "devtools/client/webconsole/reducers/prefs";
import { UiState } from "devtools/client/webconsole/reducers/ui";
import { prefs } from "devtools/client/webconsole/utils/prefs";

export function getConsoleInitialState() {
  const logLimit = 1000;
  //options.logLimit || Math.max(getIntPref("devtools.hud.loglimit"), 1);
  const sidebarToggle = prefs.sidebarToggle;
  const autocomplete = prefs.inputAutocomplete;
  // const eagerEvaluation = prefs.inputEagerEvaluation;
  const groupWarnings = prefs.groupWarningMessages;
  // const historyCount = prefs.historyCount;

  return {
    prefs: PrefState({
      logLimit,
      sidebarToggle,
      autocomplete,
      // eagerEvaluation,
      // historyCount,
      groupWarnings,
    }),
    filters: FilterState({
      error: prefs.filterError,
      warn: prefs.filterWarn,
      info: prefs.filterInfo,
      debug: prefs.filterDebug,
      log: prefs.filterLog,
    }),
    consoleUI: UiState({
      persistLogs: prefs.persistLogs,
      editor: prefs.editor,
      editorWidth: prefs.editorWidth,
      showEditorOnboarding: prefs.showEditorOnboarding,
      timestampsVisible: prefs.timestampsVisible,
    }),
  };
}
