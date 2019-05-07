import http from "http";
import cors from "cors";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { ApolloServer } from "apollo-server-express";
import { fileLoader, mergeTypes, mergeResolvers } from "merge-graphql-schemas";
import { refreshTokens } from "./auth";
import { logger } from "./src/helpers/logger";
import { task } from "./src/cronTimer/";
import user from "./src/models/employee";
import jwt from "jsonwebtoken";
import db from "./src/models/db";
import joi from "joi";

dotenv.config();

const {
  DB_CONNECTION,
  DB_CONNECTION_DEV,
  PORT,
  SECRET1,
  SECRET2,
  NODE_ENV
} = process.env;

const isDevelop = NODE_ENV === "development";

const url = isDevelop ? `${DB_CONNECTION_DEV}` : `${DB_CONNECTION}`;

const app = express();

const getUser = async (req, res, next) => {
  const token = req.headers["x-token"] || null;

  if (token) {
    try {
      const data = jwt.verify(token, SECRET1);

      req.user = data.id;
      next();
      return;
    } catch (error) {
      const refreshToken = req.headers["x-refresh-token"] || null;

      if (!refreshToken) {
        req.user = false;
        next();
        return;
      }

      const refreshTokenIsUniq = await db.refreshToken.findOne({
        value: refreshToken
      });

      if (refreshTokenIsUniq) {
        req.user = false;
        next();
        return;
      }

      await new db.refreshToken({ value: refreshToken }).save();

      const newTokens = await refreshTokens(
        refreshToken,
        user,
        SECRET1,
        SECRET2
      );

      if (newTokens.token && newTokens.refreshToken) {
        res.set("Access-Control-Expose-Headers", "x-token, x-refresh-token");
        res.set("x-token", newTokens.token);
        res.set("x-refresh-token", newTokens.refreshToken);
      }

      const data = jwt.verify(newTokens.token, SECRET1);

      req.user = data.id;
      next();
    }
  } else {
    next();
  }
};

mongoose.connect(url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  reconnectTries: Number.MAX_VALUE
});

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, "./src/types/")));
const resolvers = mergeResolvers(
  fileLoader(path.join(__dirname, "./src/resolvers/"))
);

app.use(express.static(__dirname + "/client/build"));
app.use("/admin", express.static(__dirname + "/admin/build"));
app.use("/mobile", express.static(__dirname + "/src/mobile"));
app.use("/images", express.static(__dirname + "/src/images"));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(getUser);
app.use(logger);

app.get("/mobile", (req, res) => {
  res.sendFile(path.join(__dirname, "./src/mobile", "index.html"));
});

app.get("/mobile/:route", (req, res) => {
  res.sendFile(path.join(__dirname, "./src/mobile", req.params.route));
});

app.get("/images/:route", (req, res) => {
  res.sendFile(path.join(__dirname, "./src/images", req.params.route));
});

app.get("/admin*", (req, res) => {
  res.sendFile(path.join(__dirname, "./admin/build", "index.html"));
});

const apollo = new ApolloServer({
  typeDefs,
  resolvers,
  playground: isDevelop,
  subscriptions: {
    path: "/subscriptions/"
  },
  context: ({ req }) => ({
    SECRET1,
    SECRET2,
    db,
    user: req ? req.user : null,
    joi
  })
});

apollo.applyMiddleware({ app });

const httpServer = http.createServer(app);

apollo.installSubscriptionHandlers(httpServer);

app.get("/:route*", (req, res, next) =>
  res.sendFile(path.join(__dirname, "./client/build", "index.html"))
);

mongoose.connection.once("open", () => {
  httpServer.listen(PORT, () => {
    console.log(
      `🚀 Server ready at http${isDevelop ? "" : "s"}://localhost:${PORT}${
        apollo.graphqlPath
      } on ${NODE_ENV} mode`
    );
    console.log(
      `🚀 Subscriptions ready at ws${isDevelop ? "" : "s"}://localhost:${PORT}${
        apollo.subscriptionsPath
      } on ${NODE_ENV} mode`
    );
  });

  task.start();
});

mongoose.connection.once("disconnected", () => {
  task.stop();
});
