import {
  RecordingId,
  sessionError,
  SessionId,
  PointDescription,
  Location,
  MouseEvent,
} from "@recordreplay/protocol";
import { RecordingTarget } from "protocol/thread/thread";
import { Workspace } from "ui/types";

export type PanelName = "console" | "debugger" | "inspector";
export type PrimaryPanelName = "explorer" | "debug" | "comments";
export type ViewMode = "dev" | "non-dev";
export type ModalType = "sharing" | "login" | "settings" | "new-workspace" | "workspace-settings";
export type WorkspaceId = string;
export type SettingsTabTitle = "Experimental" | "Invitations" | "Support" | "Personal";

export interface ExpectedError {
  message: string;
  action?: string;
  type?: "timeout";
}

export interface UploadInfo {
  amount: string;
  total?: string;
}

export interface AppState {
  recordingId: RecordingId | null;
  sessionId: SessionId | null;
  theme: string;
  splitConsoleOpen: boolean;
  indexed: boolean;
  loading: number;
  uploading: UploadInfo | null;
  expectedError: ExpectedError | null;
  unexpectedError: sessionError | null;
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
  workspaceId: WorkspaceId | null;
  defaultSettingsTab: SettingsTabTitle;
  recordingTarget: RecordingTarget | null;
  recordingWorkspace: Workspace | null;
}

export interface AnalysisPoints {
  [key: string]: PointDescription[];
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
