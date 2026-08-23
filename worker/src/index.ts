// worker/src/index.ts
import http from "node:http";
import "./processors/email.processor.js";

console.log("Worker started, listening for jobs...");

// Render's free Web Service tier requires something bound to a port for
// its health check to pass. This server does nothing functional — the
// real work happens in email.processor.ts via BullMQ's Worker, which is
// already running independently in the background the moment it's imported.
const PORT = process.env.PORT || 8080;
http
    .createServer((_req, res) => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("worker ok");
    })
    .listen(PORT, () => {
        console.log(`Worker health server listening on port ${PORT}`);
    });