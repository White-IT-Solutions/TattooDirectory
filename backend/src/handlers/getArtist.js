import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../db.js";
import { artistPK, artistSK } from "../lib/keys.js";
import { resp } from "../lib/response.js";

//GET /artist/{id}

export const handler = async (event) => {
  const id = event.pathParameters?.id;
  if (!id) return resp(400, { message: "Missing id" });

  const { Item } = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: artistPK(id), sk: artistSK() },
    })
  );

  if (!Item) return resp(404, { message: "Artist not found" });
  return resp(200, Item);
};
