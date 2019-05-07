import mongoose from "mongoose";
const Schema = mongoose.Schema;

const VOTE = new Schema({
  userId: String,
  commentId: String
});

export default mongoose.model("Vote", VOTE);
