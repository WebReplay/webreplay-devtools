export interface User {
  name: string;
  picture: string;
  id: string;
  internal: boolean;
}

export interface UserSettings {
  apiKeys: ApiKey[];
  showElements: boolean;
  showReact: boolean;
  enableTeams: boolean;
  enableRepaint: boolean;
  defaultWorkspaceId: null | string;
}

export interface ApiKey {
  id: string;
  createdAt: string;
  label: string;
  scopes: string[];
}

export interface ApiKeyResponse {
  key: ApiKey;
  keyValue: string;
}

export interface Recording {
  id: string;
  url: string;
  title: string;
  duration: number;
  date: string;
  private: boolean;
  ownerNeedsInvite: boolean;
  user?: User;
  userId?: string;
  isInitialized: boolean;
  workspace?: Workspace;
  collaborators?: string[];
  comments?: any;
}

export interface PendingWorkspaceInvitation extends Workspace {
  inviterEmail: string | null;
}

export interface Workspace {
  name: string;
  id: string;
  invitationCode: string;
  domain: string;
  isDomainLimitedCode: boolean;
  recordingCount?: number;
  members?: User[];
}

export interface WorkspaceUser {
  membershipId: string;
  pending: boolean;
  email?: string;
  user?: User;
  userId?: string;
  createdAt?: string;
}
