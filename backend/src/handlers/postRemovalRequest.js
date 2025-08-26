//POST /removal-requests

import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { ddb, TABLE_NAME } from "../db.js";

function safeParse(s) {
  if (!s || typeof s !== "string") return null;

  try {
    const parsed = JSON.parse(s);
    // Only allow plain objects
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      parsed.constructor === Object
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

const resp = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const body = safeParse(event.body);
  if (!body) return resp(400, { message: "Invalid JSON" });

  if (!body.instagramHandle && !body.artistId) {
    return resp(400, {
      message: "Either instagramHandle or artistId is required",
    });
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  const item = {
    pk: `REMOVAL#${id}`,
    sk: "REQUEST",
    entityType: "REMOVAL",
    requestId: id,
    createdAt: now,
    instagramHandle: body.instagramHandle?.toLowerCase(),
    artistId: body.artistId || null,
    reason: body.reason || "",
    status: "received",
  };

  try {
    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return resp(201, { requestId: id });
  } catch (error) {
    console.error("Error creating removal request:", error.message);
    return resp(500, { message: "Internal server error" });
  }
};
