import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let bucket;

export const initGridFS = () => {
  const db = mongoose.connection.db;
  if (!db) return;
  bucket = new GridFSBucket(db, { bucketName: "media" });
};

export const getBucket = () => {
  if (!bucket) {
    const db = mongoose.connection.db;
    if (db) bucket = new GridFSBucket(db, { bucketName: "media" });
  }
  return bucket;
};
