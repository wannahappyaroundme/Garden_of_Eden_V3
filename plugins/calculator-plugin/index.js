/**
 * Calculator Plugin for Garden of Eden V3
 *
 * Provides advanced calculator functions including:
 * - Basic arithmetic
 * - Scientific functions (sin, cos, tan, log, etc.)
 * - Unit conversions
 * - Expression evaluation
 */

/**
 * Evaluate a mathematical expression
 * @param {string} expression - Mathematical expression (e.g., "2 + 2 * 3")
 * @returns {Object} Result object
 */
function calculate(expression) {
  try {
    // Remove whitespace
    const cleaned = expression.replace(/\s+/g, '');

    // Security: Only allow safe mathematical characters
    if (!/^[0-9+\-*/.()^%√πe\s]+$/.test(cleaned)) {
      throw new Error("표현식에 허용되지 않는 문자가 포함되어 있습니다");
    }

    // Replace special symbols
    let processedExpr = cleaned
      .replace(/π/g, Math.PI.toString())
      .replace(/e(?![0-9])/g, Math.E.toString())
      .replace(/√(\d+)/g, 'Math.sqrt($1)')
      .replace(/\^/g, '**');

    // Evaluate (using Function instead of eval for safety)
    const result = new Function(`return ${processedExpr}`)();

    return {
      success: true,
      expression: expression,
      result: result,
      formatted: formatNumber(result)
    };
  } catch (error) {
    return {
      success: false,
      expression: expression,
      error: error.message
    };
  }
}

/**
 * Scientific calculator functions
 */
const scientific = {
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  asin: (x) => Math.asin(x),
  acos: (x) => Math.acos(x),
  atan: (x) => Math.atan(x),
  log: (x) => Math.log10(x),
  ln: (x) => Math.log(x),
  sqrt: (x) => Math.sqrt(x),
  pow: (x, y) => Math.pow(x, y),
  abs: (x) => Math.abs(x),
  ceil: (x) => Math.ceil(x),
  floor: (x) => Math.floor(x),
  round: (x) => Math.round(x)
};

/**
 * Unit conversion functions
 */
const unitConversions = {
  // Temperature
  celsiusToFahrenheit: (c) => (c * 9/5) + 32,
  fahrenheitToCelsius: (f) => (f - 32) * 5/9,
  celsiusToKelvin: (c) => c + 273.15,
  kelvinToCelsius: (k) => k - 273.15,

  // Length
  metersToFeet: (m) => m * 3.28084,
  feetToMeters: (ft) => ft / 3.28084,
  metersToMiles: (m) => m * 0.000621371,
  milesToMeters: (mi) => mi / 0.000621371,
  kilometersToMiles: (km) => km * 0.621371,
  milesToKilometers: (mi) => mi / 0.621371,

  // Weight
  kilogramsToPounds: (kg) => kg * 2.20462,
  poundsToKilograms: (lb) => lb / 2.20462,

  // Volume
  litersToGallons: (l) => l * 0.264172,
  gallonsToLiters: (gal) => gal / 0.264172,

  // Speed
  mpsToKmh: (mps) => mps * 3.6,
  kmhToMps: (kmh) => kmh / 3.6,
  kmhToMph: (kmh) => kmh * 0.621371,
  mphToKmh: (mph) => mph / 0.621371
};

/**
 * Convert units
 * @param {number} value - Value to convert
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {Object} Conversion result
 */
function convertUnits(value, fromUnit, toUnit) {
  const conversionKey = `${fromUnit}To${toUnit.charAt(0).toUpperCase() + toUnit.slice(1)}`;

  if (!unitConversions[conversionKey]) {
    return {
      success: false,
      error: `변환을 지원하지 않습니다: ${fromUnit} → ${toUnit}`
    };
  }

  const result = unitConversions[conversionKey](value);

  return {
    success: true,
    value: value,
    fromUnit: fromUnit,
    toUnit: toUnit,
    result: result,
    formatted: `${formatNumber(value)} ${fromUnit} = ${formatNumber(result)} ${toUnit}`
  };
}

/**
 * Format number for display
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
  if (isNaN(num)) return 'NaN';
  if (!isFinite(num)) return num > 0 ? '∞' : '-∞';

  // Round to 10 decimal places to avoid floating point errors
  const rounded = Math.round(num * 1e10) / 1e10;

  // Use scientific notation for very large or very small numbers
  if (Math.abs(rounded) > 1e10 || (Math.abs(rounded) < 1e-10 && rounded !== 0)) {
    return rounded.toExponential(6);
  }

  return rounded.toString();
}

/**
 * Parse natural language math queries
 * @param {string} query - Natural language query (e.g., "what is 10% of 500?")
 * @returns {Object} Calculation result
 */
function parseNaturalLanguage(query) {
  const lowerQuery = query.toLowerCase();

  // Pattern: "X% of Y" or "X percent of Y"
  const percentMatch = lowerQuery.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(\d+(?:\.\d+)?)/);
  if (percentMatch) {
    const percent = parseFloat(percentMatch[1]);
    const value = parseFloat(percentMatch[2]);
    const result = (percent / 100) * value;
    return {
      success: true,
      query: query,
      interpretation: `${percent}% of ${value}`,
      result: result,
      formatted: formatNumber(result)
    };
  }

  // Pattern: "square root of X"
  const sqrtMatch = lowerQuery.match(/square\s+root\s+of\s+(\d+(?:\.\d+)?)/);
  if (sqrtMatch) {
    const value = parseFloat(sqrtMatch[1]);
    const result = Math.sqrt(value);
    return {
      success: true,
      query: query,
      interpretation: `√${value}`,
      result: result,
      formatted: formatNumber(result)
    };
  }

  // Pattern: "X to the power of Y"
  const powMatch = lowerQuery.match(/(\d+(?:\.\d+)?)\s+to\s+the\s+power\s+of\s+(\d+(?:\.\d+)?)/);
  if (powMatch) {
    const base = parseFloat(powMatch[1]);
    const exponent = parseFloat(powMatch[2]);
    const result = Math.pow(base, exponent);
    return {
      success: true,
      query: query,
      interpretation: `${base}^${exponent}`,
      result: result,
      formatted: formatNumber(result)
    };
  }

  // Fallback: Try to evaluate as expression
  return calculate(query);
}

// Export plugin functions
module.exports = {
  calculate,
  scientific,
  convertUnits,
  parseNaturalLanguage,
  formatNumber,

  meta: {
    name: "Calculator Plugin",
    version: "1.0.0",
    description: "Advanced calculator with scientific functions and unit conversions"
  }
};
