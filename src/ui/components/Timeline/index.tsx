/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// React component which renders the devtools timeline and manages which
// graphics are currently being rendered.

import { connect, ConnectedProps } from "react-redux";
import { Component, MouseEventHandler } from "react";
import type { PointDescription, Location } from "@recordreplay/protocol";
import React from "react";
import classnames from "classnames";
import clamp from "lodash/clamp";

import Tooltip from "./Tooltip";
import Comments from "../Comments";

import { mostRecentPaintOrMouseEvent } from "protocol/graphics";

import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import Marker from "./Marker";
import MessageMarker from "./MessageMarker";
import EventMarker from "./EventMarker";

import { getVisiblePosition, getFormattedTime } from "ui/utils/timeline";
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";

import "./Timeline.css";
import { UIState } from "ui/state";
import { HoveredItem } from "ui/state/timeline";
import MaterialIcon from "../shared/MaterialIcon";

import { prefs, features } from "ui/utils/prefs";

function ReplayButton({ onClick, disabled }: { onClick: MouseEventHandler; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}>
      <MaterialIcon className="refresh pause_play_circle material-icons-round">
        refresh
      </MaterialIcon>
    </button>
  );
}

function getIsSecondaryHighlighted(
  hoveredItem: HoveredItem | null,
  location: Location | undefined
) {
  if (hoveredItem?.target == "console" || !location || !hoveredItem?.location) {
    return false;
  }

  return getLocationKey(hoveredItem.location) == getLocationKey(location);
}

class Timeline extends Component<PropsFromRedux> {
  $progressBar: HTMLDivElement | null = null;
  hoverInterval: number | undefined;

  async componentDidMount() {
    // Used in the test harness for starting playback recording.
    gToolbox.timeline = this;

    this.props.updateTimelineDimensions();
  }

  get overlayWidth() {
    return this.props.timelineDimensions.width;
  }

  // Get the time for a mouse event within the recording.
  getMouseTime(e: React.MouseEvent) {
    const { startTime, endTime } = this.props.zoomRegion;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickLeft = e.clientX;

    const clickPosition = Math.max((clickLeft - left) / width, 0);
    return Math.ceil(startTime + (endTime - startTime) * clickPosition);
  }

  hoverTimer = () => {
    if (!this.$progressBar) {
      return;
    }
    const { hideTooltip, currentTime } = this.props;
    const isHovered = window.elementIsHovered(this.$progressBar);
    if (!isHovered) {
      window.clearInterval(this.hoverInterval);
      this.hoverInterval = undefined;
      hideTooltip();
    }
  };

  onPlayerMouseEnter: MouseEventHandler = async e => {
    if (!this.hoverInterval) {
      this.hoverInterval = window.setInterval(this.hoverTimer, 100);
    }
  };

  onPlayerMouseMove: MouseEventHandler = e => {
    const { hoverTime, setTimelineToTime, setTimelineState } = this.props;
    const mouseTime = this.getMouseTime(e);
    const isDragging = e.buttons === 1;

    if (hoverTime != mouseTime) {
      setTimelineToTime(mouseTime, isDragging);
    }
    if (isDragging) {
      setTimelineState({ currentTime: mouseTime });
    }
  };

  onPlayerMouseUp: MouseEventHandler = e => {
    const { hoverTime, seek, hoveredItem, clearPendingComment } = this.props;
    const hoveringOverMarker = hoveredItem?.target === "timeline";
    const mouseTime = this.getMouseTime(e);

    if (hoverTime != null && !hoveringOverMarker) {
      const event = mostRecentPaintOrMouseEvent(mouseTime);
      if (event && event.point) {
        seek(event.point, mouseTime, false);
        clearPendingComment();
      }
    }
  };

  isHovering() {
    return !!this.hoverInterval;
  }

