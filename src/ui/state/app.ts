import {
  RecordingId,
  SessionId,
  PointDescription,
  Location,
  MouseEvent,
  loadedRegions,
} from "@recordreplay/protocol";
import type { RecordingTarget } from "protocol/thread/thread";
import { Workspace } from "ui/types";

export type PanelName =
  | "console"
  | "debugger"
  | "inspector"
  | "viewer"
  | "react-components"
  | "comments";
export type PrimaryPanelName = "explorer" | "debug" | "comments" | "events";
export type ViewMode = "dev" | "non-dev";
export type ModalType =
  | "sharing"
  | "login"
  | "settings"
  | "new-workspace"
  | "workspace-settings"
  | "onboarding"
  | "team-member-onboarding"
  | "team-leader-onboarding"
  | "browser-launch"
  | "first-replay";
export type WorkspaceId = string;
export type SettingsTabTitle =
  | "Experimental"
  | "Invitations"
  | "Support"
  | "Personal"
  | "Legal"
  | "API Keys";

export interface ExpectedError {
  message: string;
  content: string;
  action?: "sign-in" | "refresh" | "library";
}

export type UnexpectedError = {
  message: string;
  content: string;
  action?: "refresh";
};

export interface UploadInfo {
  amount: string;
  total?: string;
}

export interface AppState {
  recordingId: RecordingId | null;
  sessionId: SessionId | null;
  theme: string;
  splitConsoleOpen: boolean;
  recordingDuration: number;
  indexing: number;
  loading: number;
  uploading: UploadInfo | null;
  awaitingSourcemaps: boolean;
  expectedError: ExpectedError | null;
  unexpectedError: UnexpectedError | null;
  modal: ModalType | null;
  modalOptions: { recordingId: string } | null;
  selectedPanel: PanelName;
  selectedPrimaryPanel: PrimaryPanelName;
  initializedPanels: PanelName[];
  analysisPoints: AnalysisPoints;
  viewMode: ViewMode;
  narrowMode: boolean;
  hoveredLineNumberLocation: Location | null;
  events: Events;
  isNodePickerActive: boolean;
  canvas: Canvas | null;
  videoUrl: string | null;
  videoNode: HTMLVideoElement | null;
  workspaceId: WorkspaceId | null;
  defaultSettingsTab: SettingsTabTitle;
  recordingTarget: RecordingTarget | null;
  fontLoading: boolean;
  recordingWorkspace: Workspace | null;
  loadedRegions: loadedRegions | null;
  showVideoPanel: boolean;
}

export interface AnalysisPoints {
  [key: string]: PointDescription[] | "error";
}

interface Events {
  [key: string]: MouseEvent[];
}

export type Event = "mousedown";

export interface Canvas {
  gDevicePixelRatio: number;
  height: number;
  left: number;
  scale: number;
  top: number;
  width: number;
}
