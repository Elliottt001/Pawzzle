const localtunnel = require('localtunnel');
(async () => {
  const tunnel = await localtunnel({ port: 7860 });
  console.log("TUNNEL URL:", tunnel.url);
  tunnel.on('close', () => { console.log("closed") });
})();
