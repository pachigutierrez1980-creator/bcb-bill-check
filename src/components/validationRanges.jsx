// Rangos oficialmente inhabilitados por el Banco Central de Bolivia
// Serie B - Billetes inhabilitados definitivamente
// Fuente: BCB / UNITEL.bo

export const INVALID_RANGES = {
  Bs50: [
    [67250001, 67700000],
    [69050001, 69500000],
    [69500001, 69950000],
    [69950001, 70400000],
    [70400001, 70850000],
    [70850001, 71300000],
    [76310012, 85139995],
    [86400001, 86850000],
    [90900001, 91350000],
    [91800001, 92250000],
  ],
  Bs20: [
    [87280145, 91646549],
    [96650001, 97100000],
    [99800001, 100250000],
    [100250001, 100700000],
    [109250001, 109700000],
    [110600001, 111050000],
    [111050001, 111500000],
    [111950001, 112400000],
    [112400001, 112850000],
    [112850001, 113300000],
    [114200001, 114650000],
    [114650001, 115100000],
    [115100001, 115550000],
    [118700001, 119150000],
    [119150001, 119600000],
    [120500001, 120950000],
  ],
  Bs10: [
    [77100001, 77550000],
    [78000001, 78450000],
    [78900001, 96350000],
    [96350001, 96800000],
    [96800001, 97250000],
    [98150001, 98600000],
    [104900001, 105350000],
    [105350001, 105800000],
    [106700001, 107150000],
    [107600001, 108050000],
    [108050001, 108500000],
    [109400001, 109850000],
  ],
};

/**
 * Detecta la denominación desde texto OCR
 */
export function detectDenomination(text) {
  const upper = text.toUpperCase();
  if (/\b50\s*BOLIVIANOS\b|BS\.?\s*50\b|\b50\s*BS\b/i.test(upper)) return 'Bs50';
  if (/\b20\s*BOLIVIANOS\b|BS\.?\s*20\b|\b20\s*BS\b/i.test(upper)) return 'Bs20';
  if (/\b10\s*BOLIVIANOS\b|BS\.?\s*10\b|\b10\s*BS\b/i.test(upper)) return 'Bs10';
  return null;
}

/**
 * Extrae candidatos de número de serie desde texto OCR
 * Formato: 7-12 dígitos + 1 letra
 */
export function extractSerialCandidates(text) {
  const upper = text.toUpperCase().replace(/\s/g, '');
  const matches = [...upper.matchAll(/(\d{7,12})([A-Z])/g)];
  return matches.map(m => ({ digits: m[1], letter: m[2], full: m[1] + m[2] }));
}

/**
 * Parsea y valida el formato del número de serie
 * Formato esperado: dígitos + 1 letra al final (ej: 67250001B)
 */
export function parseSerialNumber(input) {
  const cleaned = input.trim().toUpperCase().replace(/\s/g, '');
  const match = cleaned.match(/^(\d{6,12})([A-Z])$/);
  if (!match) return null;
  return {
    digits: match[1],
    letter: match[2],
    number: parseInt(match[1], 10),
    full: cleaned,
  };
}

/**
 * Verifica si un número está dentro de algún rango inhabilitado
 * Si se pasa denominación, solo verifica esa; si no, verifica todas.
 */
export function checkInvalidRange(num, denomination = null) {
  const denomsToCheck = denomination ? [denomination] : Object.keys(INVALID_RANGES);
  for (const denom of denomsToCheck) {
    const ranges = INVALID_RANGES[denom];
    if (!ranges) continue;
    for (const [min, max] of ranges) {
      if (num >= min && num <= max) {
        return { isInvalid: true, denomination: denom };
      }
    }
  }
  return { isInvalid: false, denomination: denomination || 'unknown' };
}

/**
 * Función principal de validación
 * Acepta opcionalmente la denominación detectada por cámara
 */
export function validateBillete(serialInput, detectedDenomination = null) {
  const parsed = parseSerialNumber(serialInput);

  if (!parsed) {
    return {
      result: 'error',
      message: 'Formato inválido. Ingrese los dígitos seguidos de una letra (ej: 67250001B)',
      denomination: null,
      serial: null,
    };
  }

  if (parsed.letter !== 'B') {
    return {
      result: 'no_serie_b',
      message: 'Billete HABILITADO (no es Serie B)',
      denomination: detectedDenomination,
      serial: parsed,
    };
  }

  const { isInvalid, denomination } = checkInvalidRange(parsed.number, detectedDenomination);

  if (isInvalid) {
    return {
      result: 'invalid',
      message: 'PROHIBIDO — NO ESTÁ EN CIRCULACIÓN',
      denomination,
      serial: parsed,
    };
  }

  return {
    result: 'valid',
    message: 'HABILITADO',
    denomination: detectedDenomination || 'Serie B',
    serial: parsed,
  };
}