import { faker } from '@faker-js/faker'

import type { GeneratorMap } from '.'

const scalarJsonGenerators = [
  () => faker.lorem.word(),
  () => faker.number.int({ max: 100_000, min: -100_000 }),
  () => faker.number.float({ fractionDigits: 2, max: 100_000, min: -100_000 }),
  () => faker.datatype.boolean(),
  () => faker.date.recent().toISOString(),
  () => null,
] as const

const createRandomJsonKey = (existing: Record<string, unknown>) => {
  let key = faker.string
    .alphanumeric(faker.number.int({ max: 12, min: 3 }))
    .toLowerCase()
  while (key in existing) {
    key = faker.string
      .alphanumeric(faker.number.int({ max: 12, min: 3 }))
      .toLowerCase()
  }
  return key
}

const generateRandomJsonValue = (depth = 0): unknown => {
  if (depth >= 2) {
    return faker.helpers.arrayElement(scalarJsonGenerators)()
  }

  const valueType = faker.helpers.arrayElement([
    'scalar',
    'array',
    'object',
  ] as const)

  if (valueType === 'scalar') {
    return faker.helpers.arrayElement(scalarJsonGenerators)()
  }

  if (valueType === 'array') {
    const itemCount = faker.number.int({ max: 5, min: 1 })
    return faker.helpers.multiple(() => generateRandomJsonValue(depth + 1), {
      count: itemCount,
    })
  }

  const keyCount = faker.number.int({ max: 6, min: 1 })
  const object: Record<string, unknown> = {}
  for (let i = 0; i < keyCount; i += 1) {
    object[createRandomJsonKey(object)] = generateRandomJsonValue(depth + 1)
  }
  return object
}

const generateRandomJsonObject = (depth = 0): Record<string, unknown> => {
  const keyCount = faker.number.int({ max: 6, min: 1 })
  const object: Record<string, unknown> = {}

  for (let i = 0; i < keyCount; i += 1) {
    object[createRandomJsonKey(object)] = generateRandomJsonValue(depth)
  }

  return object
}

