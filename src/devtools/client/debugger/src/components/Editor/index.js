/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import { bindActionCreators } from "redux";
import ReactDOM from "react-dom";
import { connect } from "../../utils/connect";
import classnames from "classnames";
import { debounce } from "lodash";

import { isFirefox } from "ui/utils/environment";
import { features } from "../../utils/prefs";
import { getIndentation } from "../../utils/indentation";

import { showMenu } from "devtools-contextmenu";
import { continueToHereItem, editorItemActions } from "./menus/editor";

// Redux actions
import actions from "../../actions";

import { actions as uiActions } from "ui/actions";
import { selectors as uiSelectors } from "ui/reducers";

import SearchBar from "./SearchBar";
import Preview from "./Preview";
import Breakpoints from "./Breakpoints/Breakpoints";
import ColumnBreakpoints from "./ColumnBreakpoints";
import DebugLine from "./DebugLine";
import ReplayLines from "./ReplayLines";
import EmptyLines from "./EmptyLines";
import EditorMenu from "./EditorMenu";
import LineNumberPortal from "./LineNumberPortal";

import {
  showSourceText,
  showLoading,
  showErrorMessage,
  getEditor,
  clearEditor,
  getCursorLine,
  lineAtHeight,
  toSourceLine,
  getDocument,
  scrollToColumn,
  toEditorPosition,
  getSourceLocationFromMouseEvent,
  hasDocument,
  onMouseOver,
  startOperation,
  endOperation,
  clearDocuments,
} from "../../utils/editor";

import { resizeToggleButton, resizeBreakpointGutter } from "../../utils/ui";

import "./Editor.css";
import { selectors } from "ui/reducers";

const cssVars = {
  searchbarHeight: "var(--editor-searchbar-height)",
};

class Editor extends PureComponent {
  $editorWrapper;
  constructor(props) {
    super(props);

    this.state = {
      highlightedLineRange: null,
      editor: null,
      contextMenu: null,
    };
  }

  componentDidMount() {
    const { shortcuts } = this.context;

    shortcuts.on("CmdOrCtrl+B", this.onToggleBreakpoint);
    shortcuts.on("CmdOrCtrl+W", this.onClosePress);
    shortcuts.on("Esc", this.onEscape);
    this.updateEditor(this.props);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.updateEditor(nextProps);
  }

  updateEditor(props) {
    let editor = this.state.editor;

    if (!this.state.editor && props.selectedSource) {
      editor = this.setupEditor();
    }

    startOperation();
    this.setText(props, editor);
    this.setSize(props, editor);
    this.scrollToLocation(props, editor);
    endOperation();

    if (this.props.selectedSource != props.selectedSource) {
      this.props.updateViewport();
      resizeBreakpointGutter(editor.codeMirror);
      resizeToggleButton(editor.codeMirror);
    }
  }

  setupEditor() {
    const editor = getEditor();

    // disables the default search shortcuts
    editor._initShortcuts = () => {};
    const node = ReactDOM.findDOMNode(this);
    if (node instanceof HTMLElement) {
      editor.appendToLocalElement(node.querySelector(".editor-mount"));
    }

    const { codeMirror } = editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();

    codeMirror.on("gutterClick", this.onGutterClick);

    // Set code editor wrapper to be focusable
    codeMirrorWrapper.tabIndex = 0;
    codeMirrorWrapper.addEventListener("keydown", e => this.onKeyDown(e));
    codeMirrorWrapper.addEventListener("click", e => this.onClick(e));
    codeMirrorWrapper.addEventListener("mouseover", onMouseOver(codeMirror));
    codeMirrorWrapper.addEventListener("mouseover", e =>
      this.onGutterMouseOver(e, this.setHoveredLineNumberNode)
    );

    if (!isFirefox()) {
      codeMirror.on("gutterContextMenu", (cm, line, eventName, event) =>
        this.onGutterContextMenu(event)
      );
      codeMirror.on("contextmenu", (cm, event) => this.openMenu(event));
    } else {
      codeMirrorWrapper.addEventListener("contextmenu", event => this.openMenu(event));
    }

    codeMirror.on("scroll", this.onEditorScroll);
    this.onEditorScroll();
    this.setState({ editor });

    return editor;
  }

