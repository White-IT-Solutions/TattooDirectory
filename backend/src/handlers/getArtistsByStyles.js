//GET /artists/{styles} (comma-separated list, e.g. /artists/Tribal,Old%20School)

import { QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../db.js";
import { stylePK, artistPK, artistSK } from "../lib/keys.js";

export const handler = async (event) => {
  const raw = event.pathParameters?.styles || "";
  const styles = raw
    .split(",")
    .map((s) => decodeURIComponent(s.trim()))
    .filter(Boolean);

  if (!styles.length) return resp(400, { message: "No styles provided" });

  try {
    // Query fan-out items per style concurrently, collect artistIds, then hydrate full artist profiles
    const artistIds = new Set();

    const styleQueries = styles.map((style) =>
      ddb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
          ExpressionAttributeValues: {
            ":pk": stylePK(style),
            ":sk": "ARTIST#",
          },
        })
      )
    );

    const styleQueryResults = await Promise.all(styleQueries);
    styleQueryResults.forEach(({ Items }) => {
      (Items || []).forEach((i) => {
        const id = i.artistId || i.sk?.split("#")[1];
        if (id) artistIds.add(id);
      });
    });

    if (!artistIds.size) return resp(200, { items: [] });

    const keys = Array.from(artistIds).map((id) => ({
      pk: artistPK(id),
      sk: artistSK(),
    }));
    // BatchGet in chunks of 100
    const chunks = chunk(keys, 100);
    const results = [];
    for (const c of chunks) {
      const { Responses } = await ddb.send(
        new BatchGetCommand({
          RequestItems: { [TABLE_NAME]: { Keys: c } },
        })
      );
      results.push(...(Responses?.[TABLE_NAME] || []));
    }

    return resp(200, { items: results });
  } catch (error) {
    console.error("Error fetching artists by styles:", error);
    return resp(500, { message: "Internal server error" });
  }
};

// Split array into chunks of specified size for DynamoDB batch operations
const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};
const resp = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  },
  body: JSON.stringify(body),
});
