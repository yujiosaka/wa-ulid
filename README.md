# wa-ulid ![npm version](https://badge.fury.io/js/wa-ulid.svg) ![CI/CD](https://github.com/yujiosaka/wa-ulid/actions/workflows/ci_cd.yml/badge.svg)

###### [Code of Conduct](https://github.com/yujiosaka/wa-ulid/blob/main/docs/CODE_OF_CONDUCT.md) | [Contributing](https://github.com/yujiosaka/wa-ulid/blob/main/docs/CONTRIBUTING.md) | [Changelog](https://github.com/yujiosaka/wa-ulid/blob/main/docs/CHANGELOG.md)

A high-performance ULID (Universally Unique Lexicographically Sortable Identifier) generator using WebAssembly, up to 40x faster than traditional implementations, optimized for backend use.

## Features

<img src="https://github.com/yujiosaka/wa-ulid/assets/2261067/4b708bac-c20f-44c8-a2ec-9f11ad4d2e60" alt="icon" width="300" align="right">

- **High Performance**: Leveraging WebAssembly for significantly faster performance in generating ULIDs.
- **Secure Randomness**: Utilizes WebAssembly's cryptographic methods, not requiring external crypto modules.
- **Easy Integration**: Fully compatible with [ulid](https://github.com/ulid/javascript)'s API.

### Comparisons with [ulid](https://github.com/ulid/javascript)

- Approximately 40x faster in main ULID generation methods.
- Maintains all API signatures for seamless migration.
- Additional initialization step required for WebAssembly module.

## Installation

Install using npm:

```bash
npm install wa-ulid
```

## Usage

First, initialize the WebAssembly module:

```ts
import init, { ulid } from "wa-ulid";

await init();
```

Then, generate ULIDs:

```ts
console.log(ulid());
```

### Seed Time

The `ulid` function accepts an optional seed time to generate a consistent time-based component:

```ts
console.log(ulid(1593045370000));
```

### Monotonic ULIDs

For generating monotonically increasing identifiers:

```ts
const ulid = monotonicFactory();
console.log(ulid());
console.log(ulid());
```

### Pseudo-Random Number Generators (PRNG)

While `detectPrng` is maintained for API compatibility, the random number generation is handled internally by the WebAssembly module and does not utilize the browser or Node.js crypto APIs.

### Use Your Own PRNG

This feature allows you to specify your own pseudo-random number generator if needed:

```ts
import { factory } from "wa-ulid";
import customPrng from "./myCustomPrng";

const ulid = factory(customPrng);
console.log(ulid());
```

## Considerations

### File Size

- The WebAssembly module increases the file size to approximately 110KB, compared to 4.7KB for [ulid](https://github.com/ulid/javascript).
- Recommended primarily for backend environments due to the larger file size, though it is fully functional in browsers.

## Performance

The benchmarks below demonstrate the significant performance advantage over [ulid](https://github.com/ulid/javascript).

| Function          | ulid              | wa-ulid           | Performance Increase |
| ----------------- | ----------------- | ----------------- | -------------------- |
| `encodeTime`      | 3,863,741 ops/sec | 4,904,495 ops/sec | 1.27x                |
| `decodeTime`      | 1,951,730 ops/sec | 5,336,862 ops/sec | 2.73x                |
| `ulid`            | 44,758 ops/sec    | 1,933,859 ops/sec | **43.20x**           |
| `monotonicUlid()` | 2,382,881 ops/sec | 3,505,757 ops/sec | 1.47x                |

These tests were run on an Apple M2 Pro processor, highlighting the efficiency of the WASM-based implementation. You can run benchmarks in your own environment using `pnpm benchmark`.

## License

This project is licensed under the MIT License. See [LICENSE](https://github.com/yujiosaka/wa-ulid/blob/main/LICENSE) for details.
