import express from 'express'

const app = express()
const port = 3000
app.use('/dist', express.static('./dist'))
app.use(express.static('./public'))

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
