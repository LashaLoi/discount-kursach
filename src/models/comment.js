import mongoose from "mongoose";
const Schema = mongoose.Schema;

const Comments = new Schema({
  firstName: {
    type: Schema.Types.String,
    required: true
  },
  lastName: {
    type: Schema.Types.String,
    required: true
  },
  message: {
    type: Schema.Types.String,
    required: true
  },
  created: {
    type: Schema.Types.Date,
    default: Date.now()
  },
  userId: {
    type: Schema.Types.String,
    required: true
  },
  benefit: {
    type: Schema.Types.ObjectId,
    required: true
  },
  rating: {
    type: Schema.Types.Number,
    required: true
  }
});

export default mongoose.model("comments", Comments);
