//GET /artists (paginated; optional limit, cursor)

import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../db.js";

export const handler = async (event) => {
  const qs = event.queryStringParameters || {};
  const limit = Math.min(parseInt(qs.limit || "20", 10), 100);
  const cursor = qs.cursor
    ? JSON.parse(Buffer.from(qs.cursor, "base64").toString("utf8"))
    : null;

  const params = {
    TableName: TABLE_NAME,
    IndexName: "EntityIndex",
    KeyConditionExpression: "gsi1pk = :t",
    ExpressionAttributeValues: { ":t": "ARTIST" },
    Limit: limit,
    ExclusiveStartKey: cursor || undefined,
  };

  const { Items, LastEvaluatedKey } = await ddb.send(new QueryCommand(params));

  const nextCursor = LastEvaluatedKey
    ? Buffer.from(JSON.stringify(LastEvaluatedKey)).toString("base64")
    : null;

  return resp(200, { items: Items, nextCursor });
};

const resp = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  },
  body: JSON.stringify(body),
});
