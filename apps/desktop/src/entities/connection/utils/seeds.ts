import type { Column } from '../components/table/utils'
import { faker } from '@faker-js/faker'

export const SKIP_GENERATOR = 'skip-generator'

export interface Generator {
  label: string
  category: string
  generate: () => unknown
}

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
  'null': { label: 'NULL', category: 'Special', generate: () => null },

  'lorem.word': { label: 'Word', category: 'Text', generate: () => faker.lorem.word() },
  'lorem.words': { label: 'Words', category: 'Text', generate: () => faker.lorem.words() },
  'lorem.sentence': { label: 'Sentence', category: 'Text', generate: () => faker.lorem.sentence() },
  'lorem.paragraph': { label: 'Paragraph', category: 'Text', generate: () => faker.lorem.paragraph() },
  'lorem.slug': { label: 'Slug', category: 'Text', generate: () => faker.lorem.slug() },

  'person.firstName': { label: 'First Name', category: 'Person', generate: () => faker.person.firstName() },
  'person.lastName': { label: 'Last Name', category: 'Person', generate: () => faker.person.lastName() },
  'person.fullName': { label: 'Full Name', category: 'Person', generate: () => faker.person.fullName() },

  'internet.email': { label: 'Email', category: 'Internet', generate: () => faker.internet.email() },
  'internet.url': { label: 'URL', category: 'Internet', generate: () => faker.internet.url() },
  'internet.username': { label: 'Username', category: 'Internet', generate: () => faker.internet.username() },
  'internet.ip': { label: 'IP Address', category: 'Internet', generate: () => faker.internet.ip() },
  'image.url': { label: 'Image URL', category: 'Internet', generate: () => faker.image.url() },

  'number.int': { label: 'Integer', category: 'Number', generate: () => faker.number.int({ max: 10000 }) },
  'number.float': { label: 'Float', category: 'Number', generate: () => faker.number.float({ max: 10000, fractionDigits: 2 }) },

  'date.recent': { label: 'Recent Date', category: 'Date', generate: () => faker.date.recent().toISOString() },
  'date.past': { label: 'Past Date', category: 'Date', generate: () => faker.date.past().toISOString() },
  'date.future': { label: 'Future Date', category: 'Date', generate: () => faker.date.future().toISOString() },

  'datatype.boolean': { label: 'Boolean', category: 'Boolean', generate: () => faker.datatype.boolean() },

  'string.uuidV4': { label: 'UUID v4', category: 'ID', generate: () => faker.string.uuid({ version: 4 }) },
  'string.uuidV7': { label: 'UUID v7', category: 'ID', generate: () => faker.string.uuid({ version: 7 }) },
  'string.nanoid': { label: 'Nano ID', category: 'ID', generate: () => faker.string.nanoid() },

  'location.city': { label: 'City', category: 'Location', generate: () => faker.location.city() },
  'location.country': { label: 'Country', category: 'Location', generate: () => faker.location.country() },
  'location.streetAddress': { label: 'Street Address', category: 'Location', generate: () => faker.location.streetAddress() },
  'location.zipCode': { label: 'Zip Code', category: 'Location', generate: () => faker.location.zipCode() },
  'location.latitude': { label: 'Latitude', category: 'Location', generate: () => faker.location.latitude() },
  'location.longitude': { label: 'Longitude', category: 'Location', generate: () => faker.location.longitude() },

  'commerce.price': { label: 'Price', category: 'Commerce', generate: () => Number(faker.commerce.price()) },
  'commerce.productName': { label: 'Product Name', category: 'Commerce', generate: () => faker.commerce.productName() },
  'company.name': { label: 'Company Name', category: 'Commerce', generate: () => faker.company.name() },

  'phone.number': { label: 'Phone Number', category: 'Other', generate: () => faker.phone.number() },
  'color.human': { label: 'Color Name', category: 'Other', generate: () => faker.color.human() },
  'color.rgb': { label: 'Color RGB', category: 'Other', generate: () => faker.color.rgb() },
  'json.object': { label: 'JSON Object', category: 'Other', generate: () => generateRandomJsonObject() },
} satisfies Record<string, Generator>

