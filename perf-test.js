const SuperJSON = require("./dist2").default

const data = []
for (let i = 0; i < 100; i++) {
  let nested1 = []
  let nested2 = []
  for (let j = 0; j < 10; j++) {
    nested1[j] = {
      createdAt: new Date(),
      updatedAt: new Date(),
      innerNested: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }
    nested2[j] = {
      createdAt: new Date(),
      updatedAt: new Date(),
      innerNested: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }
  }
  const object = {
    createdAt: new Date(),
    updatedAt: new Date(),
    nested1,
    nested2,
  }
  data.push(object)
}

SuperJSON.serialize(data)