  onGutterMouseOver = (e, setHoveredLineNumberNode) => {
    let target = e.target;
    let shouldRunAnalysis = true;

    const isBreakpointMarker = target.closest(".new-breakpoint");

    // If hovered on a breakpoint marker, get the corresponding linenumber element.
    if (isBreakpointMarker) {
      shouldRunAnalysis = false;
      target = target.closest(".Codemirror-gutter-elt")?.previousSibling;
    }

    if (!target || !target.classList) {
      return;
    }

    const isValidLineNumber =
      target.classList.contains("CodeMirror-linenumber") && !target.closest(".empty-line");

    if (!isValidLineNumber) {
      return;
    }

    const onMouseLeave = () => {
      e.target.removeEventListener("mouseleave", onMouseLeave);
      setHoveredLineNumberNode(null);
    };

    e.target.addEventListener("mouseleave", onMouseLeave);
    setHoveredLineNumberNode(target, shouldRunAnalysis);
  };

  setHoveredLineNumberNode = (target, shouldRunAnalysis) => {
    const { cx, selectedSource, runAnalysisOnLine } = this.props;

    if (!target) {
      this.props.setHoveredLineNumber(null);
      return this.setState({ targetNode: null });
    }

    const line = JSON.parse(target.childNodes[0].textContent);
    const location = {
      sourceId: selectedSource.id,
      sourceUrl: selectedSource.url,
      column: undefined,
      line,
    };

    if (shouldRunAnalysis) {
      runAnalysisOnLine(cx, line);
    }

    this.props.setHoveredLineNumber(location);
    this.setState({ targetNode: target });
  };

  onClosePress = (key, e) => {
    const { cx, selectedSource } = this.props;
    if (selectedSource) {
      e.preventDefault();
      e.stopPropagation();
      this.props.closeTab(cx, selectedSource);
    }
  };

  componentWillUnmount() {
    if (this.state.editor) {
      this.state.editor.destroy();
      clearDocuments();
      this.state.editor.codeMirror.off("scroll", this.onEditorScroll);
      this.setState({ editor: null });
    }

    const shortcuts = this.context.shortcuts;
    shortcuts.off("CmdOrCtrl+W");
    shortcuts.off("CmdOrCtrl+B");
  }

  getCurrentLine() {
    const { codeMirror } = this.state.editor;
    const { selectedSource } = this.props;
    if (!selectedSource) {
      return;
    }

    const line = getCursorLine(codeMirror);
    return toSourceLine(selectedSource.id, line);
  }

  onToggleBreakpoint = (key, e) => {
    e.preventDefault();
    e.stopPropagation();

    const line = this.getCurrentLine();
    if (typeof line !== "number") {
      return;
    }

    this.props.toggleBreakpointAtLine(this.props.cx, line);
  };

  onEditorScroll = debounce(this.props.updateViewport, 75);

  onKeyDown(e) {
    const { codeMirror } = this.state.editor;
    const { key, target } = e;
    const codeWrapper = codeMirror.getWrapperElement();
    const textArea = codeWrapper.querySelector("textArea");

    if (key === "Escape" && target == textArea) {
      e.stopPropagation();
      e.preventDefault();
      codeWrapper.focus();
    } else if (key === "Enter" && target == codeWrapper) {
      e.preventDefault();
      // Focus into editor's text area
      textArea.focus();
    }
  }

  /*
   * The default Esc command is overridden in the CodeMirror keymap to allow
   * the Esc keypress event to be catched by the toolbox and trigger the
   * split console. Restore it here, but preventDefault if and only if there
   * is a multiselection.
   */
  onEscape = (key, e) => {
    if (!this.state.editor) {
      return;
    }

    const { codeMirror } = this.state.editor;
    if (codeMirror.listSelections().length > 1) {
      codeMirror.execCommand("singleSelection");
      e.preventDefault();
    }
  };

