import { gql } from "apollo-server-express";

export default gql`
  type Query {
    getBenefits: [Benefit]
    getBenefit(id: ID!): Benefit!
  }

  type Benefit {
    id: ID!
    discount: [String]
    name: String!
    description: String!
    working: String!
    category: ID!
    secret: String
    phone: String!
    count: Int!
    rating: Int!
    url: String!
    link: String!
    createdAt: Date
    updatedAt: Date
    locations: [Location]
    parentCategory: Category!
    comments: [Comment]
  }

  input LocationInput {
    address: String!
    lat: Float!
    lng: Float!
  }

  type Mutation {
    createBenefit(
      discount: [String!]!
      name: String!
      description: String!
      working: String
      category: ID!
      locations: [LocationInput]
      url: String!
      link: String!
      phone: String!
    ): Boolean!

    updateBenefit(
      id: ID
      discount: [String]
      name: String
      description: String
      working: String
      category: ID
      locations: [LocationInput]
      rating: Int
      url: String
      link: String
      phone: String
      count: Int
    ): Boolean!

    deleteBenefit(id: ID!): Boolean!

    toggleFavorite(id: ID!): Boolean!

    singleUpload(file: Upload!): String!
  }

  type Subscription {
    favoriteToggle(userId: String!): Login!

    benefitAdded(cityId: ID!): Benefit!

    benefitUpdated(cityId: ID!): Benefit!

    benefitDeleted(cityId: ID!): Benefit!
  }
`;
