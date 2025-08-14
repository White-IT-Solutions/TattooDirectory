import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../db.js";
import { artistPK, artistSK } from "../lib/keys.js";

//GET /artist/{id}

export const handler = async (event) => {
  const id = event.pathParameters?.id;
  if (!id || typeof id !== "string" || id.trim() === "") {
    return resp(400, { message: "Missing or invalid id" });
  }

  try {
    const { Item } = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: artistPK(id), sk: artistSK() },
      })
    );

    if (!Item) return resp(404, { message: "Artist not found" });
    return resp(200, Item);
  } catch (error) {
    console.error("Error fetching artist:", error.message);
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
