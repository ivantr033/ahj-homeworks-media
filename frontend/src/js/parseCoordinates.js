/**
 * Функция для обработки и валидации координат, введенных вручную.
 * Поддерживает форматы:
 * 1. 51.50851, -0.12572
 * 2. 51.50851,-0.12572
 * 3. [51.50851, -0.12572]
 * 
 * @param {string} input - Строка ввода пользователя
 * @returns {Object} - { latitude, longitude }
 */
export function parseCoordinates(input) {
    if (!input) {
        throw new Error('Input is empty');
    }

    let cleanInput = input.trim();
    if (cleanInput.startsWith('[') && cleanInput.endsWith(']')) {
        cleanInput = cleanInput.substring(1, cleanInput.length - 1).trim();
    }

    const coordsRegex = /^([-+]?[0-9]*\.?[0-9]+),\s*([-+]?[0-9]*\.?[0-9]+)$/;
    const match = cleanInput.match(coordsRegex);

    if (!match) {
        throw new Error('Некорректный формат координат! Шаблон: широта, долгота');
    }

    const latitude = parseFloat(match[1]);
    const longitude = parseFloat(match[2]);

    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        throw new Error('Координаты выходят за пределы географических диапазонов');
    }

    return { latitude, longitude };
}
