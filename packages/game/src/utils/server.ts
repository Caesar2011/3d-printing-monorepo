import express from 'express'

import { logger } from '../logger.js'

const app = express()
const port = 3000
app.use('/dist', express.static('./dist'))
app.use(express.static('./public'))

app.listen(port, () => {
  logger.debug(`Server running at http://localhost:${port}`)
})
