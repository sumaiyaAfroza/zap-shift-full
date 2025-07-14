require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);
const port = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@urmi-project.bsifax9.mongodb.net/?retryWrites=true&w=majority&appName=urmi-project`;
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ema-john.ftku5dr.mongodb.net/?retryWrites=true&w=majority&appName=ema-john`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  const parcelCollection = client.db("parcelDB").collection("parcels");
  const paymentCollection = client.db("parcelDB").collection("payment");
  const userCollection = client.db('parcelDB').collection('users')

  // jwt token
    const verifyFireBaseToken = async(req,res,next)=>{
      const authHeader = req.headers.authorization 
      // console.log(authHeader)
      if(authHeader){
        return res.status(401).send({message: "unauthorized access"})
      }
      const token = authHeader.split('')[1]
      if(!token){
        return res.status(401).send({message: "unauthorized access"})
      }

      try {
        
      } catch (error) {
        
      }
      
      next()
    }

  // register korara somoy ak email dia jeno bar bar na  hoi .
  app.post('/users', async (req, res) => {
            const email = req.body.email;
            const userExists = await userCollection.findOne({ email })
            if (userExists) {
                // update last log in
                return res.status(200).send({ message: 'User already exists', inserted: false });
            }
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })
  try {


    // send parcel jonno, pore gia my parcel hobe
    app.get("/parcels",verifyFireBaseToken, async (req, res) => {
      const userEmail = req.query.email;
      const query = userEmail ? { created_by: userEmail } : {};
      const option = {
        sort: { creation_date: -1 },
      };
      const result = await parcelCollection.find(query, option).toArray();
      res.send(result);
    });

    //  payment id paiar jono
    app.get("/parcels/:id", async (req, res) => {
      const id = req.params.id;
      const parcel = await parcelCollection.findOne({ _id: new ObjectId(id) });
      res.send(parcel);
    });

    app.post("/parcels", async (req, res) => {
      const newBody = req.body;
      const result = await parcelCollection.insertOne(newBody);
      res.send(result);
    });

    app.delete("/parcels/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await parcelCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (error) {
        console.error("Error deleting parcel:", error);
        res.status(500).send({ message: "Failed to delete parcel" });
      }
    });

    //  payment cent korte
    app.post("/create-payment-intent", async (req, res) => {
      const { amountInCents } = req.body;
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "usd",
          payment_method_types: ["card"],
        });
        res.send({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/payments', async (req, res) => {
      try {
        const { parcelId, amount, email, paymentMethod, transactionId } = req.body;

           // 1. Update parcel's payment_status
                const updateResult = await parcelCollection.updateOne(
                    { _id: new ObjectId(parcelId) },
                    {
                        $set: {
                            payment_status: 'paid'
                        }
                    }
                );

                if (updateResult.modifiedCount === 0) {
                    return res.status(404).send({ message: 'Parcel not found or already paid' });
                }

        const paymentDoc = {
          parcelId,
          email,
          paymentMethod,
          transactionId,
          amount,
          paid_at_string: new Date().toISOString(),
          paid_at:new Date()
        };
        const paymentResult = await paymentCollection.insertOne(paymentDoc);
        res.status(201).send({
          message: 'Payment recorded and parcel marked as paid',
                    insertedId: paymentResult.insertedId,
        })
      } catch (error) {
         console.error('Payment processing failed:', error);
          res.status(500).send({ message: 'Failed to record payment' });
      }
    });

    // payment history er get  
    app.get('/payments', async (req, res) => {
            try {
                const userEmail = req.query.email;

                const query = userEmail ? { email: userEmail } : {};
                const options = { sort: { paid_at: -1 } }; // Latest first

                const payments = await paymentCollection.find(query, options).toArray();
                res.send(payments);
            } catch (error) {
                console.error('Error fetching payment history:', error);
                res.status(500).send({ message: 'Failed to get payments' });
            }
        });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from parcel Server..");
});

app.listen(port, () => {
  console.log(`parcel is running on port ${port}`);
});



