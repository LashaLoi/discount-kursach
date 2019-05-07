import { AuthenticationError } from "apollo-server-express";
import cityValidate from "../services/city";
import { isMongoID, Error } from "../helpers/validate";

export default {
  Query: {
    getCities: async (root, args, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        return await db.city.find({});
      } catch (error) {
        console.log(error);
        return error;
      }
    },
    getCity: async (root, { id }, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        isMongoID(id);

        const data = await db.city.findById(id);

        if (!data) Error(id);

        return data;
      } catch (error) {
        console.log(error);
        return error;
      }
    }
  },
  City: {
    categories: async (root, args, { db }) =>
      await db.category.find({ city: root.id })
  },
  Mutation: {
    createCity: async (root, args, { user, db, joi }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        await joi.validate(args, cityValidate);
        await new db.city(args).save();

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    updateCity: async (root, args, { user, db, joi }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        isMongoID(args.id);

        await joi.validate(args, cityValidate);

        await db.city.findByIdAndUpdate(args.id, args);

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    deleteCity: async (root, { id }, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        isMongoID(id);

        await db.city.findByIdAndRemove(id);

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    }
  }
};
