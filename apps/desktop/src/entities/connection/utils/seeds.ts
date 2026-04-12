import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Column } from '../components/table/cell'
import { faker } from '@faker-js/faker'
import { toPgArrayLiteral } from '../transformers/list/postgres'

export const SKIP_GENERATOR = 'skip-generator'
export const REFERENCE_GENERATOR = 'reference-generator'
export const ENUM_GENERATOR = 'enum-generator'

function generateRandomJsonValue(depth = 0): unknown {
  const scalarGenerators = [
    () => faker.lorem.word(),
    () => faker.number.int({ min: -100000, max: 100000 }),
    () => faker.number.float({ min: -100000, max: 100000, fractionDigits: 2 }),
    () => faker.datatype.boolean(),
    () => faker.date.recent().toISOString(),
    () => null,
  ] as const

  if (depth >= 2) {
    return faker.helpers.arrayElement(scalarGenerators)()
  }

  const valueType = faker.helpers.arrayElement(['scalar', 'array', 'object'] as const)
  if (valueType === 'scalar') {
    return faker.helpers.arrayElement(scalarGenerators)()
  }
  if (valueType === 'array') {
    const itemCount = faker.number.int({ min: 1, max: 5 })
    return faker.helpers.multiple(() => generateRandomJsonValue(depth + 1), { count: itemCount })
  }

  return generateRandomJsonObject(depth + 1)
}

function generateRandomJsonObject(depth = 0): Record<string, unknown> {
  const keyCount = faker.number.int({ min: 1, max: 6 })
  const object: Record<string, unknown> = {}

  for (let i = 0; i < keyCount; i++) {
    let key = faker.string.alphanumeric(faker.number.int({ min: 3, max: 12 })).toLowerCase()
    while (key in object) {
      key = faker.string.alphanumeric(faker.number.int({ min: 3, max: 12 })).toLowerCase()
    }
    object[key] = generateRandomJsonValue(depth)
  }

  return object
}

