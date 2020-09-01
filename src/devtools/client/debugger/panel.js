/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { LocalizationHelper } from "devtools/shared/l10n";
import { defer, assert } from "protocol/utils";
import { bootstrapApp } from "devtools/client/debugger/src/utils/bootstrap";
import { resizeBreakpointGutter } from "./src/utils/ui";
import { openDocLink } from "devtools/client/shared/link";
import * as actions from "ui/actions";
import { selectors } from "ui/reducers";
import { clientCommands as client } from "devtools/client/debugger/src/client/firefox/commands";

function registerStoreObserver(store, subscriber) {
  let oldState = store.getState();
  store.subscribe(() => {
    const state = store.getState();
    subscriber(state, oldState);
    oldState = state;
  });
}

async function getNodeFront(gripOrFront, toolbox) {
  // Given a NodeFront
  if ("actorID" in gripOrFront) {
    return new Promise(resolve => resolve(gripOrFront));
  }

  const inspectorFront = await toolbox.target.getFront("inspector");
  return inspectorFront.getNodeFrontFromNodeGrip(gripOrFront);
}

export class DebuggerPanel {
  constructor(toolbox) {
    this.panelWin = window;
    this.panelWin.L10N = new LocalizationHelper("devtools/client/locales/debugger.properties");
    this.panelWin.Debugger = require("./src/main").default;

    this.toolbox = toolbox;
    this.readyWaiter = defer();
  }

  async open() {
    await this.panelWin.Debugger.bootstrap({
      store: gDevToolsStore,
      workers: {
        sourceMaps: this.toolbox.sourceMapService,
        evaluationsParser: this.toolbox.parserService,
      },
      panel: this,
    });

    this._store = gDevToolsStore;
    this.isReady = true;
    this.readyWaiter.resolve();

    registerStoreObserver(this._store, this._onDebuggerStateChange.bind(this));

    return this;
  }

  refresh() {
    if (!this.editor) {
      return;
    }

    // CodeMirror does not update properly when it is hidden. This method has
    // a few workarounds to get the editor to behave as expected when switching
    // to the debugger from another panel and the selected location has changed.
    const { codeMirror } = this.editor.state.editor;

    // Update CodeMirror by dispatching a resize event to the window. CodeMirror
    // also has a refresh() method but it did not work as expected when testing.
    window.dispatchEvent(new Event("resize"));

    // After CodeMirror refreshes, scroll it to the selected location, unless
    // the user explicitly scrolled the editor since the location was selected.
    // In this case the editor will already be in the correct state, and we
    // don't want to undo the scrolling which the user did.
    const handler = () => {
      codeMirror.off("refresh", handler);
      setTimeout(() => {
        if (!selectors.selectedLocationHasScrolled(this._getState())) {
          const location = selectors.getSelectedLocation(this._getState());
          if (location) {
            const cx = selectors.getContext(this._getState());
            actions.selectLocation(cx, location);
          }
        }
        resizeBreakpointGutter(codeMirror);
      }, 0);
    };
    codeMirror.on("refresh", handler);
  }

  _onDebuggerStateChange(state, oldState) {
    const { getCurrentThread } = selectors;

    if (getCurrentThread(state) !== getCurrentThread(oldState)) {
      this.toolbox.selectThread(getCurrentThread(state));
    }
  }

  renderApp() {
    return bootstrapApp(this._store);
  }

  getVarsForTests() {
    assert(this.isReady);
    return {
      store: this._store,
      selectors: selectors,
      actions: actions,
    };
  }

  _getState() {
    return this._store.getState();
  }

  getToolboxStore() {
    return this.toolbox.store;
  }

  openLink(url) {
    openDocLink(url);
  }

  async openConsoleAndEvaluate(input) {
    const { hud } = await this.toolbox.selectTool("console");
    hud.ui.wrapper.dispatchEvaluateExpression(input);
  }

  async openInspector() {
    this.toolbox.selectTool("inspector");
  }

  async openElementInInspector(gripOrFront) {
    const onSelectInspector = this.toolbox.selectTool("inspector");
    const onGripNodeToFront = getNodeFront(gripOrFront, this.toolbox);

    const [front, inspector] = await Promise.all([onGripNodeToFront, onSelectInspector]);

    const onInspectorUpdated = inspector.once("inspector-updated");
    const onNodeFrontSet = this.toolbox.selection.setNodeFront(front, {
      reason: "debugger",
    });

    return Promise.all([onNodeFrontSet, onInspectorUpdated]);
  }

  async highlightDomElement(gripOrFront) {
    if (!this._highlight) {
      const { highlight, unhighlight } = this.toolbox.getHighlighter();
      this._highlight = highlight;
      this._unhighlight = unhighlight;
    }

    return this._highlight(gripOrFront);
  }

  unHighlightDomElement() {
    if (!this._unhighlight) {
      return;
    }

    const forceUnHighlightInTest = true;
    return this._unhighlight(forceUnHighlightInTest);
  }

  getFrames() {
    const thread = selectors.getCurrentThread(this._getState());
    const frames = selectors.getFrames(this._getState(), thread);

    // Frames is null when the debugger is not paused.
    if (!frames) {
      return {
        frames: [],
        selected: -1,
      };
    }

    const selectedFrame = selectors.getSelectedFrame(this._getState(), thread);
    const selected = frames.findIndex(frame => frame.id == selectedFrame.id);

    frames.forEach(frame => {
      frame.actor = frame.id;
    });

    return { frames, selected };
  }

  isPaused() {
    const thread = selectors.getCurrentThread(this._getState());
    return selectors.getIsPaused(this._getState(), thread);
  }

  interrupt() {
    const cx = selectors.getThreadContext(this._getState());
    actions.breakOnNext(cx);
  }

  selectSourceURL(url, line, column) {
    const cx = selectors.getContext(this._getState());
    return actions.selectSourceURL(cx, url, { line, column });
  }

  async selectWorker(workerTargetFront) {
    const threadId = workerTargetFront.threadFront.actorID;
    const isThreadAvailable = selectors
      .getThreads(this._getState())
      .find(x => x.actor === threadId);

    if (!features.windowlessServiceWorkers) {
      console.error(
        "Selecting a worker needs the pref debugger.features.windowless-service-workers set to true"
      );
      return;
    }

    if (!isThreadAvailable) {
      console.error(`Worker ${threadId} is not available for debugging`);
      return;
    }

    // select worker's thread
    const cx = selectors.getContext(this._getState());
    actions.selectThread(cx, threadId);

    // select worker's source
    const source = this.getSourceByURL(workerTargetFront._url);
    await this.selectSource(source.id, 1, 1);
  }

  previewPausedLocation(location) {
    return actions.previewPausedLocation(location);
  }

  clearPreviewPausedLocation() {
    return actions.clearPreviewPausedLocation();
  }

  async selectSource(sourceId, line, column) {
    const cx = selectors.getContext(this._getState());
    const location = { sourceId, line, column };

    await actions.selectSource(cx, sourceId, location);
    if (selectors.hasLogpoint(this._getState(), location)) {
      actions.openConditionalPanel(location, true);
    }
  }

  canLoadSource(sourceId) {
    return selectors.canLoadSource(this._getState(), sourceId);
  }

  getSourceByActorId(sourceId) {
    return selectors.getSourceByActorId(this._getState(), sourceId);
  }

  getSourceByURL(sourceURL) {
    return selectors.getSourceByURL(this._getState(), sourceURL);
  }

  destroy() {
    this.panelWin.Debugger.destroy();
    this.emit("destroyed");
  }
}
