// Creating/adding artists (seeding example)
// If you want an admin script to insert artists (from your scraper or seed data):

import { PutCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../db.js";
import { artistPK, artistSK, stylePK, styleSK } from "../lib/keys.js";
import {
  normalizeArtistForEntityIndex,
  instagramIndex,
} from "../lib/normalize.js";

export async function putArtist(artist) {
  const id = String(artist.PK ?? artist.artistId);
  if (!id) throw new Error("artistId/PK required");

  const profileItem = {
    pk: artistPK(id),
    sk: artistSK(),
    entityType: "ARTIST",
    artistId: id,
    artistsName: artist.artistsName,
    instagramHandle: artist.instagramHandle?.toLowerCase(),
    bio: artist.bio,
    avatar: artist.avatar,
    profileLink: artist.profileLink,
    tattooStudio: artist.tattooStudio,
    address: artist.tattooStudio?.address || artist.address,
    styles: artist.styles || [],
    portfolio: artist.portfolio || [],
    opted_out: !!artist.opted_out,
    ...normalizeArtistForEntityIndex(artist),
    ...instagramIndex(artist.instagramHandle),
  };

  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: profileItem }));

  // fan-out to styles
  const styleItems = (artist.styles || []).map((s) => ({
    PutRequest: {
      Item: {
        pk: stylePK(s),
        sk: styleSK(id),
        entityType: "STYLE_ARTIST",
        artistId: id,
        artistsName: artist.artistsName,
        instagramHandle: artist.instagramHandle?.toLowerCase(),
      },
    },
  }));

  for (let i = 0; i < styleItems.length; i += 25) {
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: { [TABLE_NAME]: styleItems.slice(i, i + 25) },
      })
    );
  }
}
