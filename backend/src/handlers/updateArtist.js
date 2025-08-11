//PATCH /artist/{id} (amend data)
import {
  GetCommand,
  UpdateCommand,
  BatchWriteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../db.js";
import { artistPK, artistSK, stylePK, styleSK } from "../lib/keys.js";

export const handler = async (event) => {
  const id = event.pathParameters?.id;
  if (!id) return resp(400, { message: "Missing id" });

  const body = safeParse(event.body);
  if (!body) return resp(400, { message: "Invalid JSON" });

  // Load current artist
  const { Item: current } = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: artistPK(id), sk: artistSK() },
    })
  );
  if (!current) return resp(404, { message: "Artist not found" });

  // Build UpdateExpression dynamically
  const allowed = [
    "artistsName",
    "instagramHandle",
    "bio",
    "avatar",
    "profileLink",
    "tattooStudio",
    "address",
    "styles",
    "portfolio",
    "opted_out",
  ];
  const updates = {};
  for (const k of allowed) if (k in body) updates[k] = body[k];

  if (!Object.keys(updates).length)
    return resp(400, { message: "No updatable fields provided" });

  const { updateExpr, names, values } = buildUpdate(updates);

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk: artistPK(id), sk: artistSK() },
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );

  // Reconcile styles fan-out if styles changed
  if ("styles" in updates) {
    const newStyles = new Set(updates.styles || []);
    const oldStyles = new Set(current.styles || []);
    const toAdd = [...newStyles].filter((s) => !oldStyles.has(s));
    const toRemove = [...oldStyles].filter((s) => !newStyles.has(s));

    const writes = [];

    toAdd.forEach((style) => {
      writes.push({
        PutRequest: {
          Item: {
            pk: stylePK(style),
            sk: styleSK(id),
            entityType: "STYLE_ARTIST",
            artistId: id,
            artistsName: updates.artistsName || current.artistsName,
          },
        },
      });
    });

    for (const style of toRemove) {
      writes.push({
        DeleteRequest: {
          Key: { pk: stylePK(style), sk: styleSK(id) },
        },
      });
    }

    // batch write in 25s
    for (let i = 0; i < writes.length; i += 25) {
      await ddb.send(
        new BatchWriteCommand({
          RequestItems: { [TABLE_NAME]: writes.slice(i, i + 25) },
        })
      );
    }
  }

  return resp(204, "");
};

function buildUpdate(obj) {
  const names = {},
    values = {};
  const sets = [];
  Object.entries(obj).forEach(([k, v], i) => {
    const nk = `#n${i}`,
      vk = `:v${i}`;
    names[nk] = k;
    values[vk] = v;
    sets.push(`${nk} = ${vk}`);
  });
  return { updateExpr: `SET ${sets.join(", ")}`, names, values };
}

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
  body: typeof body === "string" ? body : JSON.stringify(body),
});
