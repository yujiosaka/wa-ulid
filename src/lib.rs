use rand::Rng;
use wasm_bindgen::prelude::{wasm_bindgen, JsError};

const ENCODING: &str = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ENCODING_LEN: usize = ENCODING.len();
const ENCODING_BYTES: &[u8] = ENCODING.as_bytes();
const MAX_CHAR_INDEX: usize = ENCODING.len() - 1;
const TIME_MAX: f64 = ((1u64 << 48) - 1) as f64;
const TIME_LEN: usize = 10;
const RANDOM_LEN: usize = 16;

// Precomputed powers of the length of the encoding up to TIME_LEN.
const POWERS: [f64; 10] = [
    1.0,
    32.0,
    1024.0,
    32768.0,
    1048576.0,
    33554432.0,
    1073741824.0,
    34359738368.0,
    1099511627776.0,
    35184372088832.0,
];

#[wasm_bindgen]
extern "C" {
    pub type Prng;

    #[wasm_bindgen(method, structural, js_name = call, js_namespace = Function)]
    fn call(this: &Prng) -> f64;
}

#[wasm_bindgen]
pub fn replace_char_at(str: &str, index: usize, char: char) -> String {
    if index >= str.len() {
        return str.to_string();
    }
    let mut chars = str.chars().collect::<Vec<_>>();
    chars[index] = char;
    return chars.into_iter().collect();
}

#[wasm_bindgen]
pub fn increment_base32(str: &str) -> Result<String, JsError> {
    let mut bytes = str.as_bytes().to_vec();
    for i in (0..bytes.len()).rev() {
        match ENCODING_BYTES.iter().position(|&x| x == bytes[i]) {
            Some(char_index) if char_index == MAX_CHAR_INDEX => {
                bytes[i] = ENCODING_BYTES[0];
            }
            Some(char_index) => {
                bytes[i] = ENCODING_BYTES[char_index + 1];
                return Ok(String::from_utf8(bytes).unwrap());
            }
            None => return Err(JsError::new("incorrectly encoded string")),
        }
    }
    Err(JsError::new("cannot increment this string"))
}

#[wasm_bindgen]
pub fn random_char(random_value: f64) -> char {
    let rand = random_value * ENCODING_LEN as f64;
    let index = rand as usize % ENCODING_LEN;
    ENCODING_BYTES[index] as char
}

#[wasm_bindgen]
pub fn encode_time(now: f64, len: usize) -> Result<String, JsError> {
    if now.is_nan() {
        return Err(JsError::new(&format!("{} must be a number", now)));
    }
    if now > TIME_MAX {
        return Err(JsError::new(&format!(
            "cannot encode time greater than {}",
            TIME_MAX
        )));
    }
    if now < 0.0 {
        return Err(JsError::new("time must be positive"));
    }
    if now.fract() != 0.0 {
        return Err(JsError::new("time must be an integer"));
    }
    let mut now_int = now as u64;
    let mut chars = Vec::with_capacity(len);
    for _ in 0..len {
        let mod_ = now_int % ENCODING_LEN as u64;
        chars.push(ENCODING_BYTES[mod_ as usize] as char);
        now_int /= ENCODING_LEN as u64;
    }
    chars.reverse();
    Ok(chars.into_iter().collect())
}

#[wasm_bindgen]
pub fn encode_random(len: usize, prng: Option<Prng>) -> String {
    let mut str = String::with_capacity(len);
    for _ in 0..len {
        let random_value = match &prng {
            Some(prng) => prng.call(),
            None => random_value(),
        };
        str.push(random_char(random_value));
    }
    str
}

#[wasm_bindgen]
pub fn decode_time(id: &str) -> Result<f64, JsError> {
    if id.len() != TIME_LEN + RANDOM_LEN {
        return Err(JsError::new("malformed ulid"));
    }
    let time_part = &id[0..TIME_LEN];
    let mut time = 0.0;
    for (index, char) in time_part.chars().rev().enumerate() {
        match ENCODING.find(char) {
            Some(i) => {
                time += i as f64 * POWERS[index];
            }
            None => {
                return Err(JsError::new(&format!("invalid character found: {}", char)));
            }
        }
    }
    if time > TIME_MAX {
        return Err(JsError::new("malformed ulid, timestamp too large"));
    }
    Ok(time)
}

#[wasm_bindgen]
pub fn random_value() -> f64 {
    let mut rng = rand::thread_rng();
    rng.gen()
}

#[wasm_bindgen]
pub fn ulid(seed_time: f64, prng: Option<Prng>) -> Result<String, JsError> {
    let time = encode_time(seed_time, TIME_LEN)?;
    Ok(time + &encode_random(RANDOM_LEN, prng))
}

#[wasm_bindgen]
pub struct MonotonicContext {
    last_time: f64,
    last_random: String,
}

#[wasm_bindgen]
impl MonotonicContext {
    #[wasm_bindgen(constructor)]
    pub fn new() -> MonotonicContext {
        MonotonicContext {
            last_time: 0.0,
            last_random: String::new(),
        }
    }

    pub fn ulid(&mut self, seed_time: f64, prng: Option<Prng>) -> Result<String, JsError> {
        if seed_time <= self.last_time {
            self.last_random = increment_base32(&self.last_random)?;
            let time = encode_time(self.last_time, TIME_LEN)?;
            return Ok(time + &self.last_random);
        }
        self.last_time = seed_time;
        self.last_random = encode_random(RANDOM_LEN, prng);
        let time = encode_time(seed_time, TIME_LEN)?;
        Ok(time + &self.last_random)
    }
}
