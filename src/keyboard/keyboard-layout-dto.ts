import {z} from 'zod';
/* eslint-disable array-element-newline */
export const keyboardLayoutValueSchema = z.enum([
    // Latin-based layouts
    'us', 'en', 'gb', 'ca', 'au', 'nz', 'ie', 'za',
    'de', 'at', 'ch', 'li',
    'fr', 'be', 'lu', 'mc',
    'es', 'mx', 'ar', 'cl', 'co', 've', 'pe', 'ec', 'uy', 'py', 'bo',
    'it', 'sm', 'va',
    'pt', 'br',
    'nl', 'sr',
    'no', 'dk', 'se', 'fi', 'is',
    'pl', 'cz', 'sk', 'hu', 'si', 'hr', 'ba', 'rs', 'me', 'mk', 'bg',
    'ro', 'md',
    'ee', 'lv', 'lt',
    'mt', 'cy',
    'tr', 'az',

    // Cyrillic-based layouts
    'ru', 'by', 'ua', 'kz', 'kg', 'tj', 'uz', 'tm', 'mn',

    // Greek
    'gr',

    // Arabic-based layouts
    'ar', 'ae', 'bh', 'dz', 'eg', 'iq', 'jo', 'kw', 'lb', 'ly', 'ma', 'om', 'qa', 'sa', 'sy', 'tn', 'ye',
    'fa', 'ir', 'af',
    'ur', 'pk',

    // Hebrew
    'il', 'he',

    // Asian layouts
    'cn', 'zh', 'tw', 'hk', 'mo',
    'jp', 'ja',
    'kr', 'ko',
    'th',
    'vn', 'vi',
    'kh', 'km',
    'lo', 'la',
    'my', 'ms',
    'id',
    'ph', 'tl',
    'sg',
    'bn', 'bd',
    'hi', 'in', 'ta', 'te', 'ml', 'kn', 'gu', 'or', 'pa', 'as', 'ne',
    'si', 'lk',
    'mm', 'my',

    // African layouts
    'am', 'et',
    'sw', 'ke', 'tz',
    'zu', 'xh', 'af',
    'ha', 'ng',
    'fr', 'sn', 'ml', 'bf', 'ne', 'ci', 'gn', 'td', 'cf', 'cm', 'ga', 'cg', 'cd', 'mg', 'dj',

    // Other layouts
    'eo', // Esperanto
    'la', // Latin
    'eu', // Basque
    'ca', // Catalan
    'gl', // Galician
    'cy', // Welsh
    'ga', // Irish
    'gd', // Scottish Gaelic
    'br', // Breton
    'oc', // Occitan
    'co', // Corsican
    'sc', // Sardinian
    'fur', // Friulian
    'rm', // Romansh
    'lb', // Luxembourgish
    'fo', // Faroese
    'kl', // Greenlandic
    'se', // Northern Sami
    'smj', // Lule Sami
    'sma', // Southern Sami
    'smn', // Inari Sami
    'sms', // Skolt Sami
]).describe('Keyboard layout');
/* eslint-enable array-element-newline */
