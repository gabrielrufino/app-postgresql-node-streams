const { describe, beforeAll, it, expect, afterAll } = require('@jest/globals')
const { execSync } = require('child_process')
const { existsSync, unlinkSync } = require('fs')

describe('#Functional', () => {
  beforeAll(() => {
    const POSTGRES_USER = 'root'
    const POSTGRES_PASSWORD = 'root'
    const POSTGRES_DB = 'postgres'
    const POSTGRES_PORT = 2345
    const DATABASE_URL = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}`
    const DATABASE_NAME = 'petshop'
    const TABLE_NAME = 'pets'
    const TABLE_SIZE = '1000'

    existsSync('.env') && unlinkSync('.env')
    existsSync('dataset.csv') && unlinkSync('dataset.csv')
    execSync(`echo "DATABASE_URL=${DATABASE_URL}" >> .env`)
    execSync(`echo "DATABASE_NAME=${DATABASE_NAME}" >> .env`)
    execSync(`echo "TABLE_NAME=${TABLE_NAME}" >> .env`)
    execSync(`echo "TABLE_SIZE=${TABLE_SIZE}" >> .env`)
    execSync(`
      docker container run \
        -e POSTGRES_USER=${POSTGRES_USER} \
        -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
        -e POSTGRES_DB=${POSTGRES_DB} \
        -p ${POSTGRES_PORT}:5432 \
        --name tests-postgres \
        -d \
        postgres:13
    `)
    execSync('sleep 10')
  })

  it('Should generate dataset.csv', () => {
    execSync('npm run seed')
    execSync('npm start')

    expect(existsSync('dataset.csv')).toBeTruthy()
  })

  afterAll(() => {
    execSync('docker container rm -f tests-postgres')
    existsSync('.env') && unlinkSync('.env')
    existsSync('dataset.csv') && unlinkSync('dataset.csv')
  })
})
