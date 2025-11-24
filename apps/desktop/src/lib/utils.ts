import { faker } from '@faker-js/faker'

export const getApiUrl = () => localStorage.getItem('__API_URL_FOR_PRODUCTION_TEST_CASES__') ?? import.meta.env.VITE_PUBLIC_API_URL

export function generateRandomName() {
  const color = faker.color.human()
  const animalKeys = Object.keys(faker.animal) as Array<keyof typeof faker.animal>
  const categories = [
    () => faker.animal.type(),
    () => faker.animal[faker.helpers.arrayElement(animalKeys)](),
    () => faker.vehicle.model(),
    () => faker.internet.domainWord(),
    () => faker.person.firstName(),
    () => faker.food.dish(),
    () => faker.word.noun(),
    () => faker.company.name(),
  ]
  const main = faker.helpers.arrayElement(categories)()

  return [color, main]
    .map(str => (str.charAt(0).toUpperCase() + str.slice(1)))
    .filter(Boolean)
    .join(' ')
}