  renderCommands() {
    const {
      playback,
      recordingDuration,
      currentTime,
      startPlayback,
      stopPlayback,
      replayPlayback,
      clearPendingComment,
      videoUrl,
    } = this.props;
    const disabled = !videoUrl && (features.videoPlayback as boolean);
    const replay = () => {
      if (disabled) return;

      clearPendingComment();
      replayPlayback();
    };
    const togglePlayback = () => {
      if (disabled) return;

      clearPendingComment();
      if (playback) {
        stopPlayback();
      } else {
        startPlayback();
      }
    };

    if (currentTime == recordingDuration) {
      return (
        <div className="commands">
          <ReplayButton onClick={replay} disabled={disabled} />
        </div>
      );
    }

    return (
      <div className="commands">
        <button onClick={togglePlayback} disabled={disabled}>
          {playback ? (
            <MaterialIcon className="pause_play_circle material-icons-round">
              pause_circle_outline
            </MaterialIcon>
          ) : (
            <MaterialIcon className="pause_play_circle material-icons-round">
              play_circle_outline
            </MaterialIcon>
          )}
        </button>
      </div>
    );
  }

  renderMessages() {
    const { messages, hoveredItem } = this.props;
    if (messages.length >= prefs.maxHitsDisplayed) {
      return null;
    }

    return (
      <div className="markers-container">
        {messages.map((message: any, index: number) => {
          const isPrimaryHighlighted = hoveredItem?.point === message.executionPoint;
          const isSecondaryHighlighted = getIsSecondaryHighlighted(hoveredItem, message.frame);

          return (
            <MessageMarker
              key={index}
              message={message}
              isPrimaryHighlighted={isPrimaryHighlighted}
              isSecondaryHighlighted={isSecondaryHighlighted}
            />
          );
        })}
      </div>
    );
  }

  renderEvents() {
    const { clickEvents, hoveredItem } = this.props;

    return (
      <div className="markers-container">
        {clickEvents.map((event, index) => {
          const isPrimaryHighlighted = hoveredItem?.point === event.point;
          return (
            <EventMarker key={index} event={event} isPrimaryHighlighted={isPrimaryHighlighted} />
          );
        })}
      </div>
    );
  }

  renderPreviewMarkers() {
    const { pointsForHoveredLineNumber, currentTime, hoveredItem, zoomRegion } = this.props;

    if (!pointsForHoveredLineNumber || pointsForHoveredLineNumber === "error") {
      return [];
    }

    return (
      <div className="preview-markers-container">
        {pointsForHoveredLineNumber.map((point: PointDescription, index: number) => {
          const isPrimaryHighlighted = hoveredItem?.point === point.point;
          const isSecondaryHighlighted = getIsSecondaryHighlighted(hoveredItem, point.frame?.[0]);

          return (
            <Marker
              key={index}
              point={point.point}
              time={point.time}
              hasFrames={!!point.frame}
              location={point.frame?.[0]}
              currentTime={currentTime}
              isPrimaryHighlighted={isPrimaryHighlighted}
              isSecondaryHighlighted={isSecondaryHighlighted}
              zoomRegion={zoomRegion}
              overlayWidth={this.overlayWidth}
            />
          );
        })}
      </div>
    );
  }

  renderUnloadedRegions() {
    const { loadedRegions, isFinishedLoadingRegions, zoomRegion } = this.props;

    // Check loadedRegions to keep typescript happy.
    if (!loadedRegions || !isFinishedLoadingRegions) {
      return null;
    }

    const { begin, end } = loadedRegions[0];
    const { endTime } = zoomRegion;
    const loadedRegionStart = getVisiblePosition({ time: begin.time, zoom: zoomRegion }) * 100;
    const loadedRegionEnd =
      getVisiblePosition({ time: endTime - end.time, zoom: zoomRegion }) * 100;

    return (
      <>
        <div
          className="unloaded-regions start"
          style={{ width: `${clamp(loadedRegionStart, 0, 100)}%` }}
        />
        <div
          className="unloaded-regions end"
          style={{ width: `${clamp(loadedRegionEnd, 0, 100)}%` }}
        />
      </>
    );
  }

