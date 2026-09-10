import { faker } from '@faker-js/faker'

import type { Column } from '../../components/table/cell/utils'
import type { GeneratorMap } from './types'
import {
  CUSTOM_GENERATOR,
  ENUM_GENERATOR,
  NULL_GENERATOR,
  REFERENCE_GENERATOR,
  SKIP_GENERATOR,
} from './types'

const typeParamsRegex = /\(.*\)|\[\]$/gu

export const columnTypeName = (column: Column) =>
  (column.typeLabel ?? column.type ?? '')
    .toLowerCase()
    .replace(typeParamsRegex, '')
    .trim()

// Big enough to look like data, small enough for any integer type wider than a byte
const DEFAULT_MAX = 10_000
// One-byte integers: ClickHouse Int8/UInt8, MySQL and MSSQL tinyint. Postgres' int8 is a bigint,
// but only its array label ("int8[]") reaches here and 127 is still a valid bigint.
const ONE_BYTE_INT_MAX: Record<string, number> = {
  int8: 127,
  tinyint: 127,
  uint8: 255,
}

const randomInt = (column: Column) =>
  faker.number.int({
    max: ONE_BYTE_INT_MAX[columnTypeName(column)] ?? DEFAULT_MAX,
  })

// ClickHouse does not report numeric precision, so Decimal(10, 2) is parsed off the label
const decimalParamsRegex = /\((?<precision>\d+)\s*,\s*(?<scale>\d+)\)/u

const floatBounds = (column: Column) => {
  const parsed = column.typeLabel?.match(decimalParamsRegex)?.groups
  const scale = column.scale ?? (parsed ? Number(parsed.scale) : 2)
  const precision =
    column.precision ?? (parsed ? Number(parsed.precision) : undefined)
  const max =
    precision === undefined
      ? DEFAULT_MAX
      : Math.min(DEFAULT_MAX, 10 ** (precision - scale))

  return { fractionDigits: scale, max: max - 10 ** -scale, min: 0 }
}

const randomFloat = (column: Column) => faker.number.float(floatBounds(column))

const randomBits = (column: Column) =>
  faker.string.binary({ length: column.maxLength ?? 8, prefix: '' })

const jsonScalar = () =>
  faker.helpers.arrayElement([
    () => faker.lorem.word(),
    () => faker.number.int({ max: 100_000, min: -100_000 }),
    () =>
      faker.number.float({ fractionDigits: 2, max: 100_000, min: -100_000 }),
    () => faker.datatype.boolean(),
    () => faker.date.recent().toISOString(),
    () => null,
  ])()

const JSON_MAX_DEPTH = 2

const jsonKeys = () =>
  faker.helpers.uniqueArray(
    () => faker.string.alpha({ casing: 'lower', length: { max: 8, min: 3 } }),
    faker.number.int({ max: 6, min: 1 })
  )

const jsonValue = (depth: number): unknown => {
  const kind =
    depth >= JSON_MAX_DEPTH
      ? 'scalar'
      : faker.helpers.arrayElement(['scalar', 'array', 'object'] as const)

  if (kind === 'scalar') {
    return jsonScalar()
  }
  if (kind === 'array') {
    return faker.helpers.multiple(() => jsonValue(depth + 1), {
      count: { max: 5, min: 1 },
    })
  }
  return Object.fromEntries(
    jsonKeys().map((key) => [key, jsonValue(depth + 1)])
  )
}

const jsonObject = () =>
  Object.fromEntries(jsonKeys().map((key) => [key, jsonValue(1)]))

