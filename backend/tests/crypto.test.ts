import { test, describe } from "node:test";
import assert from "node:assert";
import crypto from "crypto";
import { CryptoHelper } from "../dist/utils/cryptoHelper.js";

describe("Aegis-Cyber Cryptographic Core Engine", () => {
  test("AES-256-GCM symmetric encryption and authenticated decryption", () => {
    const rawData = Buffer.from("CLASSIFIED_ZERO_TRUST_PAYLOAD_TEST_2026", "utf8");
    const key = crypto.randomBytes(32);

    const { encrypted, iv, authTag } = CryptoHelper.encryptAES(rawData, key);
    assert.strictEqual(iv.length, 12, "GCM IV must be 12 bytes");
    assert.ok(encrypted.length > 0, "Ciphertext should not be empty");
    assert.strictEqual(authTag.length, 16, "Auth tag must be 16 bytes");

    const decrypted = CryptoHelper.decryptAES(encrypted, key, iv, authTag);
    assert.strictEqual(decrypted.toString("utf8"), rawData.toString("utf8"));
  });

  test("RSA-4096 asymmetric key generation, OAEP key wrapping and unwrapping", () => {
    const { publicKey, privateKey } = CryptoHelper.generateRSAKeyPair();
    assert.ok(publicKey.includes("BEGIN PUBLIC KEY"), "Valid public key PEM");
    assert.ok(privateKey.includes("BEGIN PRIVATE KEY"), "Valid private key PEM");

    const sessionKey = crypto.randomBytes(32);
    const wrappedKeyBase64 = CryptoHelper.encryptRSA(sessionKey, publicKey);
    assert.ok(wrappedKeyBase64.length > 0, "Wrapped key generated");

    const unwrappedKey = CryptoHelper.decryptRSA(wrappedKeyBase64, privateKey);
    assert.deepStrictEqual(unwrappedKey, sessionKey, "Unwrapped session key matches original");
  });

  test("SHA-256 content hashing and digital signature verification", () => {
    const data = Buffer.from("Aegis-Cyber Integrity Validation Block", "utf8");
    const hash = CryptoHelper.calculateSHA256(data);
    assert.strictEqual(hash.length, 64, "SHA-256 must produce 64 hex characters");

    const { publicKey, privateKey } = CryptoHelper.generateRSAKeyPair();
    const signature = CryptoHelper.signHash(hash, privateKey);
    assert.ok(signature.length > 0, "Digital signature generated");

    const isValid = CryptoHelper.verifySignature(hash, signature, publicKey);
    assert.strictEqual(isValid, true, "Signature must verify successfully");
  });
});