  render() {
    const {
      zoomRegion,
      currentTime,
      hoverTime,
      precachedTime,
      hoveredLineNumberLocation,
      hoveredItem,
      viewMode,
      selectedPanel,
      recordingDuration,
      loadedRegions,
    } = this.props;
    const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;
    const hoverPercent = getVisiblePosition({ time: hoverTime, zoom: zoomRegion }) * 100;
    const precachedPercent = getVisiblePosition({ time: precachedTime, zoom: zoomRegion }) * 100;
    const shouldDim = hoveredLineNumberLocation || hoveredItem;

    return (
      <div className={classnames("timeline", { dimmed: shouldDim })}>
        {this.renderCommands()}
        <div className={classnames("progress-bar-container", { paused: true })}>
          <div
            className="progress-bar"
            ref={node => (this.$progressBar = node)}
            onMouseEnter={this.onPlayerMouseEnter}
            onMouseMove={this.onPlayerMouseMove}
            onMouseUp={this.onPlayerMouseUp}
          >
            <div className="progress-line full" />
            <div
              className="progress-line preview-max"
              style={{ width: `${clamp(Math.max(hoverPercent, precachedPercent), 0, 100)}%` }}
            />
            <div
              className="progress-line preview-min"
              style={{ width: `${clamp(Math.min(hoverPercent, precachedPercent), 0, 100)}%` }}
            />
            <div className="progress-line" style={{ width: `${clamp(percent, 0, 100)}%` }} />
            {this.renderUnloadedRegions()}
            {this.isHovering() && percent >= 0 && percent <= 100 ? (
              <div className="progress-line-paused" style={{ left: `${percent}%` }} />
            ) : null}
            {viewMode == "dev" && selectedPanel == "console"
              ? this.renderMessages()
              : this.renderEvents()}
            {this.renderPreviewMarkers()}
            <Comments />
          </div>
          <Tooltip timelineWidth={this.overlayWidth} />
        </div>
        <div className="timeline-time">
          <span className="time-current">{getFormattedTime(currentTime)}</span>
          <span className="time-divider">/</span>
          <span className="time-total">{getFormattedTime(recordingDuration || 0)}</span>
        </div>
      </div>
    );
  }
}

const connector = connect(
  (state: UIState) => ({
    loadedRegions: selectors.getLoadedRegions(state)?.loaded,
    isFinishedLoadingRegions: selectors.isFinishedLoadingRegions(state),
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
    hoverTime: selectors.getHoverTime(state),
    precachedTime: selectors.getPlaybackPrecachedTime(state),
    playback: selectors.getPlayback(state),
    recordingDuration: selectors.getRecordingDuration(state),
    timelineDimensions: selectors.getTimelineDimensions(state),
    messages: selectors.getMessagesForTimeline(state),
    viewMode: selectors.getViewMode(state),
    selectedPanel: selectors.getSelectedPanel(state),
    hoveredLineNumberLocation: selectors.getHoveredLineNumberLocation(state),
    pointsForHoveredLineNumber: selectors.getPointsForHoveredLineNumber(state),
    hoveredItem: selectors.getHoveredItem(state),
    clickEvents: selectors.getEventsForType(state, "mousedown"),
    videoUrl: selectors.getVideoUrl(state),
  }),
  {
    setTimelineToTime: actions.setTimelineToTime,
    hideTooltip: actions.hideTooltip,
    setTimelineState: actions.setTimelineState,
    updateTimelineDimensions: actions.updateTimelineDimensions,
    seek: actions.seek,
    seekToTime: actions.seekToTime,
    startPlayback: actions.startPlayback,
    stopPlayback: actions.stopPlayback,
    replayPlayback: actions.replayPlayback,
    clearPendingComment: actions.clearPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Timeline);
