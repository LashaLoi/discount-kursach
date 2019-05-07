import mongoose from "mongoose";
const Schema = mongoose.Schema;

const CATEGORY = new Schema({
  name: {
    type: Schema.Types.String,
    required: true
  },
  city: {
    type: Schema.Types.ObjectId,
    required: true
  }
});

export default mongoose.model("Category", CATEGORY);
