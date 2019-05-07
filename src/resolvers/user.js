import axios from "axios";
import _ from "lodash";
import { forEach } from "p-iteration";
import { createTokens } from "../../auth";
import { Error } from "../helpers/validate";
import https from "https";

export default {
  Query: {
    getCurrentBuild: () => {
      const { MOBILE_BUILD } = process.env;

      return MOBILE_BUILD ? MOBILE_BUILD : 0;
    },
    getUser: async (root, { profileId }, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        const Employee = await db.employee.findOne({ ProfileId: profileId });

        if (!Employee) Error(profileId);

        const date = Employee.EmploymentDate.split("(")[1].split("+")[0];

        return {
          deptId: Employee.DeptId,
          firstName: Employee.FirstName,
          firstNameEng: Employee.FirstNameEng,
          image: Employee.Image,
          isEnabled: Employee.IsEnabled,
          lastName: Employee.LastName,
          lastNameEng: Employee.LastNameEng,
          position: Employee.Position,
          profileId: Employee.ProfileId,
          employmentDate: parseInt(date),
          room: Employee.Room,
          favorites: Employee.favorites
        };
      } catch (error) {
        console.log(error);
        return error;
      }
    },
    getUsers: async (root, args, { user, db }) => {
      if (!user) throw new AuthenticationError("Access denied");

      return await db.employee.find({});
    },
    getNoAdmins: async (
      root,
      { lastName = "", limit, offset },
      { user, db }
    ) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        const users = [];
        let result = null;

        const employee = await db.employee
          .find({
            LastName: { $regex: lastName }
          })
          .limit(limit)
          .skip(offset);

        const hr = await db.hr.find({});

        const data = _.differenceBy(employee, hr, "ProfileId");

        if (lastName) {
          result = data.filter(item => item.LastName.includes(lastName));
        } else {
          result = data;
        }

        await forEach(result, item => {
          users.push({
            firstName: item.FirstName,
            lastName: item.LastName,
            profileId: item.ProfileId,
            image: item.Image,
            position: item.Position
          });
        });

        return users;
      } catch (error) {
        console.log(error);
        return error;
      }
    },
    getAdmins: async (root, { lastName = "" }, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        const admins = [];

        const data = await db.hr.find({});

        await forEach(data, item => {
          admins.push({
            firstName: item.FirstName,
            lastName: item.LastName,
            profileId: item.ProfileId,
            image: item.Image,
            position: item.Position
          });
        });

        if (lastName) {
          const result = admins.filter(item =>
            item.lastName.includes(lastName)
          );

          return result;
        }

        return admins;
      } catch (error) {
        console.log(error);
        return error;
      }
    }
  },
  Login: {
    votes: async (root, args, { user, db }) => {
      try {
        if (!user) throw new AuthenticationError("Access denied");

        const { ProfileId } = user;

        return await db.vote.find({ userId: ProfileId });
      } catch (error) {
        console.log(error);
        return error;
      }
    }
  },
  Mutation: {
    loginHR: async (root, { login, password }, { SECRET1, SECRET2, db }) => {
      try {
        const firstName = login.split(".")[0] || "somefirstname";
        const lastName = login.split(".")[1] || "somelastname";

        if (
          firstName.match(/[а-яё]/i) ||
          lastName.match(/[а-яё]/i) ||
          password.match(/[а-яё]/i) ||
          login.includes("—") ||
          password.includes("—")
        ) {
          throw { message: "Incorrect user name or password", code: 1 };
        }

        const result = await axios.get(
          `https://smg.itechart-group.com/MobileServiceNew/MobileService.svc/Authenticate?username=${login}&password=${password}`,
          {
            httpsAgent: new https.Agent({
              rejectUnauthorized: false
            })
          }
        );

        if (!result) {
          throw { message: "Incorrect user name or password", code: 1 };
        }

        const { SessionId, ErrorCode, Permission } = result.data;

        if (ErrorCode) {
          throw { message: ErrorCode, code: 1 };
        }

        const HR = await db.hr.findOne({
          DomenName: login.toLowerCase()
        });

        if (!HR || HR.length === 0) {
          throw { message: "HR not found", code: 2 };
        }

        const [createToken, createRefreshToken] = await createTokens(
          HR,
          SECRET1,
          SECRET2
        );

        if (!createToken || !createRefreshToken) {
          throw { message: "JWT error", code: 2 };
        }

        return {
          sessionId: SessionId,
          errorCode: 0,
          errorMessage: ErrorCode,
          permission: Permission,
          deptId: HR.DeptId,
          firstName: HR.FirstName,
          firstNameEng: HR.FirstNameEng,
          image: HR.Image,
          isEnabled: HR.IsEnabled,
          lastName: HR.LastName,
          lastNameEng: HR.LastNameEng,
          position: HR.Position,
          profileId: HR.ProfileId,
          room: HR.Room,
          token: createToken,
          refreshToken: createRefreshToken,
          employmentDate: HR.EmploymentDate,
          favorites: HR.favorites
        };
      } catch (error) {
        console.log(error);

        return {
          sessionId: 0,
          errorCode: error.code,
          errorMessage: error.message
        };
      }
    },
    login: async (root, { login, password }, { SECRET1, SECRET2, db }) => {
      try {
        const firstName = login.split(".")[0] || "somefirstname";
        const lastName = login.split(".")[1] || "somelastname";

        if (
          firstName.match(/[а-яё]/i) ||
          lastName.match(/[а-яё]/i) ||
          password.match(/[а-яё]/i) ||
          login.includes("—") ||
          password.includes("—")
        ) {
          throw { message: "Incorrect user name or password", code: 1 };
        }

        const result = await axios.get(
          `https://smg.itechart-group.com/MobileServiceNew/MobileService.svc/Authenticate?username=${login}&password=${password}`,
          {
            httpsAgent: new https.Agent({
              rejectUnauthorized: false
            })
          }
        );

        if (!result) {
          throw { message: "Incorrect user name or password", code: 1 };
        }

        const { SessionId, ErrorCode, Permission } = result.data;

        if (ErrorCode) {
          throw { message: ErrorCode, code: 1 };
        }

        const Employee = await db.employee.findOne({
          DomenName: login.toLowerCase()
        });

        if (!Employee || Employee.length === 0) {
          throw { message: "User not found", code: 2 };
        }

        const [createToken, createRefreshToken] = await createTokens(
          Employee,
          SECRET1,
          SECRET2
        );

        if (!createToken || !createRefreshToken) {
          throw { message: "JWT error", code: 2 };
        }

        const date = Employee.EmploymentDate.split("(")[1].split("+")[0];

        return {
          sessionId: SessionId,
          errorCode: 0,
          errorMessage: ErrorCode,
          permission: Permission,
          deptId: Employee.DeptId,
          firstName: Employee.FirstName,
          firstNameEng: Employee.FirstNameEng,
          image: Employee.Image,
          isEnabled: Employee.IsEnabled,
          lastName: Employee.LastName,
          lastNameEng: Employee.LastNameEng,
          position: Employee.Position,
          profileId: Employee.ProfileId,
          room: Employee.Room,
          token: createToken,
          refreshToken: createRefreshToken,
          employmentDate: parseInt(date),
          favorites: Employee.favorites
        };
      } catch (error) {
        console.log(error.message);

        return {
          sessionId: 0,
          errorCode: parseInt(error.code),
          errorMessage: error.message
        };
      }
    },
    toggleAdmin: async (root, { profileId }, { user, db }) => {
      if (!user) throw new AuthenticationError("Access denied");

      try {
        const data = await db.employee.findOne({ ProfileId: profileId });
        const isAdmin = await db.hr.findOne({ ProfileId: profileId });

        if (isAdmin) {
          await db.hr.findOneAndRemove({ ProfileId: profileId });
        } else {
          await new db.hr({
            DeptId: data.DeptId,
            FirstName: data.FirstName,
            FirstNameEng: data.FirstNameEng,
            Image: data.Image,
            LastName: data.LastName,
            LastNameEng: data.LastNameEng,
            Position: data.Position,
            ProfileId: data.ProfileId,
            Room: data.Room,
            DomenName: data.DomenName,
            EmploymentDate: data.EmploymentDate,
            favorites: []
          }).save();
        }

        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    }
  }
};
