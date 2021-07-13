// Test that using a recording ID that isn't a valid UUID shows an appropriate error.

import { runTest, devtoolsURL } from "../src/runTest";
import { installMockEnvironment } from "../src/mockEnvironment";
import { v4 as uuid } from "uuid";
import {
  createRecordingIsInitializedMock,
  createRecordingOwnerUserIdMock,
  createGetRecordingMock,
  createRecordingIsInitializedErrorMock,
  createUserSettingsMock,
  createGetUserMock,
} from "../src/graphql";
import { Page } from "@recordreplay/playwright";

const recordingId = "foobar";
const userId = uuid();
const user = { id: userId, uuid: userId };
const graphqlMocks = [
  ...createUserSettingsMock(),
  createRecordingIsInitializedErrorMock({ recordingId }),
  //createRecordingIsInitializedMock({ recordingId, isInitialized: true }),
  //createRecordingOwnerUserIdMock({ recordingId, user }),
  //createGetRecordingMock({ recordingId }),
  ...createGetUserMock({ user }),
];

runTest("notUUID", async (page: Page) => {
  await page.goto(devtoolsURL({ id: recordingId }));
  await installMockEnvironment(page, { graphqlMocks });
  await new Promise(resolve => setTimeout(resolve, 5000));
});
