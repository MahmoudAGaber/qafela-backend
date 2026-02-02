import mongoose from "mongoose";

export async function connectMongo() {
  const uri = process.env.MONGO_URL || "mongodb://localhost:27017/qafela_dev";
  const dbName = process.env.MONGO_DB || "qafela_dev";

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName });
  console.log("MongoDB connected successfully:", uri.includes("@") ? "remote" : "localhost");
}