export const GENERATORS = {
  [SKIP_GENERATOR]: { label: 'Generate default', category: 'Special', generate: () => undefined },
  [REFERENCE_GENERATOR]: { label: 'Random reference value', category: 'Special', generate: () => undefined },
  [ENUM_GENERATOR]: { label: 'Random enum value', category: 'Special', generate: () => undefined },
  'null': { label: 'NULL', category: 'Special', generate: () => null },

  'lorem.word': { label: 'Word', category: 'Text', generate: () => faker.lorem.word() },
  'lorem.sentence': { label: 'Sentence', category: 'Text', generate: () => faker.lorem.sentence() },
  'lorem.paragraph': { label: 'Paragraph', category: 'Text', generate: () => faker.lorem.paragraph() },
  'lorem.lines': { label: 'Lines', category: 'Text', generate: () => faker.lorem.lines() },
  'lorem.slug': { label: 'Slug', category: 'Text', generate: () => faker.lorem.slug() },
  'lorem.text': { label: 'Text Block', category: 'Text', generate: () => faker.lorem.text() },
  'string.alpha': { label: 'Alpha String', category: 'Text', generate: () => faker.string.alpha(10) },
  'string.alphanumeric': { label: 'Alphanumeric', category: 'Text', generate: () => faker.string.alphanumeric(10) },
  'string.hexadecimal': { label: 'Hex String', category: 'Text', generate: () => faker.string.hexadecimal({ length: 16 }) },

  'person.firstName': { label: 'First Name', category: 'Person', generate: () => faker.person.firstName() },
  'person.lastName': { label: 'Last Name', category: 'Person', generate: () => faker.person.lastName() },
  'person.fullName': { label: 'Full Name', category: 'Person', generate: () => faker.person.fullName() },
  'person.jobTitle': { label: 'Job Title', category: 'Person', generate: () => faker.person.jobTitle() },
  'person.jobType': { label: 'Job Type', category: 'Person', generate: () => faker.person.jobType() },
  'person.gender': { label: 'Gender', category: 'Person', generate: () => faker.person.gender() },
  'person.sex': { label: 'Sex', category: 'Person', generate: () => faker.person.sex() },
  'person.bio': { label: 'Bio', category: 'Person', generate: () => faker.person.bio() },

  'internet.email': { label: 'Email', category: 'Internet', generate: () => faker.internet.email() },
  'internet.url': { label: 'URL', category: 'Internet', generate: () => faker.internet.url() },
  'internet.username': { label: 'Username', category: 'Internet', generate: () => faker.internet.username() },
  'internet.displayName': { label: 'Display Name', category: 'Internet', generate: () => faker.internet.displayName() },
  'internet.password': { label: 'Password', category: 'Internet', generate: () => faker.internet.password() },
  'internet.ip': { label: 'IPv4 Address', category: 'Internet', generate: () => faker.internet.ip() },
  'internet.ipv6': { label: 'IPv6 Address', category: 'Internet', generate: () => faker.internet.ipv6() },
  'internet.mac': { label: 'MAC Address', category: 'Internet', generate: () => faker.internet.mac() },
  'internet.userAgent': { label: 'User Agent', category: 'Internet', generate: () => faker.internet.userAgent() },
  'internet.domainName': { label: 'Domain Name', category: 'Internet', generate: () => faker.internet.domainName() },
  'internet.httpMethod': { label: 'HTTP Method', category: 'Internet', generate: () => faker.internet.httpMethod() },
  'internet.httpStatusCode': { label: 'HTTP Status Code', category: 'Internet', generate: () => faker.internet.httpStatusCode() },
  'internet.port': { label: 'Port', category: 'Internet', generate: () => faker.internet.port() },
  'internet.emoji': { label: 'Emoji', category: 'Internet', generate: () => faker.internet.emoji() },
  'image.url': { label: 'Image URL', category: 'Internet', generate: () => faker.image.url() },
  'image.avatar': { label: 'Avatar URL', category: 'Internet', generate: () => faker.image.avatar() },

  'number.int': { label: 'Integer', category: 'Number', generate: () => faker.number.int({ max: 10000 }) },
  'number.float': { label: 'Float', category: 'Number', generate: () => faker.number.float({ max: 10000, fractionDigits: 2 }) },
  'number.bigInt': { label: 'Big Integer', category: 'Number', generate: () => String(faker.number.bigInt({ max: 9007199254740991n })) },
  'number.binary': { label: 'Binary', category: 'Number', generate: () => faker.number.binary({ max: 255 }).replace('0b', '') },
  'number.octal': { label: 'Octal', category: 'Number', generate: () => faker.number.octal({ max: 255 }) },
  'number.percentage': { label: 'Percentage', category: 'Number', generate: () => faker.number.float({ min: 0, max: 100, fractionDigits: 2 }) },

  'date.recent': { label: 'Recent Date', category: 'Date', generate: () => faker.date.recent().toISOString() },
  'date.past': { label: 'Past Date', category: 'Date', generate: () => faker.date.past().toISOString() },
  'date.future': { label: 'Future Date', category: 'Date', generate: () => faker.date.future().toISOString() },
  'date.soon': { label: 'Soon Date', category: 'Date', generate: () => faker.date.soon().toISOString() },
  'date.birthdate': { label: 'Birthdate', category: 'Date', generate: () => faker.date.birthdate().toISOString() },
  'date.month': { label: 'Month Name', category: 'Date', generate: () => faker.date.month() },
  'date.weekday': { label: 'Weekday', category: 'Date', generate: () => faker.date.weekday() },
  'date.time': { label: 'Time', category: 'Date', generate: () => faker.date.recent().toISOString().slice(11, 19) },
  'date.timeZone': { label: 'Time Zone', category: 'Date', generate: () => faker.location.timeZone() },

  'datatype.boolean': { label: 'Boolean', category: 'Boolean', generate: () => faker.datatype.boolean() },

  'string.uuidV4': { label: 'UUID v4', category: 'ID', generate: () => faker.string.uuid({ version: 4 }) },
  'string.uuidV7': { label: 'UUID v7', category: 'ID', generate: () => faker.string.uuid({ version: 7 }) },
  'string.nanoid': { label: 'Nano ID', category: 'ID', generate: () => faker.string.nanoid() },
  'string.ulid': { label: 'ULID', category: 'ID', generate: () => faker.string.ulid() },
  'string.cuid': { label: 'CUID', category: 'ID', generate: () => faker.string.alphanumeric(25) },

  'location.city': { label: 'City', category: 'Location', generate: () => faker.location.city() },
  'location.country': { label: 'Country', category: 'Location', generate: () => faker.location.country() },
  'location.countryCode': { label: 'Country Code', category: 'Location', generate: () => faker.location.countryCode() },
  'location.state': { label: 'State', category: 'Location', generate: () => faker.location.state() },
  'location.county': { label: 'County', category: 'Location', generate: () => faker.location.county() },
  'location.streetAddress': { label: 'Street Address', category: 'Location', generate: () => faker.location.streetAddress() },
  'location.buildingNumber': { label: 'Building Number', category: 'Location', generate: () => faker.location.buildingNumber() },
  'location.zipCode': { label: 'Zip Code', category: 'Location', generate: () => faker.location.zipCode() },
  'location.latitude': { label: 'Latitude', category: 'Location', generate: () => faker.location.latitude() },
  'location.longitude': { label: 'Longitude', category: 'Location', generate: () => faker.location.longitude() },
  'location.timeZone': { label: 'Time Zone', category: 'Location', generate: () => faker.location.timeZone() },

  'finance.amount': { label: 'Amount', category: 'Finance', generate: () => Number(faker.finance.amount()) },
  'finance.currencyCode': { label: 'Currency Code', category: 'Finance', generate: () => faker.finance.currencyCode() },
  'finance.currencyName': { label: 'Currency Name', category: 'Finance', generate: () => faker.finance.currencyName() },
  'finance.creditCardNumber': { label: 'Credit Card Number', category: 'Finance', generate: () => faker.finance.creditCardNumber() },
  'finance.creditCardCVV': { label: 'Credit Card CVV', category: 'Finance', generate: () => faker.finance.creditCardCVV() },
  'finance.iban': { label: 'IBAN', category: 'Finance', generate: () => faker.finance.iban() },
  'finance.bic': { label: 'BIC/SWIFT', category: 'Finance', generate: () => faker.finance.bic() },
  'finance.accountNumber': { label: 'Account Number', category: 'Finance', generate: () => faker.finance.accountNumber() },
  'finance.transactionType': { label: 'Transaction Type', category: 'Finance', generate: () => faker.finance.transactionType() },
  'finance.bitcoinAddress': { label: 'Bitcoin Address', category: 'Finance', generate: () => faker.finance.bitcoinAddress() },
  'finance.ethereumAddress': { label: 'Ethereum Address', category: 'Finance', generate: () => faker.finance.ethereumAddress() },

  'commerce.price': { label: 'Price', category: 'Commerce', generate: () => Number(faker.commerce.price()) },
  'commerce.productName': { label: 'Product Name', category: 'Commerce', generate: () => faker.commerce.productName() },
  'commerce.productDescription': { label: 'Product Description', category: 'Commerce', generate: () => faker.commerce.productDescription() },
  'commerce.department': { label: 'Department', category: 'Commerce', generate: () => faker.commerce.department() },
  'commerce.isbn': { label: 'ISBN', category: 'Commerce', generate: () => faker.commerce.isbn() },
  'company.name': { label: 'Company Name', category: 'Commerce', generate: () => faker.company.name() },
  'company.buzzPhrase': { label: 'Buzz Phrase', category: 'Commerce', generate: () => faker.company.buzzPhrase() },
  'company.catchPhrase': { label: 'Catch Phrase', category: 'Commerce', generate: () => faker.company.catchPhrase() },

  'system.fileName': { label: 'File Name', category: 'System', generate: () => faker.system.fileName() },
  'system.fileExt': { label: 'File Extension', category: 'System', generate: () => faker.system.fileExt() },
  'system.filePath': { label: 'File Path', category: 'System', generate: () => faker.system.filePath() },
  'system.mimeType': { label: 'MIME Type', category: 'System', generate: () => faker.system.mimeType() },
  'system.semver': { label: 'Semver Version', category: 'System', generate: () => faker.system.semver() },
  'system.cron': { label: 'Cron Expression', category: 'System', generate: () => faker.system.cron() },

  'git.commitSha': { label: 'Git Commit SHA', category: 'System', generate: () => faker.git.commitSha() },

  'vehicle.vehicle': { label: 'Vehicle', category: 'Other', generate: () => faker.vehicle.vehicle() },
  'vehicle.manufacturer': { label: 'Vehicle Manufacturer', category: 'Other', generate: () => faker.vehicle.manufacturer() },
  'vehicle.vrm': { label: 'License Plate', category: 'Other', generate: () => faker.vehicle.vrm() },
  'airline.airline': { label: 'Airline', category: 'Other', generate: () => faker.airline.airline().name },
  'airline.flightNumber': { label: 'Flight Number', category: 'Other', generate: () => faker.airline.flightNumber() },
  'music.genre': { label: 'Music Genre', category: 'Other', generate: () => faker.music.genre() },
  'food.dish': { label: 'Dish', category: 'Other', generate: () => faker.food.dish() },
  'food.ingredient': { label: 'Ingredient', category: 'Other', generate: () => faker.food.ingredient() },
  'science.chemicalElement': { label: 'Chemical Element', category: 'Other', generate: () => faker.science.chemicalElement().name },
  'science.unit': { label: 'Unit of Measurement', category: 'Other', generate: () => faker.science.unit().name },
  'animal.type': { label: 'Animal Type', category: 'Other', generate: () => faker.animal.type() },
  'hacker.phrase': { label: 'Hacker Phrase', category: 'Other', generate: () => faker.hacker.phrase() },
  'phone.number': { label: 'Phone Number', category: 'Other', generate: () => faker.phone.number() },
  'phone.imei': { label: 'IMEI', category: 'Other', generate: () => faker.phone.imei() },
  'color.human': { label: 'Color Name', category: 'Other', generate: () => faker.color.human() },
  'color.rgb': { label: 'Color RGB', category: 'Other', generate: () => faker.color.rgb() },
  'color.hsl': { label: 'Color HSL', category: 'Other', generate: () => faker.color.hsl().join(', ') },
  'color.hex': { label: 'Color Hex', category: 'Other', generate: () => faker.color.rgb({ format: 'hex' }) },
  'json.object': { label: 'JSON Object', category: 'Other', generate: () => generateRandomJsonObject() },
  'json.array': { label: 'JSON Array', category: 'Other', generate: () => faker.helpers.multiple(() => generateRandomJsonValue(), { count: faker.number.int({ min: 1, max: 5 }) }) },
} satisfies GeneratorMap

