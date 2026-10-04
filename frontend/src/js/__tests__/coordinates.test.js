import { parseCoordinates } from '../parseCoordinates';

describe('Manual Coordinate Validation Suite - Timeline', () => {
    test('This must process valid coordinates separated by a space', () => {
        const result = parseCoordinates('51.50851, -0.12572');
        expect(result).toEqual({ latitude: 51.50851, longitude: -0.12572 });
    });

    test('This must process valid coordinates with no intervening spaces', () => {
        const result = parseCoordinates('51.50851,-0.12572');
        expect(result).toEqual({ latitude: 51.50851, longitude: -0.12572 });
    });

    test('This must process valid coordinates wrapped in square brackets', () => {
        const result = parseCoordinates('[51.50851, -0.12572]');
        expect(result).toEqual({ latitude: 51.50851, longitude: -0.12572 });
    });

    test('This must throw a controlled exception if the format is broken', () => {
        expect(() => {
            parseCoordinates('51.50851; -0.12572'); // Uses an invalid semicolon
        }).toThrow('Некорректный формат координат!');
    });

    test('This must throw an exception if the input string is empty', () => {
        expect(() => {
            parseCoordinates('');
        }).toThrow('Input is empty');
    });

    test('This must throw an exception if the values ​​fall outside the geographic ranges', () => {
        expect(() => {
            parseCoordinates('95.00000, 190.00000');
        }).toThrow('Координаты выходят за пределы географических диапазонов');
    });
});
