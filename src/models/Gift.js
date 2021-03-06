import { model, Schema } from "mongoose";

const giftSchema = new Schema({
  name: String,
  point: Number,
  image: String,
  type: Number,
  screenId: String,
  foodId: String,
  discount: Number,
});

module.exports = model("gifts", giftSchema);
