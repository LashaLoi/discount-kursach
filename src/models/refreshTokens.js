import mongoose from "mongoose";
const Schema = mongoose.Schema;

const RefreshTokenSchema = new Schema({
  value: {
    type: String,
    unique: true
  }
});

export default mongoose.model("refreshToken", RefreshTokenSchema);
