import benchmark from "benchmark";
import * as ulid from "ulid";
import init, * as waUlid from "./dist/index.esm.js";

await init();

const now = Date.now();
const sampleUlid = ulid.ulid();
const monotonicUlid = ulid.monotonicFactory();
const monotonicwaUlid = waUlid.monotonicFactory();

new benchmark.Suite()
  .add("ulid.encodeTime", function () {
    ulid.encodeTime(now, 10);
  })
  .add("wa-ulid.encodeTime", function () {
    waUlid.encodeTime(now, 10);
  })
  .on("cycle", function (event) {
    console.log(String(event.target));
  })
  .on("complete", function () {
    console.log("encodeTime comparison complete. Fastest is " + this.filter("fastest").map("name"));
  })
  .run();

new benchmark.Suite()
  .add("ulid.decodeTime", function () {
    ulid.decodeTime(sampleUlid);
  })
  .add("wa-ulid.decodeTime", function () {
    waUlid.decodeTime(sampleUlid);
  })
  .on("cycle", function (event) {
    console.log(String(event.target));
  })
  .on("complete", function () {
    console.log("decodeTime comparison complete. Fastest is " + this.filter("fastest").map("name"));
  })
  .run();

new benchmark.Suite()
  .add("ulid.ulid", function () {
    ulid.ulid();
  })
  .add("wa-ulid.ulid", function () {
    try {
      waUlid.ulid();
    } catch (error) {
      console.error(error);
    }
  })
  .on("cycle", function (event) {
    console.log(String(event.target));
  })
  .on("complete", function () {
    console.log("ulid comparison complete. Fastest is " + this.filter("fastest").map("name"));
  })
  .run();

new benchmark.Suite()
  .add("ulid.monotonicFactory()", function () {
    monotonicUlid();
  })
  .add("wa-ulid.monotonicFactory()", function () {
    monotonicwaUlid();
  })
  .on("cycle", function (event) {
    console.log(String(event.target));
  })
  .on("complete", function () {
    console.log("monotonicFactory() comparison complete. Fastest is " + this.filter("fastest").map("name"));
  })
  .run();
