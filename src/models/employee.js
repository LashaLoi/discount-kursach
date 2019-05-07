import mongoose from "mongoose";
const Schema = mongoose.Schema;

const USER = new Schema({
  DeptId: Number,
  FirstName: String,
  FirstNameEng: String,
  Image: String,
  LastName: String,
  LastNameEng: String,
  Position: String,
  ProfileId: Number,
  Room: String,
  DomenName: String,
  EmploymentDate: String,
  favorites: [String]
});

export default mongoose.model("Employee", USER);
