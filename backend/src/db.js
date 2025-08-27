import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "eu-west-2",
  ...(process.env.IS_OFFLINE && {
    endpoint: "http://localhost:8000",
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
  }),
});
export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});
export const TABLE_NAME = process.env.TABLE_NAME;

if (!TABLE_NAME) {
  throw new Error("TABLE_NAME environment variable is required");
}
