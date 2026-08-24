const path = require('path')

const SEED_DATA_PATH = path.join(
  __dirname,
  '..',
  '..',
  'backend/scripts/seed-data.json'
)

const loadSeedData = () => require(SEED_DATA_PATH)

const countBy = (seedData, key, value) =>
  seedData.filter((p) => p[key] === value).length

const countCombo = (seedData, categories, subCategories) =>
  seedData.filter(
    (p) =>
      categories.includes(p.category) && subCategories.includes(p.subCategory)
  ).length

const getSeedProductCounts = () => {
  const seedData = loadSeedData()

  return {
    category: {
      all: seedData.length,
      Men: countBy(seedData, 'category', 'Men'),
      Women: countBy(seedData, 'category', 'Women'),
      Kids: countBy(seedData, 'category', 'Kids'),
    },
    type: {
      all: seedData.length,
      Topwear: countBy(seedData, 'subCategory', 'Topwear'),
      Bottomwear: countBy(seedData, 'subCategory', 'Bottomwear'),
      Winterwear: countBy(seedData, 'subCategory', 'Winterwear'),
    },
    combo: {
      MenBottomwear: countCombo(seedData, ['Men'], ['Bottomwear']),
      WomenWinterwear: countCombo(seedData, ['Women'], ['Winterwear']),
      WomenKidsTopwear: countCombo(seedData, ['Women', 'Kids'], ['Topwear']),
    },
  }
}

const getSeedProductByName = (name) => {
  const seedData = loadSeedData()
  const product = seedData.find((p) => p.name === name)

  if (!product) {
    throw new Error(`No seed product found with name "${name}"`)
  }

  return product
}

module.exports = {
  getSeedProductCounts,
  getSeedProductByName,
}