const PG_GENERATORS = {
  'pg.point': { label: 'Point (x,y)', category: 'Postgres', generate: () => `(${faker.location.longitude()},${faker.location.latitude()})` },
  'pg.line': { label: 'Line {A,B,C}', category: 'Postgres', generate: () => `{${faker.number.float({ min: -100, max: 100, fractionDigits: 4 })},${faker.number.float({ min: -100, max: 100, fractionDigits: 4 })},${faker.number.float({ min: -100, max: 100, fractionDigits: 4 })}}` },
  'pg.lseg': { label: 'Line Segment', category: 'Postgres', generate: () => `[(${faker.location.longitude()},${faker.location.latitude()}),(${faker.location.longitude()},${faker.location.latitude()})]` },
  'pg.box': { label: 'Box', category: 'Postgres', generate: () => `(${faker.location.longitude()},${faker.location.latitude()}),(${faker.location.longitude()},${faker.location.latitude()})` },
  'pg.path': {
    label: 'Path',
    category: 'Postgres',
    generate: () => {
      const pts = faker.helpers.multiple(() => `(${faker.location.longitude()},${faker.location.latitude()})`, { count: faker.number.int({ min: 2, max: 5 }) })
      return `[${pts.join(',')}]`
    },
  },
  'pg.polygon': {
    label: 'Polygon',
    category: 'Postgres',
    generate: () => {
      const pts = faker.helpers.multiple(() => `(${faker.location.longitude()},${faker.location.latitude()})`, { count: faker.number.int({ min: 3, max: 6 }) })
      return `(${pts.join(',')})`
    },
  },
  'pg.circle': { label: 'Circle', category: 'Postgres', generate: () => `<(${faker.location.longitude()},${faker.location.latitude()}),${faker.number.float({ min: 0.1, max: 100, fractionDigits: 2 })}>` },
  'pg.interval': { label: 'Interval', category: 'Postgres', generate: () => `${faker.number.int({ min: 0, max: 99 })} ${faker.helpers.arrayElement(['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'])}` },
  'pg.intrange': {
    label: 'Int Range',
    category: 'Postgres',
    generate: () => {
      const a = faker.number.int({ min: -10000, max: 10000 })
      const b = faker.number.int({ min: a + 1, max: a + 10000 })
      return `[${a},${b})`
    },
  },
  'pg.numrange': {
    label: 'Numeric Range',
    category: 'Postgres',
    generate: () => {
      const a = faker.number.float({ min: -10000, max: 10000, fractionDigits: 2 })
      const b = faker.number.float({ min: a + 0.01, max: a + 10000, fractionDigits: 2 })
      return `[${a},${b})`
    },
  },
  'pg.daterange': {
    label: 'Date Range',
    category: 'Postgres',
    generate: () => {
      const a = faker.date.past()
      const b = faker.date.future({ refDate: a })
      return `[${a.toISOString().slice(0, 10)},${b.toISOString().slice(0, 10)})`
    },
  },
  'pg.tsrange': {
    label: 'Timestamp Range',
    category: 'Postgres',
    generate: () => {
      const a = faker.date.past()
      const b = faker.date.future({ refDate: a })
      return `[${a.toISOString()},${b.toISOString()})`
    },
  },
  'pg.intmultirange': {
    label: 'Int Multirange',
    category: 'Postgres',
    generate: () => {
      const ranges = faker.helpers.multiple(() => {
        const a = faker.number.int({ min: -10000, max: 10000 })
        return `[${a},${faker.number.int({ min: a + 1, max: a + 10000 })})`
      }, { count: faker.number.int({ min: 1, max: 3 }) })
      return `{${ranges.join(',')}}`
    },
  },
  'pg.nummultirange': {
    label: 'Numeric Multirange',
    category: 'Postgres',
    generate: () => {
      const ranges = faker.helpers.multiple(() => {
        const a = faker.number.float({ min: -10000, max: 10000, fractionDigits: 2 })
        return `[${a},${faker.number.float({ min: a + 0.01, max: a + 10000, fractionDigits: 2 })})`
      }, { count: faker.number.int({ min: 1, max: 3 }) })
      return `{${ranges.join(',')}}`
    },
  },
  'pg.datemultirange': {
    label: 'Date Multirange',
    category: 'Postgres',
    generate: () => {
      const ranges = faker.helpers.multiple(() => {
        const a = faker.date.past()
        const b = faker.date.future({ refDate: a })
        return `[${a.toISOString().slice(0, 10)},${b.toISOString().slice(0, 10)})`
      }, { count: faker.number.int({ min: 1, max: 3 }) })
      return `{${ranges.join(',')}}`
    },
  },
  'pg.tsmultirange': {
    label: 'Timestamp Multirange',
    category: 'Postgres',
    generate: () => {
      const ranges = faker.helpers.multiple(() => {
        const a = faker.date.past()
        const b = faker.date.future({ refDate: a })
        return `[${a.toISOString()},${b.toISOString()})`
      }, { count: faker.number.int({ min: 1, max: 3 }) })
      return `{${ranges.join(',')}}`
    },
  },
} satisfies GeneratorMap

