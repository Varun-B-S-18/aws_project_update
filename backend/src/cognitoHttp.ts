import * as https from "node:https";
import type { Fetcher } from "aws-jwt-verify/https";

export class CognitoIPv4Fetcher implements Fetcher {
  fetch(uri: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const request = https.get(
        uri,
        {
          family: 4,
          timeout: 15000,
        },
        (response) => {
          if (response.statusCode !== 200) {
            response.resume();
            reject(
              new Error(
                `Cognito JWKS request failed: HTTP ${response.statusCode}`,
              ),
            );
            return;
          }

          const chunks: Buffer[] = [];

          response.on("data", (chunk: Buffer | string) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });

          response.on("end", () => {
            const body = Buffer.concat(chunks);

            resolve(
              body.buffer.slice(
                body.byteOffset,
                body.byteOffset + body.byteLength,
              ) as ArrayBuffer,
            );
          });

          response.on("error", reject);
        },
      );

      request.setTimeout(15000, () => {
        request.destroy(new Error("Cognito JWKS request timed out"));
      });

      request.on("error", reject);
    });
  }
}
