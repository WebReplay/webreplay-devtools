import React from "react";
import { connect } from "react-redux";

import { gql, useQuery } from "@apollo/client";
import Comment from "./Comment";
import CommentMarker from "./CommentMarker";
import { selectors } from "../../reducers";
import { sortBy } from "lodash";

import "./Comments.css";

const GET_COMMENTS = gql`
  query GetComments($recordingId: uuid) {
    comments(where: { recording_id: { _eq: $recordingId } }) {
      id
      content
      created_at
      recording_id
      user_id
      updated_at
      time
    }
  }
`;

function Comments({ playback, recordingId }) {
  const { data } = useQuery(GET_COMMENTS, {
    variables: { recordingId },
  });

  const { comments } = data;
  const sortedComments = sortBy(comments, comment => comment.time);

  return (
    <div className="comments-container">
      {sortedComments.map((comment, index) => (
        <Comment key={comment.id} comment={comment} comments={sortedComments} index={index} />
      ))}
      {!playback ? <CommentMarker comments={sortedComments} /> : null}
    </div>
  );
}

export default connect(state => ({
  playback: selectors.getPlayback(state),
  recordingId: selectors.getRecordingId(state),
}))(Comments);
