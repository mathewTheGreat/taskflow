import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: 'postgresql://neondb_owner:npg_1lBCLKh6HMFi@ep-summer-cake-adwa1i01-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
})
