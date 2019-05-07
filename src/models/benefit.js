import mongoose from "mongoose";
const Schema = mongoose.Schema;

const Locations = new Schema({
  address: {
    type: Schema.Types.String,
    required: true
  },
  lat: {
    type: Schema.Types.Number,
    required: true
  },
  lng: {
    type: Schema.Types.Number,
    required: true
  }
});

const BENEFIT = new Schema({
  name: {
    type: Schema.Types.String,
    required: true,
    default: "Не указано"
  },
  discount: [
    {
      type: Schema.Types.String,
      required: true
    }
  ],
  description: {
    type: Schema.Types.String,
    required: true
  },
  working: {
    type: Schema.Types.String,
    default: Date.now(),
    required: true
  },
  category: {
    type: Schema.Types.ObjectId,
    required: true
  },
  secret: {
    type: Schema.Types.String
  },
  rating: {
    type: Schema.Types.Number,
    default: 0
  },
  url: {
    type: Schema.Types.String
  },
  link: {
    type: Schema.Types.String
  },
  count: {
    type: Schema.Types.Number,
    default: 0
  },
  phone: {
    type: Schema.Types.String
  },
  updatedAt: {
    type: Schema.Types.Date
  },
  createdAt: {
    type: Schema.Types.Date
  },
  locations: [Locations]
});

export default mongoose.model("Benefit", BENEFIT);
