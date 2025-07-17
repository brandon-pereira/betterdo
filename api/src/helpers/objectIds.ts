import { ObjectId } from "mongodb";
import { throwError } from "./errorHandler";

export function parseObjectID(id: string | ObjectId): ObjectId {
  try {
    return new ObjectId(id);
  } catch {
    throwError("Invalid List ID");
  }
}