export const BASE_GENERATORS = {
  [CUSTOM_GENERATOR]: {
    category: 'Special',
    generate: () => null,
    label: 'SQL expression',
  },
  [ENUM_GENERATOR]: {
    category: 'Special',
    generate: () => null,
    label: 'Enum value',
  },
  [NULL_GENERATOR]: {
    category: 'Special',
    generate: () => null,
    label: 'NULL',
  },
  [REFERENCE_GENERATOR]: {
    category: 'Special',
    generate: () => null,
    label: 'Existing row',
  },
  [SKIP_GENERATOR]: {
    category: 'Special',
    generate: () => null,
    label: 'Database default',
  },
  'airline.airline': {
    category: 'Other',
    generate: () => faker.airline.airline().name,
    label: 'Airline',
  },
  'airline.flightNumber': {
    category: 'Other',
    generate: () => faker.airline.flightNumber(),
    label: 'Flight Number',
  },
  'animal.type': {
    category: 'Other',
    generate: () => faker.animal.type(),
    label: 'Animal Type',
  },
  'color.hex': {
    category: 'Other',
    generate: () => faker.color.rgb({ format: 'hex' }),
    label: 'Color Hex',
  },
  'color.human': {
    category: 'Other',
    generate: () => faker.color.human(),
    label: 'Color Name',
  },
  'color.rgb': {
    category: 'Other',
    generate: () => faker.color.rgb(),
    label: 'Color RGB',
  },
  'commerce.department': {
    category: 'Commerce',
    generate: () => faker.commerce.department(),
    label: 'Department',
  },
  'commerce.isbn': {
    category: 'Commerce',
    generate: () => faker.commerce.isbn(),
    label: 'ISBN',
  },
  'commerce.price': {
    category: 'Commerce',
    generate: () => Number(faker.commerce.price()),
    label: 'Price',
  },
  'commerce.productDescription': {
    category: 'Commerce',
    generate: () => faker.commerce.productDescription(),
    label: 'Product Description',
  },
  'commerce.productName': {
    category: 'Commerce',
    generate: () => faker.commerce.productName(),
    label: 'Product Name',
  },
  'company.buzzPhrase': {
    category: 'Commerce',
    generate: () => faker.company.buzzPhrase(),
    label: 'Buzz Phrase',
  },
  'company.catchPhrase': {
    category: 'Commerce',
    generate: () => faker.company.catchPhrase(),
    label: 'Catch Phrase',
  },
  'company.name': {
    category: 'Commerce',
    generate: () => faker.company.name(),
    label: 'Company Name',
  },
  'datatype.boolean': {
    category: 'Boolean',
    generate: () => faker.datatype.boolean(),
    label: 'Boolean',
  },
  'date.birthdate': {
    category: 'Date',
    generate: () => faker.date.birthdate(),
    label: 'Birthdate',
  },
  'date.future': {
    category: 'Date',
    generate: () => faker.date.future(),
    label: 'Future Date',
  },
  'date.month': {
    category: 'Date',
    generate: () => faker.date.month(),
    label: 'Month Name',
  },
  'date.past': {
    category: 'Date',
    generate: () => faker.date.past(),
    label: 'Past Date',
  },
  'date.recent': {
    category: 'Date',
    generate: () => faker.date.recent(),
    label: 'Recent Date',
  },
  'date.soon': {
    category: 'Date',
    generate: () => faker.date.soon(),
    label: 'Soon Date',
  },
  'date.time': {
    category: 'Date',
    generate: () => faker.date.recent().toISOString().slice(11, 19),
    label: 'Time',
  },
  'date.weekday': {
    category: 'Date',
    generate: () => faker.date.weekday(),
    label: 'Weekday',
  },
  'finance.accountNumber': {
    category: 'Finance',
    generate: () => faker.finance.accountNumber(),
    label: 'Account Number',
  },
  'finance.amount': {
    category: 'Finance',
    generate: () => Number(faker.finance.amount()),
    label: 'Amount',
  },
  'finance.bic': {
    category: 'Finance',
    generate: () => faker.finance.bic(),
    label: 'BIC/SWIFT',
  },
  'finance.bitcoinAddress': {
    category: 'Finance',
    generate: () => faker.finance.bitcoinAddress(),
    label: 'Bitcoin Address',
  },
  'finance.creditCardCVV': {
    category: 'Finance',
    generate: () => faker.finance.creditCardCVV(),
    label: 'Credit Card CVV',
  },
  'finance.creditCardNumber': {
    category: 'Finance',
    generate: () => faker.finance.creditCardNumber(),
    label: 'Credit Card Number',
  },
  'finance.currencyCode': {
    category: 'Finance',
    generate: () => faker.finance.currencyCode(),
    label: 'Currency Code',
  },
  'finance.currencyName': {
    category: 'Finance',
    generate: () => faker.finance.currencyName(),
    label: 'Currency Name',
  },
  'finance.ethereumAddress': {
    category: 'Finance',
    generate: () => faker.finance.ethereumAddress(),
    label: 'Ethereum Address',
  },
  'finance.iban': {
    category: 'Finance',
    generate: () => faker.finance.iban(),
    label: 'IBAN',
  },
  'finance.transactionType': {
    category: 'Finance',
    generate: () => faker.finance.transactionType(),
    label: 'Transaction Type',
  },
  'food.dish': {
    category: 'Other',
    generate: () => faker.food.dish(),
    label: 'Dish',
  },
  'food.ingredient': {
    category: 'Other',
    generate: () => faker.food.ingredient(),
    label: 'Ingredient',
  },
  'git.commitSha': {
    category: 'System',
    generate: () => faker.git.commitSha(),
    label: 'Git Commit SHA',
  },
  'hacker.phrase': {
    category: 'Other',
    generate: () => faker.hacker.phrase(),
    label: 'Hacker Phrase',
  },
  'image.avatar': {
    category: 'Internet',
    generate: () => faker.image.avatar(),
    label: 'Avatar URL',
  },
  'image.url': {
    category: 'Internet',
    generate: () => faker.image.url(),
    label: 'Image URL',
  },
  'internet.displayName': {
    category: 'Internet',
    generate: () => faker.internet.displayName(),
    label: 'Display Name',
  },
  'internet.domainName': {
    category: 'Internet',
    generate: () => faker.internet.domainName(),
    label: 'Domain Name',
  },
  'internet.email': {
    category: 'Internet',
    generate: () => faker.internet.email(),
    label: 'Email',
  },
  'internet.emoji': {
    category: 'Internet',
    generate: () => faker.internet.emoji(),
    label: 'Emoji',
  },
  'internet.httpMethod': {
    category: 'Internet',
    generate: () => faker.internet.httpMethod(),
    label: 'HTTP Method',
  },
  'internet.httpStatusCode': {
    category: 'Internet',
    generate: () => faker.internet.httpStatusCode(),
    label: 'HTTP Status Code',
  },
  'internet.ip': {
    category: 'Internet',
    generate: () => faker.internet.ip(),
    label: 'IPv4 Address',
  },
  'internet.ipv6': {
    category: 'Internet',
    generate: () => faker.internet.ipv6(),
    label: 'IPv6 Address',
  },
  'internet.mac': {
    category: 'Internet',
    generate: () => faker.internet.mac(),
    label: 'MAC Address',
  },
  'internet.password': {
    category: 'Internet',
    generate: () => faker.internet.password(),
    label: 'Password',
  },
  'internet.port': {
    category: 'Internet',
    generate: () => faker.internet.port(),
    label: 'Port',
  },
  'internet.url': {
    category: 'Internet',
    generate: () => faker.internet.url(),
    label: 'URL',
  },
  'internet.userAgent': {
    category: 'Internet',
    generate: () => faker.internet.userAgent(),
    label: 'User Agent',
  },
  'internet.username': {
    category: 'Internet',
    generate: () => faker.internet.username(),
    label: 'Username',
  },
  'json.array': {
    category: 'Other',
    generate: () =>
      faker.helpers.multiple(() => jsonValue(1), { count: { max: 5, min: 1 } }),
    label: 'JSON Array',
  },
  'json.object': {
    category: 'Other',
    generate: () => jsonObject(),
    label: 'JSON Object',
  },
  'location.buildingNumber': {
    category: 'Location',
    generate: () => faker.location.buildingNumber(),
    label: 'Building Number',
  },
  'location.city': {
    category: 'Location',
    generate: () => faker.location.city(),
    label: 'City',
  },
  'location.country': {
    category: 'Location',
    generate: () => faker.location.country(),
    label: 'Country',
  },
  'location.countryCode': {
    category: 'Location',
    generate: () => faker.location.countryCode(),
    label: 'Country Code',
  },
  'location.county': {
    category: 'Location',
    generate: () => faker.location.county(),
    label: 'County',
  },
  'location.latitude': {
    category: 'Location',
    generate: () => faker.location.latitude(),
    label: 'Latitude',
  },
  'location.longitude': {
    category: 'Location',
    generate: () => faker.location.longitude(),
    label: 'Longitude',
  },
  'location.state': {
    category: 'Location',
    generate: () => faker.location.state(),
    label: 'State',
  },
  'location.streetAddress': {
    category: 'Location',
    generate: () => faker.location.streetAddress(),
    label: 'Street Address',
  },
  'location.timeZone': {
    category: 'Location',
    generate: () => faker.location.timeZone(),
    label: 'Time Zone',
  },
  'location.zipCode': {
    category: 'Location',
    generate: () => faker.location.zipCode(),
    label: 'Zip Code',
  },
  'lorem.lines': {
    category: 'Text',
    generate: () => faker.lorem.lines(),
    label: 'Lines',
  },
  'lorem.paragraph': {
    category: 'Text',
    generate: () => faker.lorem.paragraph(),
    label: 'Paragraph',
  },
  'lorem.sentence': {
    category: 'Text',
    generate: () => faker.lorem.sentence(),
    label: 'Sentence',
  },
  'lorem.slug': {
    category: 'Text',
    generate: () => faker.lorem.slug(),
    label: 'Slug',
  },
  'lorem.text': {
    category: 'Text',
    generate: () => faker.lorem.text(),
    label: 'Text Block',
  },
  'lorem.word': {
    category: 'Text',
    generate: () => faker.lorem.word(),
    label: 'Word',
  },
  'music.genre': {
    category: 'Other',
    generate: () => faker.music.genre(),
    label: 'Music Genre',
  },
  'number.bigInt': {
    category: 'Number',
    generate: () =>
      String(faker.number.bigInt({ max: Number.MAX_SAFE_INTEGER })),
    label: 'Big Integer',
  },
  'number.binary': {
    category: 'Number',
    generate: randomBits,
    label: 'Bits',
  },
  'number.float': {
    category: 'Number',
    generate: randomFloat,
    label: 'Decimal',
  },
  'number.int': {
    category: 'Number',
    generate: randomInt,
    label: 'Integer',
  },
  'number.percentage': {
    category: 'Number',
    generate: () => faker.number.float({ fractionDigits: 2, max: 100, min: 0 }),
    label: 'Percentage',
  },
  'person.bio': {
    category: 'Person',
    generate: () => faker.person.bio(),
    label: 'Bio',
  },
  'person.firstName': {
    category: 'Person',
    generate: () => faker.person.firstName(),
    label: 'First Name',
  },
  'person.fullName': {
    category: 'Person',
    generate: () => faker.person.fullName(),
    label: 'Full Name',
  },
  'person.gender': {
    category: 'Person',
    generate: () => faker.person.gender(),
    label: 'Gender',
  },
  'person.jobTitle': {
    category: 'Person',
    generate: () => faker.person.jobTitle(),
    label: 'Job Title',
  },
  'person.jobType': {
    category: 'Person',
    generate: () => faker.person.jobType(),
    label: 'Job Type',
  },
  'person.lastName': {
    category: 'Person',
    generate: () => faker.person.lastName(),
    label: 'Last Name',
  },
  'person.sex': {
    category: 'Person',
    generate: () => faker.person.sex(),
    label: 'Sex',
  },
  'phone.imei': {
    category: 'Other',
    generate: () => faker.phone.imei(),
    label: 'IMEI',
  },
  'phone.number': {
    category: 'Other',
    generate: () => faker.phone.number(),
    label: 'Phone Number',
  },
  'science.chemicalElement': {
    category: 'Other',
    generate: () => faker.science.chemicalElement().name,
    label: 'Chemical Element',
  },
  'science.unit': {
    category: 'Other',
    generate: () => faker.science.unit().name,
    label: 'Unit of Measurement',
  },
  'string.alpha': {
    category: 'Text',
    generate: () => faker.string.alpha(10),
    label: 'Alpha String',
  },
  'string.alphanumeric': {
    category: 'Text',
    generate: () => faker.string.alphanumeric(10),
    label: 'Alphanumeric',
  },
  'string.hexadecimal': {
    category: 'Text',
    generate: () => faker.string.hexadecimal({ length: 16, prefix: '' }),
    label: 'Hex String',
  },
  'string.nanoid': {
    category: 'ID',
    generate: () => faker.string.nanoid(),
    label: 'Nano ID',
  },
  'string.ulid': {
    category: 'ID',
    generate: () => faker.string.ulid(),
    label: 'ULID',
  },
  'string.uuidV4': {
    category: 'ID',
    generate: () => faker.string.uuid({ version: 4 }),
    label: 'UUID v4',
  },
  'string.uuidV7': {
    category: 'ID',
    generate: () => faker.string.uuid({ version: 7 }),
    label: 'UUID v7',
  },
  'system.cron': {
    category: 'System',
    generate: () => faker.system.cron(),
    label: 'Cron Expression',
  },
  'system.fileExt': {
    category: 'System',
    generate: () => faker.system.fileExt(),
    label: 'File Extension',
  },
  'system.fileName': {
    category: 'System',
    generate: () => faker.system.fileName(),
    label: 'File Name',
  },
  'system.filePath': {
    category: 'System',
    generate: () => faker.system.filePath(),
    label: 'File Path',
  },
  'system.mimeType': {
    category: 'System',
    generate: () => faker.system.mimeType(),
    label: 'MIME Type',
  },
  'system.semver': {
    category: 'System',
    generate: () => faker.system.semver(),
    label: 'Semver Version',
  },
  'vehicle.manufacturer': {
    category: 'Other',
    generate: () => faker.vehicle.manufacturer(),
    label: 'Vehicle Manufacturer',
  },
  'vehicle.vehicle': {
    category: 'Other',
    generate: () => faker.vehicle.vehicle(),
    label: 'Vehicle',
  },
  'vehicle.vrm': {
    category: 'Other',
    generate: () => faker.vehicle.vrm(),
    label: 'License Plate',
  },
} satisfies GeneratorMap