  openMenu(event) {
    event.stopPropagation();
    event.preventDefault();

    const { cx, selectedSource, editorActions, isPaused, framePositions } = this.props;
    const { editor } = this.state;
    if (!selectedSource || !editor) {
      return;
    }

    const target = event.target;
    const { id: sourceId } = selectedSource;
    const line = lineAtHeight(editor, sourceId, event);

    if (typeof line != "number") {
      return;
    }

    const location = { line, column: undefined, sourceId };

    if (target.classList.contains("CodeMirror-linenumber")) {
      const disabled = !isPaused || !framePositions;

      return showMenu(event, [continueToHereItem(cx, location, disabled, editorActions)]);
    }

    if (target.getAttribute("id") === "columnmarker") {
      return;
    }

    this.setState({ contextMenu: event });
  }

  clearContextMenu = () => {
    this.setState({ contextMenu: null });
  };

  onGutterClick = (cm, line, gutter, ev) => {
    const { cx, selectedSource, addBreakpointAtLine, continueToHere, toggleBlackBox } = this.props;

    // ignore right clicks in the gutter
    if ((ev.ctrlKey && ev.button === 0) || ev.button === 2 || !selectedSource) {
      return;
    }

    // if user clicks gutter to set breakpoint on blackboxed source, un-blackbox the source.
    if (selectedSource && selectedSource.isBlackBoxed) {
      toggleBlackBox(cx, selectedSource);
    }

    const sourceLine = toSourceLine(selectedSource.id, line);
    if (typeof sourceLine !== "number") {
      return;
    }

    if (ev.metaKey) {
      return continueToHere(cx, { line: sourceLine });
    }

    // Don't add a breakpoint if the user clicked on something other than the gutter line number,
    // e.g., the blank gutter space caused by adding a CodeMirror widget.
    if (![...ev.target.classList].includes("CodeMirror-linenumber")) {
      return;
    }

    return addBreakpointAtLine(cx, sourceLine, ev.altKey, ev.shiftKey);
  };

  onGutterContextMenu = event => {
    return this.openMenu(event);
  };

  onClick(e) {
    const { cx, selectedSource, updateCursorPosition, jumpToMappedLocation } = this.props;

    if (selectedSource) {
      const sourceLocation = getSourceLocationFromMouseEvent(this.state.editor, selectedSource, e);

      if (e.metaKey && e.altKey) {
        jumpToMappedLocation(cx, sourceLocation);
      }

      updateCursorPosition(sourceLocation);
    }
  }

  shouldScrollToLocation(nextProps, editor) {
    const { selectedLocation, selectedSource } = this.props;
    if (
      !editor ||
      !nextProps.selectedSource ||
      !nextProps.selectedLocation ||
      !nextProps.selectedLocation.line ||
      !nextProps.selectedSource.content
    ) {
      return false;
    }

    const isFirstLoad =
      (!selectedSource || !selectedSource.content) && nextProps.selectedSource.content;
    const locationChanged = selectedLocation !== nextProps.selectedLocation;
    const symbolsChanged = nextProps.symbols != this.props.symbols;

    return isFirstLoad || locationChanged || symbolsChanged;
  }

  scrollToLocation(nextProps, editor) {
    const { selectedLocation, selectedSource } = nextProps;

    if (selectedLocation && this.shouldScrollToLocation(nextProps, editor)) {
      let { line, column } = toEditorPosition(selectedLocation);

      if (selectedSource && hasDocument(selectedSource.id)) {
        const doc = getDocument(selectedSource.id);
        const lineText = doc.getLine(line);
        column = Math.max(column, getIndentation(lineText));
      }

      scrollToColumn(editor.codeMirror, line, column);
    }
  }

  setSize(nextProps, editor) {
    if (!editor) {
      return;
    }

    if (nextProps.startPanelSize !== this.props.startPanelSize) {
      editor.codeMirror.setSize();
    }
  }

