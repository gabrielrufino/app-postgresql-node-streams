'use strict'

import pg from 'pg'
import QueryStream from 'pg-query-stream'
import { promisify } from 'util'
import { pipeline } from 'stream'
import { createWriteStream } from 'fs'

try {
  const {
    DATABASE_URL,
    DATABASE_NAME,
    TABLE_NAME
  } = process.env

  const client = new pg.Client({
    connectionString: `${DATABASE_URL}/${DATABASE_NAME}`
  })

  await client.connect()

  const query = new QueryStream(`SELECT * FROM public.${TABLE_NAME}`)
  const stream = client.query(query)

  await promisify(pipeline)(
    stream,
    async function *(stream) {
      yield ['ID', 'Type', 'Breed', 'Owner name', 'Owner email', 'Owner phone', 'Register date']
  
      for await (const chunk of stream) {
        yield Object.values(chunk)
      }
    },
    async function *(lines) {
      for await (const line of lines) {
        yield line.join(',') + '\n'
      }
    },
    createWriteStream('dataset.csv')
  )

  await client.end()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
