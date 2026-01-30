import { describe, it, expect } from "vitest";
import { decodeJWT, getTokenExpiration } from "./jwt";

/** cria um token JWT fake com payload customizado (sem assinatura real) */
function fakeJwt(payload: Record<string, unknown>) {
  const header = { alg: "HS256", typ: "JWT" };

  const base64url = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

  return `${base64url(header)}.${base64url(payload)}.sig`;
}

describe("utils/jwt", () => {
  describe("decodeJWT", () => {
    it("deve retornar o payload decodificado quando token é válido", () => {
      const token = fakeJwt({ sub: "user", exp: 123 });
      const decoded = decodeJWT(token);

      expect(decoded).toMatchObject({ sub: "user", exp: 123 });
    });

    it("deve retornar null quando token é inválido", () => {
      expect(decodeJWT("abc")).toBeNull();
      expect(decodeJWT("abc.def")).toBeNull();
      expect(decodeJWT("abc.def.ghi")).toBeNull(); // payload não é base64 válido
    });
  });

  describe("getTokenExpiration", () => {
    it("deve retornar exp em ms quando token tem exp", () => {
      const expSeconds = 999999;
      const token = fakeJwt({ exp: expSeconds });

      expect(getTokenExpiration(token)).toBe(expSeconds * 1000);
    });

    it("deve retornar null quando token não tem exp", () => {
      const token = fakeJwt({ sub: "x" });
      expect(getTokenExpiration(token)).toBeNull();
    });

    it("deve retornar null quando token é inválido", () => {
      expect(getTokenExpiration("abc")).toBeNull();
    });
  });
});