  setText(props, editor) {
    const { selectedSource, symbols } = props;
    if (!editor) return;

    // check if we previously had a selected source
    if (!selectedSource) {
      return this.clearEditor();
    }

    if (!selectedSource.content) {
      return showLoading(editor);
    }

    if (selectedSource.content.state === "rejected") {
      let { value } = selectedSource.content;
      if (typeof value !== "string") {
        value = "Unexpected source error";
      }

      return this.showErrorMessage(value);
    }

    return showSourceText(editor, selectedSource, selectedSource.content.value, symbols);
  }

  clearEditor() {
    const { editor } = this.state;
    if (!editor) {
      return;
    }

    clearEditor(editor);
  }

  showErrorMessage(msg) {
    const { editor } = this.state;
    if (!editor) {
      return;
    }

    showErrorMessage(editor, msg);
  }

  getInlineEditorStyles() {
    const { searchOn } = this.props;

    if (searchOn) {
      return {
        height: `calc(100% - ${cssVars.searchbarHeight})`,
      };
    }

    return {
      height: "100%",
    };
  }

  renderItems() {
    const { cx, selectedSource, isPaused } = this.props;
    const { editor, contextMenu } = this.state;
    const { targetNode } = this.state;

    if (!selectedSource || !editor || !getDocument(selectedSource.id)) {
      return null;
    }

    return (
      <div>
        <DebugLine />
        {/* <HighlightLine /> */}
        {features.jumpLine ? <ReplayLines /> : null}
        <EmptyLines editor={editor} />
        <Breakpoints editor={editor} cx={cx} />
        <Preview editor={editor} editorRef={this.$editorWrapper} />
        {targetNode ? <LineNumberPortal targetNode={targetNode} /> : null}
        {/* <HighlightLines editor={editor} /> */}
        {
          <EditorMenu
            editor={editor}
            contextMenu={contextMenu}
            clearContextMenu={this.clearContextMenu}
            selectedSource={selectedSource}
          />
        }
        <ColumnBreakpoints editor={editor} />
      </div>
    );
  }

  renderSearchBar() {
    const { editor } = this.state;

    if (!this.props.selectedSource) {
      return null;
    }

    return <SearchBar editor={editor} />;
  }

  render() {
    const { selectedSource } = this.props;
    return (
      <div
        className={classnames("editor-wrapper", {
          blackboxed: selectedSource && selectedSource.isBlackBoxed,
        })}
        ref={c => (this.$editorWrapper = c)}
      >
        <div className="editor-mount devtools-monospace" style={this.getInlineEditorStyles()} />
        {this.renderSearchBar()}
        {this.renderItems()}
      </div>
    );
  }
}

Editor.contextTypes = {
  shortcuts: PropTypes.object,
};

const mapStateToProps = state => {
  const selectedSource = selectors.getSelectedSourceWithContent(state);

  return {
    cx: selectors.getThreadContext(state),
    selectedLocation: selectors.getSelectedLocation(state),
    selectedSource,
    searchOn: selectors.getActiveSearch(state) === "file",
    symbols: selectors.getSymbols(state, selectedSource),
    isPaused: selectors.getIsPaused(state),
    skipPausing: selectors.getSkipPausing(state),
    selectedFrame: selectors.getSelectedFrame(state),
    framePositions: selectors.getFramePositions(state),
    mode: selectors.getViewMode(state),
    hoveredLineNumber: uiSelectors.getHoveredLineNumber(state),
  };
};

const mapDispatchToProps = dispatch => ({
  ...bindActionCreators(
    {
      continueToHere: actions.continueToHere,
      toggleBreakpointAtLine: actions.toggleBreakpointAtLine,
      addBreakpointAtLine: actions.addBreakpointAtLine,
      runAnalysisOnLine: actions.runAnalysisOnLine,
      jumpToMappedLocation: actions.jumpToMappedLocation,
      traverseResults: actions.traverseResults,
      updateViewport: actions.updateViewport,
      updateCursorPosition: actions.updateCursorPosition,
      closeTab: actions.closeTab,
      toggleBlackBox: actions.toggleBlackBox,
      setHoveredLineNumber: uiActions.setHoveredLineNumber,
    },
    dispatch
  ),
  editorActions: editorItemActions(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
