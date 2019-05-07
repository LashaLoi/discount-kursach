import { AuthenticationError } from "apollo-server-express";
import { PubSub, withFilter } from "apollo-server-express";
import commentValidate from "../services/comment";
import { isMongoID, calculateRating, Error } from "../helpers/validate";
import nodemailer from "nodemailer";
import { forEach } from "p-iteration";
import { findVoteByBenefit } from "../helpers/helpers";
import { isFileImage } from "../helpers/helpers";

const pubsub = new PubSub();

const COMMENT_SET = "COMMENT_SET";
const COMMENT_DELETED = "COMMENT_DELETED";
const VOTE_SET = "VOTE_SET";
const RATING_SET = "RATING_SET";

export default {
  Query: {
    getComments: async (root, args, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        const data = await db.comment.find({}).sort("-created");

        return data;
      } catch (error) {
        console.log(error);
        return error;
      }
    },
    getComment: async (root, { id }, { user, db }) => {
      try {
        if (!user) {
          throw new AuthenticationError("Access denied");
        }

        isMongoID(id);

        const data = await db.comment.findById(id);

        if (!data) {
          Error(id);
        }

        return data;
      } catch (error) {
        console.log(error);
        return error;
      }
    }
  },
  Comment: {
    votes: async (root, args, { db }) =>
      await db.vote.find({ commentId: root.id }),
    parentBenefit: async (root, args, { db }) => {
      try {
        const data = await db.benefit.findById(root.benefit);

        const url = isFileImage(data.url);

        return Object.assign(data._doc, { url, id: String(data._id) });
      } catch (error) {
        console.log(error);
        return error;
      }
    }
  },
  Mutation: {
    setComment: async (root, args, { user, db, joi }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        const { ProfileId, FirstName, LastName } = user;

        await joi.validate(
          {
            firstName: FirstName,
            lastName: LastName,
            message: args.message,
            benefit: args.benefit,
            userId: ProfileId,
            rating: args.rating
          },
          commentValidate
        );

        const isCommenting = await db.comment.findOne({
          benefit: args.benefit,
          userId: ProfileId
        });

        if (isCommenting) {
          const votes = await db.vote.find({ commentId: isCommenting._id });

          await forEach(votes, async item => {
            await db.vote.findByIdAndRemove(item._id);
          });

          const comment = await db.comment.findByIdAndUpdate(
            isCommenting._id,
            {
              firstName: FirstName,
              lastName: LastName,
              message: args.message,
              benefit: args.benefit,
              rating: args.rating,
              userId: ProfileId,
              created: Date.now()
            },
            { new: true }
          );

          pubsub.publish(COMMENT_SET, {
            benefitId: args.benefit,
            commentSet: comment
          });
        } else {
          const comment = await new db.comment({
            firstName: FirstName,
            lastName: LastName,
            message: args.message,
            benefit: args.benefit,
            rating: args.rating,
            userId: ProfileId,
            created: Date.now()
          }).save();

          pubsub.publish(COMMENT_SET, {
            benefitId: args.benefit,
            commentSet: comment
          });
        }

        const [rating, N] = await calculateRating(args.benefit);

        const result = rating / N;

        await db.benefit.findByIdAndUpdate(
          args.benefit,
          {
            $set: {
              rating: Math.round(result)
            }
          },
          { new: true }
        );

        pubsub.publish(RATING_SET, {
          benefitId: args.benefit,
          ratingSet: Math.round(result)
        });

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    deleteComment: async (root, { id }, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        isMongoID(id);

        const data = await db.comment.findByIdAndRemove(id);

        pubsub.publish(COMMENT_DELETED, {
          benefitId: data.benefit,
          commentDeleted: data
        });

        const [rating, N] = await calculateRating(data.benefit);

        if (N === 0) {
          await db.benefit.findByIdAndUpdate(data.benefit, {
            $set: {
              rating: 0
            }
          });

          pubsub.publish(RATING_SET, {
            benefitId: data.benefit,
            ratingSet: 0
          });

          await db.vote.findOneAndDelete({ commentId: id });
        } else {
          const result = rating / N;

          await db.benefit.findByIdAndUpdate(data.benefit, {
            $set: {
              rating: Math.round(result)
            }
          });

          pubsub.publish(RATING_SET, {
            benefitId: data.benefit,
            ratingSet: Math.round(result)
          });
        }

        return true;
      } catch (error) {
        console.log(error);

        return false;
      }
    },
    setVote: async (root, { commentId }, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        isMongoID(commentId);

        const comment = await db.comment.findById(commentId);

        if (!comment) {
          return false;
        }

        const { ProfileId } = user;

        const isVoting = await db.vote.findOne({
          userId: ProfileId,
          commentId
        });

        if (isVoting) {
          const vote = await db.vote.findByIdAndRemove(isVoting._id);

          const { id } = await findVoteByBenefit(commentId, db);

          pubsub.publish(VOTE_SET, {
            benefitId: id,
            voteSet: vote
          });
        } else {
          const vote = await new db.vote({
            userId: ProfileId,
            commentId
          }).save();

          const { id } = await findVoteByBenefit(commentId, db);

          pubsub.publish(VOTE_SET, {
            benefitId: id,
            voteSet: vote
          });
        }

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    callHR: async (root, { message, userEmail, benefitId }, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        const { EMAIL_TO, EMAIL_FROM, EMAIL_FORM_PASSWORD } = process.env;
        const { FirstName, LastName } = user;

        let transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: EMAIL_FROM,
            pass: EMAIL_FORM_PASSWORD
          }
        });

        let output = null;

        if (benefitId) {
          const {
            name,
            discount,
            working,
            rating,
            description,
            phone,
            link
          } = await db.benefit.findById(benefitId);

          output = `
            <ul>
              <li>Email отправителя: ${userEmail}</li>
              <li>Сообщение: ${message}</li>
              <ul>
                <b>Бенефит</b>
                <li>Имя: ${name}</li>
                <li>Скидка: ${discount}</li>
                <li>Время работы: ${working}</li>
                <li>Рейтинг: ${rating}</li>
                <li>Описание: ${description}</li>
                <li>Телефон: ${phone}</li>
                <li>Сайт: ${link}</li>
              </ul>
            </ul>
          `;
        } else {
          output = `
            <ul>
              <li>Email отправителя: ${userEmail}</li>
              <li>Сообщение: ${message}</li>
            </ul>
          `;
        }

        await transporter.sendMail({
          from: `"${FirstName} ${LastName}"  <email@gmail.com>`,
          to: EMAIL_TO,
          subject: "Вопрос HR",
          html: output
        });

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    }
  },

  Subscription: {
    commentSet: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(COMMENT_SET),
        (payload, { benefitId }) => payload.benefitId === benefitId
      )
    },
    commentDeleted: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(COMMENT_DELETED),
        (payload, { benefitId }) => `${payload.benefitId}` === benefitId
      )
    },
    voteSet: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(VOTE_SET),
        (payload, { benefitId }) => `${payload.benefitId}` === benefitId
      )
    },
    ratingSet: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(RATING_SET),
        (payload, { benefitId }) => `${payload.benefitId}` === benefitId
      )
    }
  }
};
