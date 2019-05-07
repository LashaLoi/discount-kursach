import db from "../models/db";
import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import _ from "lodash";
import { forEach } from "p-iteration";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const readdir = promisify(fs.readdir);

dotenv.config();

const {
  DB_CONNECTION_DEV,
  DB_CONNECTION,
  USER_LOGIN,
  USER_PASSWORD,
  NODE_ENV
} = process.env;

const url =
  NODE_ENV === "development" ? `${DB_CONNECTION_DEV}` : `${DB_CONNECTION}`;

mongoose.connect(url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  reconnectTries: Number.MAX_VALUE
});

const resetLogs = async () => {
  await fs.writeFile(
    path.resolve(__dirname, "../../logs/logs.log"),
    "",
    "utf8",
    (err, data) => {
      if (err) console.log(err);
    }
  );
};

const deleteRefreshTokens = async () => {
  try {
    const data = await db.refreshToken.find({});

    if (data.length) {
      await forEach(data, async item => {
        await db.refreshToken.findByIdAndRemove(item._id);
      });
    }

    console.log("refresh is delete");
  } catch (error) {
    console.log(error);
  }
};

const deleteAll = async () => {
  try {
    const employees = await db.employee.find({});

    if (employees) {
      await forEach(employees, async item => {
        await db.employee.findByIdAndRemove(item._id);
      });
    }

    console.log("all is deleted");
  } catch (error) {
    console.log(error);
  }
};

const updateUsers = async () => {
  try {
    let arrayOfUsers = [];

    const dbUsers = await db.employee.find({});

    const first = await axios.post(
      "https://smg.itechart-group.com/MobileServiceNew/MobileService.svc/PostAuthenticate",
      {
        Username: USER_LOGIN,
        Password: USER_PASSWORD
      }
    );
    const id = first.data.SessionId;

    const result = await axios.get(
      `https://smg.itechart-group.com//MobileServiceNew/MobileService.svc/GetAllEmployees?sessionId=${id}`
    );

    await forEach(result.data.Profiles, async item => {
      const data = await axios.get(
        `https://smg.itechart-group.com/MobileServiceNew/MobileService.svc/GetEmployeeDetails?sessionId=${id}&profileId=${
          item.ProfileId
        }`
      );

      arrayOfUsers.push({
        DeptId: data.data.Profile.DeptId,
        FirstName: data.data.Profile.FirstName,
        FirstNameEng: data.data.Profile.FirstNameEng,
        Image: data.data.Profile.Image,
        LastName: data.data.Profile.LastName,
        LastNameEng: data.data.Profile.LastNameEng,
        Position: data.data.Profile.Rank,
        ProfileId: data.data.Profile.ProfileId,
        Room: data.data.Profile.Room,
        DomenName: data.data.Profile.DomenName.toLowerCase(),
        EmploymentDate: data.data.Profile.EmploymentDate,
        favorites: []
      });
    });

    const mergeDbUsers = _.unionBy(dbUsers, arrayOfUsers, "ProfileId");

    const diffUsers = _.differenceBy(mergeDbUsers, arrayOfUsers, "ProfileId");
    const newDbUsers = _.differenceBy(mergeDbUsers, diffUsers, "ProfileId");

    const newData = newDbUsers.map(item => {
      if (item._id) {
        delete item._doc._id;
        delete item._doc.__v;
      }

      return item;
    });

    await deleteAll();

    await forEach(newData, async item => {
      await new db.employee({
        DeptId: item.DeptId,
        FirstName: item.FirstName,
        FirstNameEng: item.FirstNameEng,
        Image: item.Image,
        LastName: item.LastName,
        LastNameEng: item.LastNameEng,
        Position: item.Position || "",
        ProfileId: item.ProfileId,
        Room: item.Room,
        DomenName: item.DomenName.toLowerCase(),
        EmploymentDate: item.EmploymentDate,
        favorites: item.favorites
      }).save();
    });

    console.log("users is updates");
  } catch (error) {
    console.log(error);
  }
};

const checkImages = async () => {
  const dir = __dirname + "/../../src/images/";
  const benefits = await db.benefit.find({});

  let isActive = [];

  await forEach(benefits, async item => {
    const { url } = await db.benefit.findById(item.id);

    fs.exists(dir + url, exists => {
      if (exists) isActive.push(url);
    });
  });

  const data = await readdir(dir);

  const result = _.difference(data, isActive);

  if (result.length) {
    await forEach(result, item => {
      fs.unlink(dir + item, err => {
        if (err) return console.log(err);
      });
    });
  }
};

mongoose.connection.once("open", async () => {
  console.log("start");
  await deleteRefreshTokens();
  await updateUsers();
  await checkImages();
  await resetLogs();
  console.log("finish");
  process.exit();
});