const DIALECT_GENERATORS: Partial<Record<ConnectionType, GeneratorMap>> = {
  postgres: PG_GENERATORS,
}

export type GeneratorId = keyof typeof GENERATORS | keyof typeof PG_GENERATORS

export interface GeneratorDef {
  label: string
  category: string
  generate: () => unknown
}

type GeneratorMap = Record<string, GeneratorDef>

export interface Generator {
  generatorId: GeneratorId
  isNullable: boolean
}

export interface GeneratorGroup {
  value: string
  items: GeneratorId[]
}

export function getGenerators(dialect?: ConnectionType): Record<string, GeneratorDef> {
  const extra = dialect ? DIALECT_GENERATORS[dialect] : undefined
  return extra ? { ...GENERATORS, ...extra } : GENERATORS
}

export function getGeneratorGroups(dialect?: ConnectionType): GeneratorGroup[] {
  return Object.entries(getGenerators(dialect)).reduce<GeneratorGroup[]>(
    (groups, [id, gen]) => {
      const group = groups.find(g => g.value === gen.category)
      if (group) {
        group.items.push(id as GeneratorId)
        return groups
      }
      return [...groups, { value: gen.category, items: [id as GeneratorId] }]
    },
    [],
  )
}

export function autoDetectGenerator(column: Column): GeneratorId {
  const name = column.id.toLowerCase().replaceAll('_', '')
  const label = (column.label?.toLowerCase() ?? '').replace('[]', '')
  const type = (column.type?.toLowerCase() ?? '').replace('[]', '')

  if (column.foreign)
    return REFERENCE_GENERATOR

  if (column.enumName && column.availableValues && column.availableValues.length > 0)
    return ENUM_GENERATOR

  if (column.primaryKey) {
    return SKIP_GENERATOR
  }

  if (label === 'int4range' || label === 'int8range')
    return 'pg.intrange'
  if (label === 'numrange')
    return 'pg.numrange'
  if (label === 'daterange')
    return 'pg.daterange'
  if (label === 'tsrange' || label === 'tstzrange')
    return 'pg.tsrange'
  if (label === 'int4multirange' || label === 'int8multirange')
    return 'pg.intmultirange'
  if (label === 'nummultirange')
    return 'pg.nummultirange'
  if (label === 'datemultirange')
    return 'pg.datemultirange'
  if (label === 'tsmultirange' || label === 'tstzmultirange')
    return 'pg.tsmultirange'

  if (name.includes('email'))
    return 'internet.email'
  if (name === 'firstname')
    return 'person.firstName'
  if (name === 'lastname' || name === 'surname')
    return 'person.lastName'
  if (name === 'fullname' || name === 'name')
    return 'person.fullName'
  if (name.includes('phone') || name.includes('mobile') || name.includes('tel'))
    return 'phone.number'
  if (name.includes('url') || name.includes('website') || name.includes('link') || name.includes('href'))
    return 'internet.url'
  if (name.includes('avatar') || name.includes('image') || name.includes('photo') || name.includes('picture') || name.includes('thumbnail'))
    return 'image.url'
  if (name.includes('username') || name === 'login')
    return 'internet.username'
  if (name.includes('title') || name.includes('subject'))
    return 'lorem.sentence'
  if (name.includes('description') || name.includes('content') || name.includes('bio') || name.includes('summary'))
    return 'lorem.paragraph'
  if (name.includes('city'))
    return 'location.city'
  if (name.includes('country'))
    return 'location.country'
  if (name.includes('address') || name.includes('street'))
    return 'location.streetAddress'
  if (name.includes('zip') || name.includes('postal'))
    return 'location.zipCode'
  if (name === 'lat')
    return 'location.latitude'
  if (name === 'lng' || name === 'lon')
    return 'location.longitude'
  if (name.includes('company') || name.includes('organization') || name.includes('org'))
    return 'company.name'
  if (name.includes('price') || name.includes('amount') || name.includes('cost') || name.includes('total') || name.includes('fee'))
    return 'commerce.price'
  if (name.includes('product'))
    return 'commerce.productName'
  if (name.includes('color') || name.includes('colour'))
    return 'color.human'
  if (name.includes('ipaddress') || name === 'ip')
    return 'internet.ip'
  if (name.includes('slug'))
    return 'lorem.slug'
  if (name.includes('jobtitle') || name.includes('jobrole') || name.includes('position') || name.includes('role'))
    return 'person.jobTitle'
  if (name.includes('gender'))
    return 'person.gender'
  if (name.includes('password') || name.includes('secret') || name.includes('hash'))
    return 'internet.password'
  if (name.includes('domain'))
    return 'internet.domainName'
  if (name.includes('useragent'))
    return 'internet.userAgent'
  if (name.includes('currency') && name.includes('code'))
    return 'finance.currencyCode'
  if (name.includes('currency'))
    return 'finance.currencyName'
  if (name.includes('iban'))
    return 'finance.iban'
  if (name.includes('creditcard') || name.includes('cardnumber'))
    return 'finance.creditCardNumber'
  if (name.includes('cvv'))
    return 'finance.creditCardCVV'
  if (name.includes('accountnumber') || name.includes('accountno'))
    return 'finance.accountNumber'
  if (name.includes('state') || name.includes('province') || name.includes('region'))
    return 'location.state'
  if (name.includes('countrycode'))
    return 'location.countryCode'
  if (name.includes('timezone'))
    return 'date.timeZone'
  if (name.includes('mimetype') || name.includes('contenttype'))
    return 'system.mimeType'
  if (name.includes('filename'))
    return 'system.fileName'
  if (name.includes('filepath'))
    return 'system.filePath'
  if (name.includes('fileext') || name.includes('extension'))
    return 'system.fileExt'
  if (name.includes('version'))
    return 'system.semver'
  if (name.includes('isbn'))
    return 'commerce.isbn'
  if (name.includes('department'))
    return 'commerce.department'
  if (name.includes('birthdate') || name.includes('birthday') || name.includes('dob') || name.includes('dateofbirth'))
    return 'date.birthdate'
  if (name.includes('displayname') || name.includes('nickname'))
    return 'internet.displayName'
  if (name.includes('port'))
    return 'internet.port'

  if (type === 'uuid')
    return 'string.uuidV4'
  if (type === 'bit varying' || type === 'varbit' || type === 'bit')
    return 'number.binary'
  if (type === 'bool' || type === 'boolean')
    return 'datatype.boolean'
  if (type === 'bytea')
    return 'string.hexadecimal'
  if (type === 'xml' || type === 'tsvector')
    return 'lorem.sentence'
  if (type === 'tsquery')
    return 'lorem.word'
  if (type === 'inet' || type === 'cidr')
    return 'internet.ip'
  if (type === 'inet6')
    return 'internet.ipv6'
  if (type === 'macaddr' || type === 'macaddr8')
    return 'internet.mac'
  if (type === 'point')
    return 'pg.point'
  if (type === 'line')
    return 'pg.line'
  if (type === 'lseg')
    return 'pg.lseg'
  if (type === 'box')
    return 'pg.box'
  if (type === 'path')
    return 'pg.path'
  if (type === 'polygon')
    return 'pg.polygon'
  if (type === 'circle')
    return 'pg.circle'
  if (type === 'interval')
    return 'pg.interval'
  if (type === 'date')
    return 'date.recent'
  if (type === 'oid')
    return 'number.int'
  if (type.includes('int') || type === 'serial' || type === 'bigserial' || type === 'smallserial')
    return 'number.int'
  if (type.includes('float') || type.includes('double') || type.includes('decimal') || type.includes('numeric') || type === 'real' || type === 'money')
    return 'number.float'
  if (type.includes('timestamp') || type === 'datetime' || type === 'datetime2' || type === 'datetimeoffset')
    return 'date.recent'
  if (type.includes('time') || type === 'timetz')
    return 'date.time'
  if (type.includes('json'))
    return 'json.object'
  if (type.includes('char') || type.includes('text') || type === 'string' || type.includes('varchar') || type.includes('nchar'))
    return 'lorem.sentence'

  return 'lorem.word'
}

