/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
    preset: '@shelf/jest-mongodb',
    globalSetup: './test/global-setup.ts',
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/helpers/errorHandler.ts',
        '!src/helpers/routeHandler.ts',
        '!src/express.ts',
        '!src/notifier.ts',
        '!src/helpers/notify.ts',
        '!src/passport.ts',
        '!src/index.ts',
        '!src/routes/*.ts'
    ],
    transform: tsjPreset.transform
};
