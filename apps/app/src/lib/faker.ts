import { faker } from '@faker-js/faker'
import { uppercaseFirst } from '@tamery/shared/utils/helpers'

export const generateRandomName = () => {
  const color = faker.color.human()
  const animalKeys = Object.keys(faker.animal) as (keyof typeof faker.animal)[]
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
    .map((str) => uppercaseFirst(str))
    .filter(Boolean)
    .join(' ')
}