function generateValue(
  generator: Generator,
  column: Column,
  generators: Record<string, GeneratorDef>,
  dialect?: ConnectionType,
  referenceValues?: unknown[],
): unknown {
  const type = (column.type?.toLowerCase() ?? '').replace('[]', '')
  const generatorId = generator.generatorId
  const generatorImpl = generators[generatorId]
  if (!generatorImpl || generatorId === SKIP_GENERATOR)
    return undefined
  if (generatorId === 'null')
    return null

  if (generator.isNullable && column.isNullable && faker.datatype.boolean())
    return null

  if (generatorId === REFERENCE_GENERATOR) {
    if (!referenceValues || referenceValues.length === 0) {
      throw new Error(
        `Cannot generate seed data: no reference values available for column "${column.id}".`,
      )
    }
    if (column.isArray) {
      const count = faker.number.int({ min: 1, max: 5 })
      return faker.helpers.multiple(() => faker.helpers.arrayElement(referenceValues), { count })
    }
    return faker.helpers.arrayElement(referenceValues)
  }

  if (generatorId === ENUM_GENERATOR) {
    if (!column.availableValues || column.availableValues.length === 0) {
      throw new Error(
        `Cannot generate seed data: no enum values available for column "${column.id}".`,
      )
    }
    if (column.isArray) {
      const count = faker.number.int({ min: 1, max: Math.min(5, column.availableValues.length) })
      return faker.helpers.arrayElements(column.availableValues, count)
    }
    return faker.helpers.arrayElement(column.availableValues)
  }

  if (column.isArray) {
    const count = faker.number.int({ min: 1, max: 5 })
    const items = faker.helpers.multiple(() => generatorImpl.generate(), { count })
    if (dialect === 'postgres') {
      const strings = items.map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v))
      if (type === 'box')
        return toPgArrayLiteral(strings, ';')
      return toPgArrayLiteral(strings)
    }
    return items
  }

  return generatorImpl.generate()
}

export function generateRows(
  columns: Column[],
  columnGenerators: Record<string, Generator>,
  count: number,
  dialect?: ConnectionType,
  referenceData?: Record<string, unknown[]>,
) {
  const generators = getGenerators(dialect)
  return Array.from({ length: count }, () => {
    const row: Record<string, unknown> = {}
    for (const column of columns) {
      const generator = columnGenerators[column.id]
      if (!generator || generator.generatorId === SKIP_GENERATOR)
        continue

      const value = generateValue(
        generator,
        column,
        generators,
        dialect,
        referenceData?.[column.id],
      )

      if (value !== undefined) {
        row[column.id] = value
      }
    }
    return row
  })
}
