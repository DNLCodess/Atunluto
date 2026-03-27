// start.js — Plesk production startup file for Next.js
process.env.NODE_ENV = "production";

const { nextStart } = require("next/dist/cli/next-start");

nextStart({
  port: process.env.PORT || 3000,
  hostname: "0.0.0.0",
});
