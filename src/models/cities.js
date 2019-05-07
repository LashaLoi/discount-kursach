import mongoose from "mongoose";
const Schema = mongoose.Schema;

const City = new Schema({
  name: {
    type: Schema.Types.String,
    unique: true,
    required: true
  }
});

export default mongoose.model("City", City);
