import { gql } from "apollo-server-express";

export default gql`
  type Query {
    getCities: [City!]!
    getCity(id: ID!): City!
  }

  type City {
    id: ID!
    name: String!
    categories: [Category]
  }

  type Mutation {
    createCity(name: String!): Boolean!

    updateCity(id: ID!, name: String!): Boolean!

    deleteCity(id: ID!): Boolean!
  }
`;
