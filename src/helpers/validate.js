import { UserInputError, ApolloError } from "apollo-server-express";
import mongoose from "mongoose";
import db from "../models/db";

export const dataIsValid = (err, res) => {
  if (err) {
    throw new UserInputError("Form Arguments invalid.", {
      invalidArgs: Object.keys(args)
    });
  }
  return res;
};

export const Error = id => {
  throw new ApolloError(
    `Benefit with such id ${id} not found`,
    "BENEFIT_NOT_FOUND",
    { id }
  );
};

export const isMongoID = id => {
  if (!mongoose.Types.ObjectId.isValid(id)) Error(id);
};

export const calculateRating = async id => {
  try {
    const votes = await db.comment.find({ benefit: id });

    const rating = votes.reduce((sum, item) => sum + item.rating, 0);
    const N = votes.length;

    return [rating, N];
  } catch (error) {
    console.log(error);
  }
};
