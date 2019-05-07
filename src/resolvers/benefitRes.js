import { createWriteStream } from "fs";
import { AuthenticationError, PubSub, withFilter } from "apollo-server-express";
import benefitValidate from "../services/benefit";
import { isMongoID, Error } from "../helpers/validate";
import { findBenefitByCity, isFileImage } from "../helpers/helpers";
import uuid from "uuid/v4";
import { map } from "p-iteration";

const pubsub = new PubSub();

const BENEFIT_ADDED = "BENEFIT_ADDED";
const BENEFIT_UPDATED = "BENEFIT_UPDATED";
const BENEFIT_DELETED = "BENEFIT_DELETED";
const FAVORITE_TOGGLE = "FAVORITE_TOGGLE";

export default {
  Query: {
    getBenefits: async (root, args, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        const data = await db.benefit.find({});

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
    getBenefit: async (root, { id }, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        isMongoID(id);

        const data = await db.benefit.findById(id);

        if (!data) Error(id);

        const url = isFileImage(data.url);

        return Object.assign(data._doc, { url, id: String(data._id) });
      } catch (error) {
        console.log(error);
        return error;
      }
    }
  },

  Benefit: {
    parentCategory: async (root, args, { db }) =>
      await db.category.findById(root.category),
    comments: async (root, args, { db }) =>
      await db.comment.find({ benefit: root.id }).sort("-created")
  },

  Mutation: {
    createBenefit: async (root, args, { user, db, joi }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        await joi.validate(args, benefitValidate);

        const benefit = await new db.benefit(
          Object.assign(args, {
            updatedAt: Date.now(),
            createdAt: Date.now()
          })
        ).save();

        const { id } = await findBenefitByCity(benefit.category, db);

        const url = isFileImage(benefit.url);

        pubsub.publish(BENEFIT_ADDED, {
          cityId: id,
          benefitAdded: Object.assign(benefit, { url })
        });

        return true;
      } catch (error) {
        console.log(error);
        return error;
      }
    },
    updateBenefit: async (root, args, { user, db, joi }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        isMongoID(args.id);

        await joi.validate(args, benefitValidate);

        const benefit = await db.benefit.findByIdAndUpdate(
          args.id,
          Object.assign({}, args, { updatedAt: Date.now() }),
          { new: true }
        );

        const { id } = await findBenefitByCity(benefit.category, db);

        const url = isFileImage(benefit.url);

        pubsub.publish(BENEFIT_UPDATED, {
          cityId: id,
          benefitUpdated: Object.assign(benefit, { url })
        });

        return true;
      } catch (error) {
        console.log(error);
        return error;
      }
    },
    deleteBenefit: async (root, { id }, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        isMongoID(id);

        const benefit = await db.benefit.findByIdAndRemove(id);

        const { city } = await db.category.findById(benefit.category);
        const { id: cityId } = await db.city.findById(city);

        const url = isFileImage(benefit.url);

        pubsub.publish(BENEFIT_DELETED, {
          cityId,
          benefitDeleted: Object.assign(benefit, { url })
        });

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    toggleFavorite: async (root, { id }, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        isMongoID(id);

        const { ProfileId } = user;

        const data = await db.employee.findOne({ ProfileId });

        if (!data.favorites.find(item => item === id)) {
          const employee = await db.employee.findByIdAndUpdate(
            data._id,
            {
              $set: {
                favorites: [...data.favorites, id]
              }
            },
            { new: true }
          );

          pubsub.publish(FAVORITE_TOGGLE, {
            userId: ProfileId,
            favoriteToggle: employee
          });
        } else {
          const employee = await db.employee.findByIdAndUpdate(
            data._id,
            {
              $set: {
                favorites: data.favorites.filter(item => item !== id)
              }
            },
            { new: true }
          );

          pubsub.publish(FAVORITE_TOGGLE, {
            userId: ProfileId,
            favoriteToggle: employee
          });
        }

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    singleUpload: async (root, { file }, { user }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        const scream = await file;

        const fileName = uuid() + Math.random() + scream.filename;

        await scream
          .createReadStream()
          .pipe(createWriteStream(__dirname + "/../../src/images/" + fileName));

        return fileName;
      } catch (error) {
        console.log(error);
        return false;
      }
    }
  },

  Subscription: {
    benefitAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(BENEFIT_ADDED),
        (payload, { cityId }) => `${payload.cityId}` === cityId
      )
    },
    benefitUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(BENEFIT_UPDATED),
        (payload, { cityId }) => `${payload.cityId}` === cityId
      )
    },
    benefitDeleted: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(BENEFIT_DELETED),
        (payload, { cityId }) => `${payload.cityId}` === cityId
      )
    },
    favoriteToggle: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(FAVORITE_TOGGLE),
        (payload, { userId }) => `${payload.userId}` === userId
      )
    }
  }
};
