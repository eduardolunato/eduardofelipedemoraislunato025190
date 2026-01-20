export function maskCpf(cpf?: number | string) {
  if (cpf === null || cpf === undefined) return "—";

  let digits = String(cpf).replace(/\D/g, "");

  // se veio como number, pode ter perdido zeros à esquerda → recupera
  digits = digits.padStart(11, "0");

  if (digits.length !== 11) return digits;

  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}


export function maskPhone(phone?: string) {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return digits.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  if (digits.length === 11) {
    return digits.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  return phone;
}

export function onlyDigits(v: string) {
  return (v ?? "").replace(/\D/g, "");
}

export function maskCpfInput(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  // 000.000.000-00
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 9);
  const p4 = digits.slice(9, 11);

  let out = p1;
  if (p2) out += `.${p2}`;
  if (p3) out += `.${p3}`;
  if (p4) out += `-${p4}`;
  return out;
}

export function maskPhoneInput(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  // (99) 9999-9999 ou (99) 99999-9999
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (!ddd) return digits;

  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }

  // 9 dígitos (celular)
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}