export type GeneratorId = keyof typeof GENERATORS

export interface GeneratorGroup {
  value: string
  items: GeneratorId[]
}

export const GENERATOR_GROUPS: GeneratorGroup[] = Object.entries(GENERATORS).reduce<GeneratorGroup[]>(
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

export function autoDetectGenerator(column: Column): GeneratorId {
  const name = column.id.toLowerCase().replaceAll('_', '')
  const type = column.type.toLowerCase()

  if (
    column.primaryKey
    && column.defaultValue
    && (column.defaultValue.includes('nextval')
      || column.defaultValue.includes('auto_increment')
      || column.defaultValue.includes('identity')
      || column.defaultValue.includes('gen_random_uuid')
      || column.defaultValue.includes('uuid_generate'))
  ) {
    return SKIP_GENERATOR
  }

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
  if (name.includes('description') || name.includes('body') || name.includes('content') || name.includes('bio') || name.includes('summary'))
    return 'lorem.paragraph'
  if (name.includes('city'))
    return 'location.city'
  if (name.includes('country'))
    return 'location.country'
  if (name.includes('address') || name.includes('street'))
    return 'location.streetAddress'
  if (name.includes('zip') || name.includes('postal'))
    return 'location.zipCode'
  if (name.includes('lat'))
    return 'location.latitude'
  if (name.includes('lng') || name.includes('lon'))
    return 'location.longitude'
  if (name.includes('company') || name.includes('organization') || name.includes('org'))
    return 'company.name'
  if (name.includes('price') || name.includes('amount') || name.includes('cost') || name.includes('total') || name.includes('fee'))
    return 'commerce.price'
  if (name.includes('product'))
    return 'commerce.productName'
  if (name.includes('color') || name.includes('colour'))
    return 'color.human'
  if (name.includes('ip_address') || name === 'ip')
    return 'internet.ip'
  if (name.includes('slug'))
    return 'lorem.slug'

  if (type === 'uuid')
    return 'string.uuidV4'
  if (type === 'bool' || type === 'boolean' || type === 'bit')
    return 'datatype.boolean'
  if (type.includes('int') || type === 'serial' || type === 'bigserial' || type === 'smallserial')
    return 'number.int'
  if (type.includes('float') || type.includes('double') || type.includes('decimal') || type.includes('numeric') || type === 'real' || type === 'money')
    return 'number.float'
  if (type.includes('timestamp') || type === 'datetime' || type === 'datetime2' || type === 'datetimeoffset')
    return 'date.recent'
  if (type === 'date')
    return 'date.recent'
  if (type.includes('json'))
    return 'json.object'
  if (type === 'inet' || type === 'cidr')
    return 'internet.ip'
  if (type.includes('char') || type.includes('text') || type === 'string' || type.includes('varchar') || type.includes('nchar'))
    return 'lorem.words'

  return 'lorem.words'
}

function generateValue(generatorId: GeneratorId, column: Column): unknown {
  const generator = GENERATORS[generatorId]
  if (!generator || generatorId === SKIP_GENERATOR)
    return undefined
  if (generatorId === 'null')
    return null

  const value = generator.generate()

  if (column.isArray) {
    const count = faker.number.int({ min: 1, max: 5 })
    return Array.from({ length: count }).fill(generator.generate())
  }

  return value
}

export function generateRows(
  columns: Column[],
  generators: Record<string, GeneratorId>,
  count: number,
) {
  return Array.from({ length: count }, () => {
    const row: Record<string, unknown> = {}
    for (const column of columns) {
      const generatorId = generators[column.id]
      if (!generatorId || generatorId === SKIP_GENERATOR)
        continue
      const value = generateValue(generatorId, column)
      if (value !== undefined) {
        row[column.id] = value
      }
    }
    return row
  })
}
