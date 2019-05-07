import { gql } from "apollo-server-express";

export default gql`
  type Location {
    id: ID!
    address: String!
    lat: Float!
    lng: Float!
  }
`;
