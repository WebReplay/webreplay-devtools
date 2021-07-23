import React, { useState } from "react";
import classnames from "classnames";
import DashboardViewerHeader from "./DashboardViewerHeader";
import DashboardViewerContent from "./DashboardViewerContent";
import { SelectMenu, TextInput } from "ui/components/shared/Forms";
import { prefs } from "ui/utils/prefs";
import { Recording } from "ui/types";
import hooks from "ui/hooks";
import { RecordingId } from "@recordreplay/protocol";

const TIME_IN_MS = {
  day: 86400000,
  week: 86400000 * 7,
  month: 86400000 * 30,
};

export type TimeFilter = "all" | "month" | "week" | "day";
export type AssociationFilter = "all" | "collaborator" | "comment" | "author";

const subStringInString = (subString: string, string: string | null) => {
  if (!string) {
    return false;
  }

  return string.toLowerCase().includes(subString.toLowerCase());
};

function filterRecordings(
  recordings: Recording[],
  timeFilter: TimeFilter,
  associationFilter: AssociationFilter,
  searchString: string
) {
  let filteredRecordings = recordings;
  const { userId } = hooks.useGetUserId();

  if (timeFilter !== "all") {
    filteredRecordings = filteredRecordings.filter(
      r => new Date().getTime() - new Date(r.date).getTime() < TIME_IN_MS[timeFilter]
    );
  }

  if (associationFilter === "collaborator") {
    filteredRecordings = filteredRecordings.filter(
      r => r.collaborators && r.collaborators.some(c => c === userId)
    );
  } else if (associationFilter === "comment") {
    filteredRecordings = filteredRecordings.filter(
      r => r.comments && r.comments.some((c: any) => c.user.id === userId)
    );
  } else if (associationFilter === "author") {
    filteredRecordings = filteredRecordings.filter(r => r.userId === userId);
  }

  filteredRecordings = filteredRecordings.filter(
    r => subStringInString(searchString, r.url) || subStringInString(searchString, r.title)
  );

  return filteredRecordings;
}

export default function DashboardViewer({ recordings }: { recordings: Recording[] }) {
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<RecordingId[]>([]);
  const [searchString, setSearchString] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(prefs.libraryFilterTime as TimeFilter);
  const [associationFilter, setAssociationFilter] = useState<AssociationFilter>(
    prefs.libraryFilterAssociation as AssociationFilter
  );

  const toggleEditing = () => {
    if (editing) {
      setSelectedIds([]);
    }
    setEditing(!editing);
  };
  const setAssociation = (association: AssociationFilter) => {
    setAssociationFilter(association);
    prefs.libraryFilterAssociation = association;
  };
  const setTime = (time: TimeFilter) => {
    setTimeFilter(time);
    prefs.libraryFilterTime = time;
  };
  const filteredRecordings = filterRecordings(
    recordings,
    timeFilter,
    associationFilter,
    searchString
  );

  return (
    <div className={classnames("dashboard-viewer flex-grow", { editing })}>
      <DashboardViewerHeader
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
        toggleEditing={toggleEditing}
        filters={
          <>
            <SelectMenu
              selected={associationFilter}
              setSelected={value => setAssociation(value as AssociationFilter)}
              options={[
                { id: "all", name: "All Replays" },
                { id: "comment", name: "Replays I've commented on" },
                { id: "collaborator", name: "Replays shared with me" },
                { id: "author", name: "Replays I've authored" },
              ]}
              className="w-72"
            />
            <SelectMenu
              selected={timeFilter}
              setSelected={value => setTime(value as TimeFilter)}
              options={[
                { id: "all", name: "All Time" },
                { id: "month", name: "This month" },
                { id: "week", name: "This week" },
                { id: "day", name: "Today" },
              ]}
              className="w-48"
            />
            <TextInput
              placeholder="Search..."
              value={searchString}
              onChange={e => setSearchString((e.target as HTMLInputElement).value)}
            />
          </>
        }
      />
      <DashboardViewerContent
        recordings={filteredRecordings}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        editing={editing}
        timeFilter={timeFilter}
        associationFilter={associationFilter}
        searchString={searchString}
      />
    </div>
  );
}
