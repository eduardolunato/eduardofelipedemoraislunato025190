import { describe, expect, it } from "vitest";
import { maskCpfInput, maskPhoneInput } from "./mask";

describe("maskCpfInput", () => {
  it("deve mascarar CPF parcial corretamente", () => {
    expect(maskCpfInput("1")).toBe("1");
    expect(maskCpfInput("1234")).toBe("123.4");
    expect(maskCpfInput("12345678901")).toBe("123.456.789-01");
  });

  it("deve limitar a 11 dígitos", () => {
    expect(maskCpfInput("123456789012345")).toBe("123.456.789-01");
  });
});

describe("maskPhoneInput", () => {
  it("deve mascarar telefone progressivo", () => {
    expect(maskPhoneInput("6")).toBe("(6) ");
    expect(maskPhoneInput("651")).toBe("(65) 1");
    expect(maskPhoneInput("6599999")).toBe("(65) 9999-9");
    expect(maskPhoneInput("65999999999")).toBe("(65) 99999-9999");
  });

  it("deve limitar a 11 dígitos", () => {
    expect(maskPhoneInput("659999999999999")).toBe("(65) 99999-9999");
  });
});
