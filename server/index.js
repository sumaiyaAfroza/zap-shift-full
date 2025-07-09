require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')

const port = process.env.PORT || 3000
const app = express()

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@urmi-project.bsifax9.mongodb.net/?retryWrites=true&w=majority&appName=urmi-project`;
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ema-john.ftku5dr.mongodb.net/?retryWrites=true&w=majority&appName=ema-john`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
async function run() {
  const parcelCollection =client.db('parcelDB').collection('parcels')


  try {

    app.get('/parcels', async(req,res)=>{
       const userEmail = req.query.email;
       const query = userEmail ? {created_by: userEmail} : {};
       const option = {
        sort: { creation_date: -1}
       }
      const result = await parcelCollection.find(query,option).toArray()
      res.send(result)
    })

    app.post('/parcels',async(req,res)=>{
      const newBody = req.body
      const result = await parcelCollection.insertOne(newBody)
      res.send(result)

    })

    app.delete('/parcels/:id', async (req, res) => {
            try {
                const id = req.params.id;

                const result = await parcelCollection.deleteOne({ _id: new ObjectId(id) });

                res.send(result);
            } catch (error) {
                console.error('Error deleting parcel:', error);
                res.status(500).send({ message: 'Failed to delete parcel' });
            }
        });
      
 
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from plantNet Server..')
})

app.listen(port, () => {
  console.log(`plantNet is running on port ${port}`)
})

