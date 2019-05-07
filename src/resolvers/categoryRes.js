import { AuthenticationError, PubSub, withFilter } from "apollo-server-express";
import categoryValidate from "../services/category";
import { isMongoID, Error } from "../helpers/validate";
import { forEach, map } from "p-iteration";
import { isFileImage } from "../helpers/helpers";

const pubsub = new PubSub();

const CATEGORY_ADDED = "CATEGORY_ADDED";
const CATEGORY_UPDATED = "CATEGORY_UPDATED";
const CATEGORY_DELETED = "CATEGORY_DELETED";

export default {
  Query: {
    getCategories: async (root, args, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        return await db.category.find({});
      } catch (error) {
        console.log(error);
        return error;
      }
    },
    getCategory: async (root, { id }, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        isMongoID(id);

        const data = await db.category.findById(id);

        if (!data) Error(id);

        return data;
      } catch (error) {
        console.log(error);
        return error;
      }
    }
  },
  Category: {
    benefits: async (root, args, { db }) => {
      try {
        const data = await db.benefit.find({ category: root.id });

        const result = await map(data, item => {
          const url = isFileImage(item.url);

          return Object.assign(item._doc, { url, id: String(item._id) });
        });

        return result;
      } catch (error) {
        console.log(error);
        return error;
      }
    },
    parentCity: async (root, args, { db }) => await db.city.findById(root.city)
  },
  Mutation: {
    createCategory: async (root, args, { user, db, joi }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        await joi.validate(args, categoryValidate);
        const category = await new db.category(args).save();

        pubsub.publish(CATEGORY_ADDED, {
          cityId: category.city,
          categoryAdded: category
        });

        return true;
      } catch (error) {
        console.log(error);

        return false;
      }
    },
    updateCategory: async (root, args, { user, db, joi }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        isMongoID(args.id);

        await joi.validate(args, categoryValidate);

        const category = await db.category.findByIdAndUpdate(args.id, args, {
          new: true
        });

        pubsub.publish(CATEGORY_UPDATED, {
          cityId: category.city,
          categoryUpdated: category
        });

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    deleteCategory: async (root, { id }, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        isMongoID(id);

        const benefits = await db.benefit.find({ category: id });

        await forEach(benefits, async item => {
          await db.benefit.findByIdAndRemove(item.id);
        });

        const category = await db.category.findByIdAndRemove(id);

        pubsub.publish(CATEGORY_DELETED, {
          cityId: category.city,
          categoryDeleted: category
        });

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    }
  },
  Subscription: {
    categoryAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(CATEGORY_ADDED),
        (payload, { cityId }) => `${payload.cityId}` === cityId
      )
    },
    categoryUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(CATEGORY_UPDATED),
        (payload, { cityId }) => `${payload.cityId}` === cityId
      )
    },
    categoryDeleted: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(CATEGORY_DELETED),
        (payload, { cityId }) => `${payload.cityId}` === cityId
      )
    }
  }
};
