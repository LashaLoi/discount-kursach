import { gql } from "apollo-server-express";

export default gql`
  type Query {
    getCategories: [Category!]!
    getCategory(id: ID!): Category!
  }

  type Category {
    id: ID!
    name: String!
    city: ID!
    benefits: [Benefit]
    parentCity: City!
  }

  type Mutation {
    createCategory(name: String!, city: ID!): Boolean!

    updateCategory(name: String, city: ID, id: ID!): Boolean!

    deleteCategory(id: ID!): Boolean!
  }

  type Subscription {
    categoryAdded(cityId: ID!): Category!

    categoryUpdated(cityId: ID!): Category!

    categoryDeleted(cityId: ID!): Category!
  }
`;
