import { gql } from "apollo-server-express";

export default gql`
  type Vote {
    id: ID!
    userId: String!
    commentId: ID!
  }
`;
