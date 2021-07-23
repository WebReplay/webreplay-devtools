import { gql } from "@apollo/client";

export const GET_USER_SETTINGS = gql`
  query GetUserSettings {
    viewer {
      apiKeys {
        id
        createdAt
        label
        scopes
      }
      settings {
        showElements
        showReact
        enableTeams
        enableRepaint
      }
      defaultWorkspace {
        id
      }
    }
  }
`;

export const ADD_USER_API_KEY = gql`
  mutation CreateUserAPIKey($label: String!, $scopes: [String!]!) {
    createUserAPIKey(input: { label: $label, scopes: $scopes }) {
      key {
        id
        label
      }
      keyValue
    }
  }
`;

export const DELETE_USER_API_KEY = gql`
  mutation DeleteUserAPIKey($id: ID!) {
    deleteUserAPIKey(input: { id: $id }) {
      success
    }
  }
`;
