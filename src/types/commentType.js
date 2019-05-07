import { gql } from "apollo-server-express";

export default gql`
  type Query {
    getComments: [Comment!]!
    getComment(id: ID!): Comment!
  }

  type Comment {
    id: String!
    firstName: String!
    lastName: String!
    created: Date!
    message: String!
    benefit: ID!
    userId: ID!
    rating: Int!
    votes: [Vote]
    parentBenefit: Benefit!
  }

  type Mutation {
    setComment(message: String!, benefit: ID!, rating: Int!): Boolean!

    setVote(commentId: ID!): Boolean!

    callHR(message: String!, userEmail: String!, benefitId: ID): Boolean!

    deleteComment(id: ID!): Boolean!
  }

  type Subscription {
    commentSet(benefitId: ID!): Comment!

    commentDeleted(benefitId: ID!): Comment!

    voteSet(benefitId: ID!): Vote!

    ratingSet(benefitId: ID!): Int!
  }
`;
