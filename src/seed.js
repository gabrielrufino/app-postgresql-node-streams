'use strict'

import pg from 'pg'
import faker from 'faker'
import { promisify } from 'util'
import { pipeline } from 'stream'

try {
  const {
    DATABASE_URL,
    DATABASE_NAME,
    TABLE_NAME,
    TABLE_SIZE
  } = process.env

  let client

  client = new pg.Client({
    connectionString: `${DATABASE_URL}/postgres`
  })

  await client.connect()
  await client.query(`DROP DATABASE IF EXISTS ${DATABASE_NAME}`)
  await client.query(`CREATE DATABASE ${DATABASE_NAME}`)
  await client.end()

  client = new pg.Client({
    connectionString: `${DATABASE_URL}/${DATABASE_NAME}`
  })

  await client.connect()
  await client.query(`
    CREATE TABLE public.${TABLE_NAME} (
      id SERIAL PRIMARY KEY,
      type VARCHAR(255) NOT NULL,
      breed VARCHAR(255) NOT NULL,
      owner_name VARCHAR(255) NOT NULL,
      owner_email VARCHAR(255) NOT NULL,
      owner_phone VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await promisify(pipeline)(
    async function *() {
      for (const _ of Array(Number(TABLE_SIZE)).fill(null)) {
        const type = faker.animal.type()
        const data = [type, faker.animal[type](), faker.name.findName(), faker.internet.email(), faker.phone.phoneNumber()]
  
        yield data
      }
    },
    async function *(stream) {
      for await (const data of stream) {
        const query = {
          text: `
            INSERT INTO public.${TABLE_NAME} (type, breed, owner_name, owner_email, owner_phone)
            VALUES ($1, $2, $3, $4, $5)
          `,
          values: [...data]
        }
  
        yield query
      }
    },
    async function *(stream) {
      for await (const query of stream) {
        await client.query(query)
      }
    }
  )

  await client.end()
} catch (error) {
  console.error(error.message)
  process.exit()
}
