//POST /removal-requests

import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { ddb, TABLE_NAME } from "../db.js";

export const handler = async (event) => {
  const body = safeParse(event.body);
  if (!body) return resp(400, { message: "Invalid JSON" });

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

  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return resp(201, { requestId: id });
};

function safeParse(s) {
  try {
    return JSON.parse(s || "{}");
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
