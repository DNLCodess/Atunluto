// start.js — Plesk production startup file for Next.js
process.env.NODE_ENV = "production";

const { nextStart } = require("next/dist/cli/next-start");

// Pass __dirname so next start always looks for .next/ relative to this
// file, regardless of what Plesk sets as the process working directory.
nextStart({
  port: process.env.PORT || 3000,
  hostname: "0.0.0.0",
  dir: __dirname,
});