export const BASE_GENERATORS = {
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
  'color.hsl': {
    category: 'Other',
    generate: () => faker.color.hsl().join(', '),
    label: 'Color HSL',
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
  'custom-generator': {
    category: 'Special',
    generate: () => null,
    label: 'Custom',
  },
  'datatype.boolean': {
    category: 'Boolean',
    generate: () => faker.datatype.boolean(),
    label: 'Boolean',
  },
  'date.birthdate': {
    category: 'Date',
    generate: () => faker.date.birthdate().toISOString(),
    label: 'Birthdate',
  },
  'date.future': {
    category: 'Date',
    generate: () => faker.date.future().toISOString(),
    label: 'Future Date',
  },
  'date.month': {
    category: 'Date',
    generate: () => faker.date.month(),
    label: 'Month Name',
  },
  'date.past': {
    category: 'Date',
    generate: () => faker.date.past().toISOString(),
    label: 'Past Date',
  },
  'date.recent': {
    category: 'Date',
    generate: () => faker.date.recent().toISOString(),
    label: 'Recent Date',
  },
  'date.soon': {
    category: 'Date',
    generate: () => faker.date.soon().toISOString(),
    label: 'Soon Date',
  },
  'date.time': {
    category: 'Date',
    generate: () => faker.date.recent().toISOString().slice(11, 19),
    label: 'Time',
  },
  'date.timeZone': {
    category: 'Date',
    generate: () => faker.location.timeZone(),
    label: 'Time Zone',
  },
  'date.weekday': {
    category: 'Date',
    generate: () => faker.date.weekday(),
    label: 'Weekday',
  },
  'enum-generator': {
    category: 'Special',
    generate: () => null,
    label: 'Random enum value',
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
      faker.helpers.multiple(() => generateRandomJsonValue(), {
        count: faker.number.int({ max: 5, min: 1 }),
      }),
    label: 'JSON Array',
  },
  'json.object': {
    category: 'Other',
    generate: () => generateRandomJsonObject(),
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
  null: { category: 'Special', generate: () => null, label: 'NULL' },
  'number.bigInt': {
    category: 'Number',
    generate: () =>
      String(faker.number.bigInt({ max: 9_007_199_254_740_991n })),
    label: 'Big Integer',
  },
  'number.binary': {
    category: 'Number',
    generate: () => faker.number.binary({ max: 255 }).replace('0b', ''),
    label: 'Binary',
  },
  'number.float': {
    category: 'Number',
    generate: () => faker.number.float({ fractionDigits: 2, max: 10_000 }),
    label: 'Float',
  },
  'number.int': {
    category: 'Number',
    generate: () => faker.number.int({ max: 10_000 }),
    label: 'Integer',
  },
  'number.octal': {
    category: 'Number',
    generate: () => faker.number.octal({ max: 255 }),
    label: 'Octal',
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
  'reference-generator': {
    category: 'Special',
    generate: () => null,
    label: 'Random reference value',
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
  'skip-generator': {
    category: 'Special',
    generate: () => null,
    label: 'Generate default',
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
  'string.cuid': {
    category: 'ID',
    generate: () => faker.string.alphanumeric(25),
    label: 'CUID',
  },
  'string.hexadecimal': {
    category: 'Text',
    generate: () => faker.string.hexadecimal({ length: 16 }),
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

type GeneratorKey = keyof typeof BASE_GENERATORS

const exactNameGenerators: Record<string, GeneratorKey> = {
  firstname: 'person.firstName',
  fullname: 'person.fullName',
  ip: 'internet.ip',
  lastname: 'person.lastName',
  lat: 'location.latitude',
  lng: 'location.longitude',
  login: 'internet.username',
  lon: 'location.longitude',
  name: 'person.fullName',
  surname: 'person.lastName',
}

const includesNameGenerators: [needles: string[], generator: GeneratorKey][] = [
  [['email'], 'internet.email'],
  [['phone', 'mobile', 'tel'], 'phone.number'],
  [['url', 'website', 'link', 'href'], 'internet.url'],
  [['avatar', 'image', 'photo', 'picture', 'thumbnail'], 'image.url'],
  [['username'], 'internet.username'],
  [['title', 'subject'], 'lorem.sentence'],
  [['description', 'content', 'bio', 'summary'], 'lorem.paragraph'],
  [['city'], 'location.city'],
  [['countrycode'], 'location.countryCode'],
  [['country'], 'location.country'],
  [['address', 'street'], 'location.streetAddress'],
  [['zip', 'postal'], 'location.zipCode'],
  [['company', 'organization', 'org'], 'company.name'],
  [['price', 'amount', 'cost', 'total', 'fee'], 'commerce.price'],
  [['product'], 'commerce.productName'],
  [['color', 'colour'], 'color.human'],
  [['ipaddress'], 'internet.ip'],
  [['slug'], 'lorem.slug'],
  [['jobtitle', 'jobrole', 'position', 'role'], 'person.jobTitle'],
  [['gender'], 'person.gender'],
  [['password', 'secret', 'hash'], 'internet.password'],
  [['domain'], 'internet.domainName'],
  [['useragent'], 'internet.userAgent'],
  [['iban'], 'finance.iban'],
  [['creditcard', 'cardnumber'], 'finance.creditCardNumber'],
  [['cvv'], 'finance.creditCardCVV'],
  [['accountnumber', 'accountno'], 'finance.accountNumber'],
  [['state', 'province', 'region'], 'location.state'],
  [['timezone'], 'date.timeZone'],
  [['mimetype', 'contenttype'], 'system.mimeType'],
  [['filename'], 'system.fileName'],
  [['filepath'], 'system.filePath'],
  [['fileext', 'extension'], 'system.fileExt'],
  [['version'], 'system.semver'],
  [['isbn'], 'commerce.isbn'],
  [['department'], 'commerce.department'],
  [['birthdate', 'birthday', 'dob', 'dateofbirth'], 'date.birthdate'],
  [['displayname', 'nickname'], 'internet.displayName'],
  [['port'], 'internet.port'],
]

const exactTypeGenerators: Record<string, GeneratorKey> = {
  bigserial: 'number.int',
  bool: 'datatype.boolean',
  boolean: 'datatype.boolean',
  date: 'date.recent',
  datetime: 'date.recent',
  datetime2: 'date.recent',
  datetimeoffset: 'date.recent',
  money: 'number.float',
  real: 'number.float',
  serial: 'number.int',
  smallserial: 'number.int',
  string: 'lorem.sentence',
  timetz: 'date.time',
  uuid: 'string.uuidV4',
}

const includesTypeGenerators: [needles: string[], generator: GeneratorKey][] = [
  [['int'], 'number.int'],
  [['float', 'double', 'decimal', 'numeric'], 'number.float'],
  [['timestamp'], 'date.recent'],
  [['time'], 'date.time'],
  [['json'], 'json.object'],
  [['char', 'text', 'varchar', 'nchar'], 'lorem.sentence'],
]

const matchIncludes = (
  value: string,
  rules: [needles: string[], generator: GeneratorKey][]
): GeneratorKey | undefined => {
  for (const [needles, generator] of rules) {
    if (needles.some((needle) => value.includes(needle))) {
      return generator
    }
  }
  return undefined
}

export const baseAutoDetectGenerator = (
  name: string,
  type: string
): GeneratorKey => {
  const exactName = exactNameGenerators[name]
  if (exactName) {
    return exactName
  }

  if (name.includes('currency') && name.includes('code')) {
    return 'finance.currencyCode'
  }
  if (name.includes('currency')) {
    return 'finance.currencyName'
  }

  const includesName = matchIncludes(name, includesNameGenerators)
  if (includesName) {
    return includesName
  }

  const exactType = exactTypeGenerators[type]
  if (exactType) {
    return exactType
  }

  const includesType = matchIncludes(type, includesTypeGenerators)
  if (includesType) {
    return includesType
  }

  return 'lorem.word'
}
