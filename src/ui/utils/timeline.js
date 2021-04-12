import { timelineMarkerWidth } from "../constants";

// calculate pixel distance from two times
export function getPixelDistance({ to, from, zoom, overlayWidth }) {
  const toPos = getVisiblePosition({ time: to, zoom });
  const fromPos = getVisiblePosition({ time: from, zoom });

  return Math.abs((toPos - fromPos) * overlayWidth);
}

// Get the position of a time on the visible part of the timeline,
// in the range [0, 1] if the timeline is fully zommed out.
export function getVisiblePosition({ time, zoom }) {
  if (!time) {
    return 0;
  }

  return (time - zoom.startTime) / (zoom.endTime - zoom.startTime);
}

// Get the pixel offset for a time.
export function getPixelOffset({ time, overlayWidth, zoom }) {
  return getVisiblePosition({ time, zoom }) * overlayWidth;
}

// Get the percent value for the left offset of a message.
export function getLeftOffset({ overlayWidth, time, zoom }) {
  const position = getVisiblePosition({ time, zoom }) * 100;
  const messageWidth = (timelineMarkerWidth / overlayWidth) * 100;

  return Math.max(position - messageWidth / 2, 0);
}

// Get the percent value for the left offset of a comment.
export function getCommentLeftOffset({ overlayWidth, time, zoom, commentWidth }) {
  const position = getVisiblePosition({ time, zoom }) * 100;
  const messageWidth = (commentWidth / overlayWidth) * 100;

  return Math.min(Math.max(position, 0), 100 - messageWidth);
}

// Get the percent value for the left offset of a comment marker.
export function getMarkerLeftOffset({ overlayWidth, time, zoom, markerWidth }) {
  const position = getVisiblePosition({ time, zoom }) * 100;
  const commentMarkerWidth = (markerWidth / overlayWidth) * 100;

  return position - commentMarkerWidth / 2;
}

// Get the percent value for the midpoint of a time in the timeline.
export function getTimeMidpoint({ overlayWidth, time, zoom }) {
  const position = getVisiblePosition({ time, zoom }) * 100;
  const pausedLocationMarkerWidth = (1 / overlayWidth) * 100;

  return Math.max(position + pausedLocationMarkerWidth / 2, 0);
}

export function getNewZoomRegion({ hoverTime, newScale, zoomRegion, recordingDuration }) {
  let scale = zoomRegion.scale;
  let length = zoomRegion.endTime - zoomRegion.startTime;
  let leftToHover = hoverTime - zoomRegion.startTime;
  let rightToHover = zoomRegion.endTime - hoverTime;

  let newLength = recordingDuration / newScale;
  let newStart = zoomRegion.startTime - (newLength - length) * (leftToHover / length);
  let newEnd = zoomRegion.endTime + (newLength - length) * (rightToHover / length);

  if (newStart < 0) {
    newStart = 0;
    newEnd = newLength;
  } else if (newEnd > recordingDuration) {
    newEnd = recordingDuration;
    newStart = recordingDuration - newLength;
  }

  return { start: newStart, end: newEnd };
}

// Format a time value to mm:ss
export function getFormattedTime(time) {
  const date = new Date(time);
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const minutes = date.getMinutes();

  return `${minutes}:${seconds}`;
}
