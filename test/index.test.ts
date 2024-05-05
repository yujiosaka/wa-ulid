// Tests are borrowed from https://github.com/ulid/javascript/blob/master/test.js

import assert from "assert";
import child_process from "child_process";
import path from "path";
import lolex, { InstalledClock } from "lolex";
import { afterAll, beforeAll, describe, it } from "vitest";
import init, * as ULID from "../dist/index.esm.js";

await init();

const ulid = ULID.factory();

describe("ulid", () => {
  describe("prng", () => {
    const prng = ULID.detectPrng();

    it("should produce a number", () => {
      assert.strictEqual(false, isNaN(prng()));
    });

    it("should be between 0 and 1", () => {
      const num = prng();
      assert(num >= 0 && num <= 1);
    });
  });

  describe("incremenet base32", () => {
    it("increments correctly", () => {
      assert.strictEqual("A109D", ULID.incrementBase32("A109C"));
    });

    it("carries correctly", () => {
      assert.strictEqual("A1Z00", ULID.incrementBase32("A1YZZ"));
    });

    it("double increments correctly", () => {
      assert.strictEqual("A1Z01", ULID.incrementBase32(ULID.incrementBase32("A1YZZ")));
    });

    it("throws when it cannot increment", () => {
      assert.throws(() => {
        ULID.incrementBase32("ZZZ");
      });
    });
  });

  describe("randomChar", () => {
    const sample: Record<string, number> = {};
    const prng = ULID.detectPrng();

    for (let x = 0; x < 320000; x++) {
      const char = String(ULID.randomChar(prng)); // for if it were to ever return undefined
      if (sample[char] === undefined) {
        sample[char] = 0;
      }
      sample[char] += 1;
    }

    it("should never return undefined", () => {
      assert.strictEqual(undefined, sample["undefined"]);
    });

    it("should never return an empty string", () => {
      assert.strictEqual(undefined, sample[""]);
    });
  });

  describe("encodeTime", () => {
    it("should return expected encoded result", () => {
      assert.strictEqual("01ARYZ6S41", ULID.encodeTime(1469918176385, 10));
    });

    it("should change length properly", () => {
      assert.strictEqual("0001AS99AA60", ULID.encodeTime(1470264322240, 12));
    });

    it("should truncate time if not enough length", () => {
      assert.strictEqual("AS4Y1E11", ULID.encodeTime(1470118279201, 8));
    });

    describe("should throw an error", () => {
      it("if time greater than (2 ^ 48) - 1", () => {
        assert.throws(() => {
          ULID.encodeTime(Math.pow(2, 48), 8);
        }, Error);
      });

      it("if time is not a number", () => {
        assert.throws(() => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          ULID.encodeTime("test", 8);
        }, Error);
      });

      it("if time is infinity", () => {
        assert.throws(() => {
          ULID.encodeTime(Infinity, 8);
        }, Error);
      });

      it("if time is negative", () => {
        assert.throws(() => {
          ULID.encodeTime(-1, 8);
        }, Error);
      });

      it("if time is a float", () => {
        assert.throws(() => {
          ULID.encodeTime(100.1, 8);
        }, Error);
      });
    });
  });

  describe("encodeRandom", () => {
    const prng = ULID.detectPrng();

    it("should return correct length", () => {
      assert.strictEqual(12, ULID.encodeRandom(12, prng).length);
    });
  });

  describe("decodeTime", () => {
    it("should return correct timestamp", () => {
      const timestamp = Date.now();
      const id = ulid(timestamp);
      assert.strictEqual(timestamp, ULID.decodeTime(id));
    });

    it("should accept the maximum allowed timestamp", () => {
      assert.strictEqual(281474976710655, ULID.decodeTime("7ZZZZZZZZZZZZZZZZZZZZZZZZZ"));
    });

    describe("should reject", () => {
      it("malformed strings of incorrect length", () => {
        assert.throws(() => {
          ULID.decodeTime("FFFF");
        }, Error);
      });

      it("strings with timestamps that are too high", () => {
        assert.throws(() => {
          ULID.decodeTime("80000000000000000000000000");
        }, Error);
      });
    });
  });

  describe("ulid", () => {
    it("should return correct length", () => {
      assert.strictEqual(26, ulid().length);
    });

    it("should return expected encoded time component result", () => {
      assert.strictEqual("01ARYZ6S41", ulid(1469918176385).substring(0, 10));
    });
  });

  describe("monotonicity", () => {
    function stubbedPrng() {
      return 0.96;
    }

    describe("without seedTime", () => {
      const stubbedUlid = ULID.monotonicFactory(stubbedPrng);
      let clock: InstalledClock;

      beforeAll(() => {
        clock = lolex.install({
          now: 1469918176385,
          toFake: ["Date"],
        });
      });

      afterAll(() => {
        clock.uninstall();
      });

      it("first call", () => {
        assert.strictEqual("01ARYZ6S41YYYYYYYYYYYYYYYY", stubbedUlid());
      });

      it("second call", () => {
        assert.strictEqual("01ARYZ6S41YYYYYYYYYYYYYYYZ", stubbedUlid());
      });

      it("third call", () => {
        assert.strictEqual("01ARYZ6S41YYYYYYYYYYYYYYZ0", stubbedUlid());
      });

      it("fourth call", () => {
        assert.strictEqual("01ARYZ6S41YYYYYYYYYYYYYYZ1", stubbedUlid());
      });
    });

    describe("with seedTime", () => {
      const stubbedUlid = ULID.monotonicFactory(stubbedPrng);

      it("first call", () => {
        assert.strictEqual("01ARYZ6S41YYYYYYYYYYYYYYYY", stubbedUlid(1469918176385));
      });

      it("second call with the same", () => {
        assert.strictEqual("01ARYZ6S41YYYYYYYYYYYYYYYZ", stubbedUlid(1469918176385));
      });

      it("third call with less than", () => {
        assert.strictEqual("01ARYZ6S41YYYYYYYYYYYYYYZ0", stubbedUlid(100000000));
      });

      it("fourth call with even more less than", () => {
        assert.strictEqual("01ARYZ6S41YYYYYYYYYYYYYYZ1", stubbedUlid(10000));
      });

      it("fifth call with 1 greater than", () => {
        assert.strictEqual("01ARYZ6S42YYYYYYYYYYYYYYYY", stubbedUlid(1469918176386));
      });
    });
  });

  describe("command line", () => {
    it("should return a valid ULID", () =>
      new Promise((done) => {
        child_process.exec(path.join(__dirname, "../bin/cli.js"), (error, stdout, stderr) => {
          if (stdout.length === 26 && !error && !stderr) {
            done(undefined);
          } else {
            done(error || stderr);
          }
        });
      }));
  });
});
