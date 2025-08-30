const admin = require("firebase-admin");
const dotenv = require('dotenv')
dotenv.config()
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb")
const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());
const decodedKey = Buffer.from(process.env.FB_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decodedKey)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@urmi-project.bsifax9.mongodb.net/?retryWrites=true&w=majority&appName=urmi-project`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {


    const parcelCollection = client.db("parcelDB").collection("parcels");
    const paymentCollection = client.db("parcelDB").collection("payment");
    const userCollection = client.db("parcelDB").collection("users");
    const ridersCollection = client.db("parcelDB").collection("riders");
    const trackingCollection = client.db("parcelDB").collection("tracking");


    // jwt token
    const verifyFireBaseToken = async (req, res, next) => {
      const authHeader = req.headers.authorization;
      // console.log(authHeader)
      if (!authHeader) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.decoded = decoded;
        next();
      } catch (error) {
        console.log(error);
      }
    };

    // verifyAdmin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      if (!user || user.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // verifyARider
    const verifyRider = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      if (!user || user.role !== "rider") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // register korara somoy ak email dia jeno bar bar na  hoi .
    app.post("/users", async (req, res) => {
      const email = req.body.email;
      const userExists = await userCollection.findOne({ email });
      if (userExists) {
        // update last log in
        return res
          .status(200)
          .send({ message: "User already exists", inserted: false });
      }
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    //  rider role
    // rider form ta post korar jonno
    app.post("/riders", async (req, res) => {
      const id = req.body;
      const result = await ridersCollection.insertOne(id);
      res.send(result);
    });

    // riders pending
    app.get(  "/riders/pending", verifyFireBaseToken, verifyAdmin,async (req, res) => {
        try {
          const pendingRiders = await ridersCollection
            .find({ status: "pending" })
            .toArray();

          res.send(pendingRiders);
        } catch (error) {
          console.error("Failed to load pending riders:", error);
          res.status(500).send({ message: "Failed to load pending riders" });
        }
      }
    );

    // GET: Get pending delivery tasks for a rider---------------------------------------------
    app.get("/rider/parcels",verifyFireBaseToken,verifyRider, async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).send({ message: "Rider email is required" });
        }

        const query = {
          assigned_rider_email: email,
          delivery_status: {
             $in: ["rider_assigned", "in_transit"]
             },
        };

        const options = {
          sort: { creation_date: -1 }, // Newest first
        };

        const parcels = await parcelCollection.find(query, options).toArray();
        res.send(parcels);
      } catch (error) {
        console.error("Error fetching rider tasks:", error);
        res.status(500).send({ message: "Failed to get rider tasks" });
      }
    });

    // completed delivery- jara delivery ses korse tader 
    app.get('/rider/completed-parcels',verifyFireBaseToken,verifyRider, async( req,res) => {
        try {
          const email = req.query.email
          if(!email){
            return res.status(400).send({message: ' rider email is required'})
          }
           const filter = {
            assigned_rider_email: email,
            delivery_status: {
              $in: ['delivered']
            }
           }
           const options = {
            sort: {
              creation_date: -1
            }
           }
           const completedParcels = await parcelCollection.find(filter, options ).toArray()
           res.send(completedParcels)
           console.log(completedParcels);

         }
         catch (error) {
          console.error('Error loading completed parcels:',error);
          res.status(500).send({message: "[Failed to load completed deliveries]"})
          
        }
    })

    // pending delivery er update
    app.patch("/parcels/:id/status", async (req, res) => {
      const parcelId = req.params.id;
      const { status } = req.body;
      const updateDoc = {
        delivery_status: status,
      };
      if (status === "in_transit") {
        updateDoc.picked_at = new Date().toISOString();
      } else if (status === "delivered") {
        updateDoc.delivery_at = new Date().toISOString();
      }

      try {
        const result = await parcelCollection.updateOne(
          { _id: new ObjectId(parcelId) },
          {
            $set: updateDoc,
          }
        );
        res.send(result);
      } 
      catch (error) {
        res.status(500).send({ message: "Failed to update status" });
      }
    });

    // cash out completed delivery er tk nibe rider
      app.patch('/parcels/:id/cashout', async (req,res) =>{
          const id = req.params.id
          const filter = { _id: new ObjectId(id) }
          const updateDoc = {
              $set: {
                  cashout_status : 'cashed_out',
                  cashout_at : new Date()
              }
          }
          const result = await parcelCollection.updateOne(filter,updateDoc)
          res.send(result)
      })

    // GET: Get all parcels for a rider
    app.get("/rider/:id/parcels", async (req, res) => {
      const { id } = req.params;
      try {
        const parcels = await parcelCollection.find({ riderId: id }).toArray();
        res.send(parcels);
      } catch (error) {
        console.error("Error fetching rider parcels:", error);
        res.status(500).send({ message: "Failed to get rider parcels" });
      }
    });

    //pending riders er jonno approve , reject btn er api, status tao set kora hoise je kun role
    app.patch("/riders/:id/status", async (req, res) => {
      const { id } = req.params;
      const { status, email } = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status,
        },
      };
      try {
        const result = await ridersCollection.updateOne(query, updateDoc);

        if (status === "active") {
          const useQuery = { email };
          const updateDoc = {
            $set: {
              role: "rider",
            },
          };
          const roleResult = await userCollection.updateOne(
            useQuery,
            updateDoc
          );
          console.log(roleResult.modifiedCount);
        }
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to update rider status" });
      }
    });

    // users search
    app.get("/users/search", async (req, res) => {
      const emailQuery = req.query.email;
      const regex = new RegExp(emailQuery, "i");
      try {
        const users = await userCollection
          .find({
            email: {
              $regex: regex,
            },
          })
          .limit(10)
          .toArray();
        res.send(users);
      } catch (error) {
        console.error("Error searching users", error);
        res.status(500).send({ message: "Error searching users" });
      }
    });

    // admin role set korar jonno
    app.patch("/users/:id/role", verifyFireBaseToken,  verifyAdmin, async (req, res) => {
        const { id } = req.params;
        const { role } = req.body;

        if (!["admin", "user"].includes(role)) {
          return res.status(400).send({ message: "Invalid role" });
        }

        try {
          const result = await userCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { role } }
          );
          res.send({ message: `User role updated to ${role}`, result });
        } catch (error) {
          console.error("Error updating user role", error);
          res.status(500).send({ message: "Failed to update user role" });
        }
      }
    );

    // GET: Get user role by email
    app.get("/users/:email/role", async (req, res) => {
      try {
        const email = req.params.email;
        console.log(email);
        if (!email) {
          return res.status(400).send({ message: "Email is required" });
        }

        const user = await userCollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }

        res.send({ role: user.role || "user" });
      } catch (error) {
        console.error("Error getting user role:", error);
        res.status(500).send({ message: "Failed to get role" });
      }
    });

    //  active Riders der active gula dekar jonno
    app.get("/riders/active",verifyFireBaseToken,  verifyAdmin,  async (req, res) => {
        const result = await ridersCollection
          .find({ status: "active" })
          .toArray();
        res.send(result);
      }
    );

    // available rider gula
    app.get("/riders/available", async (req, res) => {
      const { district } = req.query;
      try {
        const riders = await ridersCollection.find({ district }).toArray();
        res.send(riders);
      } catch (error) {
        res.status(500).send({ message: "failed to load riders" });
      }
    });

    // send parcel jonno, pore gia my parcel hobe
    app.get("/parcels", async (req, res) => {
      const { email, payment_status, delivery_status } = req.query;

      const query = {};
      if (email) {
        query: {
          created_by: email;
        }
      }
      if (payment_status) {
        query.payment_status = payment_status;
      }
      if (delivery_status) {
        query.delivery_status = delivery_status;
      }

      const option = {
        sort: { creation_date: -1 },
      };

      console.log("parcel query", req.query, query);

      const result = await parcelCollection.find(query, option).toArray();
      res.send(result);
    });

    // status gular count kora. kunta koyta hoise . sei onuojai
    app.get('/parcels/delivery/status-count', async (req, res) =>{
        const pipeline = [
            {
                $group: {
                    _id: '$delivery_status',
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $project: {
                    status:'$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]
        const result = await parcelCollection.aggregate(pipeline).toArray()
        res.send(result)
    })

    // app.patch("/parcels/:id/assign", async (req, res) => {
    //   const parcelId = req.params.id;
    //   const { riderId, riderName } = req.body;

    // // console.log(riderId, riderName );
    //   const filter = {_id: new ObjectId(parcelId)}
    //   const updateDoc = {
    //     $set:{
    //       delivery_status: "in_transit",
    //       assigned_rider_id: riderId,
    //       assigned_rider_name: riderName,
    //     },
    //   }

    //   try {
    //     await parcelCollection.updateOne(filter,updateDoc)

    //     const filter = {_id: new ObjectId(riderId)}
    //     const updateDoc = {
    //       $set:{
    //         status: "in_delivery"
    //       },
    //     }

    //     await parcelCollection.updateOne(filter,updateDoc)
    //     res.send({message:" rider assigned"})

    //   } catch (err) {
    //     console.error(err);
    //     res.status(500).send({ message: "Failed to assign rider" });
    // }

    // })

    // assignRider er patch
    app.patch("/parcels/:id/assign", async (req, res) => {
      const parcelId = req.params.id;
      const { riderId, riderName, riderEmail } = req.body;

      try {
        // Update parcel
        await parcelCollection.updateOne(
          { _id: new ObjectId(parcelId) },
          {
            $set: {
              delivery_status: "rider_assigned",
              assigned_rider_id: riderId,
              assigned_rider_email: riderEmail,
              assigned_rider_name: riderName,
            },
          }
        );

        // Update rider
        await ridersCollection.updateOne(
          { _id: new ObjectId(riderId) },
          {
            $set: {
              work_status: "in_delivery",
            },
          }
        );

        res.send({ message: "Rider assigned" });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to assign rider" });
      }
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

    // my parcel er pay korar por unpaid ta pain hoye jabe tai post er modhei update kora hoise
    app.post("/payments", async (req, res) => {
      try {
        const { parcelId, amount, email, paymentMethod, transactionId } =
          req.body;

        // 1. Update parcel's payment_status
        const updateResult = await parcelCollection.updateOne(
          { _id: new ObjectId(parcelId) },
          {
            $set: {
              payment_status: "paid",
            },
          }
        );

        if (updateResult.modifiedCount === 0) {
          return res
            .status(404)
            .send({ message: "Parcel not found or already paid" });
        }

        const paymentDoc = {
          parcelId,
          email,
          paymentMethod,
          transactionId,
          amount,
          paid_at_string: new Date().toISOString(),
          paid_at: new Date(),
        };
        const paymentResult = await paymentCollection.insertOne(paymentDoc);
        res.status(201).send({
          message: "Payment recorded and parcel marked as paid",
          insertedId: paymentResult.insertedId,
        });
      } catch (error) {
        console.error("Payment processing failed:", error);
        res.status(500).send({ message: "Failed to record payment" });
      }
    });

    // payment history er get
    app.get("/payments",verifyFireBaseToken,  async (req, res) => {
      try {
        const userEmail = req.query.email;

        const query = userEmail ? { email: userEmail } : {};
        const options = { sort: { paid_at: -1 } }; // Latest first

        const payments = await paymentCollection.find(query, options).toArray();
        res.send(payments);
      } catch (error) {
        console.error("Error fetching payment history:", error);
        res.status(500).send({ message: "Failed to get payments" });
      }
    });

    // tracking
    app.get('/tracking/:trackingId', async(req,res)=>{
      const id = req.params.trackingId
      const filter = {
        tracking_id : id
      }
      const updates = await trackingCollection.find(filter).sort({timestamp: 1}).toArray()
      res.json(updates)
    })


    app.post('/tracking' , async (req, res) =>{
      const update = req.body
      update.timestamp = new Date()
      if(!update.tracking_id || !update.status){
        return res.status(400).json({message : 'tracking id and status are required'})
      }
      const result = await trackingCollection.insertOne(update)
      res.status(201).json(result)

      console.log(result);
    })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
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
