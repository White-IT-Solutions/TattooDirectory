//GET /artists (paginated; optional limit, cursor)

import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../db.js";

export const handler = async (event) => {
  const qs = event.queryStringParameters || {};
  const parsedLimit = parseInt(qs.limit || "20", 10);
  const limit = Math.min(isNaN(parsedLimit) ? 20 : parsedLimit, 100);

  let cursor = null;
  if (qs.cursor) {
    try {
      cursor = JSON.parse(Buffer.from(qs.cursor, "base64").toString("utf8"));
    } catch (error) {
      return resp(400, { message: "Invalid cursor" });
    }
  }

  const params = {
    TableName: TABLE_NAME,
    IndexName: "EntityIndex",
    KeyConditionExpression: "gsi1pk = :t",
    ExpressionAttributeValues: { ":t": "ARTIST" },
    Limit: limit,
    ExclusiveStartKey: cursor || undefined,
  };

  try {
    const { Items, LastEvaluatedKey } = await ddb.send(
      new QueryCommand(params)
    );

    const nextCursor = LastEvaluatedKey
      ? Buffer.from(JSON.stringify(LastEvaluatedKey)).toString("base64")
      : null;

    return resp(200, { items: Items, nextCursor });
  } catch (error) {
    console.error("Error listing artists:", error);
    return resp(500, { message: "Internal server error" });
  }
};

const resp = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  },
  body: JSON.stringify(body),
});
