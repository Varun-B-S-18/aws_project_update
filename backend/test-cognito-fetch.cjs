const { Agent, setGlobalDispatcher } = require("undici");

const dispatcher = new Agent({
  connect: {
    family: 4,
    timeout: 15000,
  },
});

setGlobalDispatcher(dispatcher);

async function testCognito() {
  const url =
    "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_HSMjqwIC2/.well-known/jwks.json";

  try {
    const response = await fetch(url);

    console.log("HTTP Status:", response.status);

    const data = await response.json();
    console.log("Signing keys received:", data.keys?.length ?? 0);
  } catch (error) {
    console.error("Fetch failed:", error);
  } finally {
    await dispatcher.close();
  }
}

testCognito();
