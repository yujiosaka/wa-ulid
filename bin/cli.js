#!/usr/bin/env node
import init, { ulid } from "../dist/index.esm.js";

init().then(() => {
  process.stdout.write(ulid());
});
