import { gql } from "apollo-server-express";

export default gql`
  type Query {
    getUser(profileId: Int!): Login!
    getUsers: [User!]!
    getNoAdmins(lastName: String, limit: Int, offset: Int): [isAdmin!]!
    getAdmins(lastName: String): [isAdmin]
    getCurrentBuild: Int!
  }

  scalar Date

  type isAdmin {
    firstName: String
    lastName: String
    profileId: Int
    image: String
    position: String
  }

  type User {
    DeptId: Int
    FirstName: String
    FirstNameEng: String
    Image: String
    IsEnabled: Boolean
    LastName: String
    LastNameEng: String
    Position: String
    ProfileId: Int
    Room: String
    EmploymentDate: Date
  }

  type Login {
    sessionId: Int
    permission: String
    errorCode: Int
    errorMessage: String
    deptId: Int
    firstName: String
    firstNameEng: String
    image: String
    isEnabled: Boolean
    lastName: String
    lastNameEng: String
    position: String
    profileId: Int
    room: String
    token: String
    refreshToken: String
    employmentDate: Date
    favorites: [String]
    votes: [Vote]
  }

  type Mutation {
    loginHR(login: String!, password: String!): Login!

    login(login: String!, password: String!): Login!

    toggleAdmin(profileId: Int!): Boolean!
  }
`;
