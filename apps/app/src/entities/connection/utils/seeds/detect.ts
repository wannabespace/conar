import type { Column } from '../../components/table/cell/utils'
import type { GeneratorId } from './registry'

type Family =
  | 'bool'
  | 'date'
  | 'datetime'
  | 'float'
  | 'int'
  | 'json'
  | 'text'
  | 'time'
  | 'uuid'

type Rules<T> = [needles: string[], result: T][]

const FAMILY_RULES: Rules<Family> = [
  [['bool'], 'bool'],
  [['uuid', 'uniqueidentifier'], 'uuid'],
  [['json'], 'json'],
  [['datetime', 'timestamp'], 'datetime'],
  [['date'], 'date'],
  [['time'], 'time'],
  [['int', 'serial'], 'int'],
  [['float', 'double', 'decimal', 'numeric', 'real', 'money'], 'float'],
  [['char', 'text', 'string', 'clob', 'citext', 'name'], 'text'],
]

const EXACT_TEXT_NAMES: Record<string, GeneratorId> = {
  firstname: 'person.firstName',
  fullname: 'person.fullName',
  ip: 'internet.ip',
  lastname: 'person.lastName',
  login: 'internet.username',
  name: 'person.fullName',
  surname: 'person.lastName',
}

const TEXT_NAME_RULES: Rules<GeneratorId> = [
  [['email'], 'internet.email'],
  [['phone', 'mobile', 'tel'], 'phone.number'],
  [['url', 'website', 'link', 'href'], 'internet.url'],
  [['avatar', 'image', 'photo', 'picture', 'thumbnail'], 'image.url'],
  [['username'], 'internet.username'],
  [['displayname', 'nickname'], 'internet.displayName'],
  [['title', 'subject'], 'lorem.sentence'],
  [['description', 'content', 'bio', 'summary', 'body'], 'lorem.paragraph'],
  [['city'], 'location.city'],
  [['countrycode'], 'location.countryCode'],
  [['country'], 'location.country'],
  [['address', 'street'], 'location.streetAddress'],
  [['zip', 'postal'], 'location.zipCode'],
  [['state', 'province', 'region'], 'location.state'],
  [['timezone'], 'location.timeZone'],
  [['company', 'organization', 'org'], 'company.name'],
  [['product'], 'commerce.productName'],
  [['department'], 'commerce.department'],
  [['isbn'], 'commerce.isbn'],
  [['currencycode'], 'finance.currencyCode'],
  [['currency'], 'finance.currencyName'],
  [['iban'], 'finance.iban'],
  [['creditcard', 'cardnumber'], 'finance.creditCardNumber'],
  [['cvv'], 'finance.creditCardCVV'],
  [['accountnumber', 'accountno'], 'finance.accountNumber'],
  [['color', 'colour'], 'color.human'],
  [['ipaddress'], 'internet.ip'],
  [['macaddress'], 'internet.mac'],
  [['slug'], 'lorem.slug'],
  [['jobtitle', 'jobrole', 'position', 'role'], 'person.jobTitle'],
  [['gender'], 'person.gender'],
  [['password', 'secret', 'hash', 'token'], 'internet.password'],
  [['domain'], 'internet.domainName'],
  [['useragent'], 'internet.userAgent'],
  [['mimetype', 'contenttype'], 'system.mimeType'],
  [['filename'], 'system.fileName'],
  [['filepath'], 'system.filePath'],
  [['fileext', 'extension'], 'system.fileExt'],
  [['version'], 'system.semver'],
  [['sha', 'commit'], 'git.commitSha'],
]

const FLOAT_NAME_RULES: Rules<GeneratorId> = [
  [['price', 'amount', 'cost', 'total', 'fee', 'salary'], 'commerce.price'],
  [['latitude', 'lat'], 'location.latitude'],
  [['longitude', 'lng', 'lon'], 'location.longitude'],
  [['percent', 'rate', 'ratio'], 'number.percentage'],
]

const INT_NAME_RULES: Rules<GeneratorId> = [[['port'], 'internet.port']]

const DATE_NAME_RULES: Rules<GeneratorId> = [
  [['birth', 'dob'], 'date.birthdate'],
  [['expire', 'expiry', 'due', 'until', 'deadline'], 'date.future'],
]

// A sentence sliced to fit a short varchar reads as garbage; a word does not
const SHORT_TEXT_LIMIT = 32

const match = <T>(value: string, rules: Rules<T>): T | undefined =>
  rules.find(([needles]) => needles.some((n) => value.includes(n)))?.[1]

const byFamily: Record<Family, (name: string, column: Column) => GeneratorId> =
  {
    bool: () => 'datatype.boolean',
    date: (name) => match(name, DATE_NAME_RULES) ?? 'date.recent',
    datetime: (name) => match(name, DATE_NAME_RULES) ?? 'date.recent',
    float: (name) => match(name, FLOAT_NAME_RULES) ?? 'number.float',
    int: (name) => match(name, INT_NAME_RULES) ?? 'number.int',
    json: () => 'json.object',
    text: (name, column) => {
      if (name.endsWith('id')) {
        return 'string.alphanumeric'
      }
      return (
        EXACT_TEXT_NAMES[name] ??
        match(name, TEXT_NAME_RULES) ??
        (column.maxLength && column.maxLength < SHORT_TEXT_LIMIT
          ? 'lorem.word'
          : 'lorem.sentence')
      )
    },
    time: () => 'date.time',
    uuid: () => 'string.uuidV4',
  }

export const detectGenerator = (column: Column, type: string): GeneratorId => {
  const family = match(type, FAMILY_RULES)
  const name = column.id.toLowerCase().replaceAll('_', '')
  return family ? byFamily[family](name, column) : 'lorem.word'
}
