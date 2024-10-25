const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const cors = require('cors')

const app = express()
const port = 7000

//middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASS}@cluster0.sgghh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function bootstrap() {
  try {
    
    await client.connect();
    const database = client.db("doctorsPortal");
    const appointmentOptionsCollections = database.collection("appointmentOptions")
    const usersCollection = database.collection("Users")
    const bookingCollection = database.collection("Bookings")

    //appointmentOptions get
    app.get('/appointmentOptions',async(req,res)=>{
      //get date
        const date = req.query.date
        //find by query
        const query = {};
        const options = await appointmentOptionsCollections.find(query).toArray();
        
        //get booking of the provided date by frontend
        const bookingQuery = {appointmentDate: date }
        const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();
        
        options.forEach(option => {
        const optionBooked = alreadyBooked.filter(book => book.treatment ===option.name )
        const bookedSlot = optionBooked.map(book => book.slot );
        
        const remainingSlots = option.slots.filter(slot => !bookedSlot.includes(slot))
        option.slots = remainingSlots
        })
        res.send(options)
    })

    //appointment get
    app.get('/bookings',async(req,res)=>{
        
      const email = req.query.email
      const query = {email:email};
      const bookings = await bookingCollection.find(query).toArray()
      res.send(bookings)
      
    })

    //booking
    app.post('/bookings',async(req,res)=> {
      const booking = req.body;
      console.log(booking);
      
      const query = {
        appointmentDate: booking.appointmentDate,
        email: booking.email,
        treatment: booking.treatment
      }

      const alreadyBooked = await bookingCollection.find(query).toArray()
      if(alreadyBooked.length){
        const message = `You have a booking on ${booking.appointmentDate} try another day`
        return res.send({acknowledged:false, message})
      }

      const result = await bookingCollection.insertOne(booking)
      res.send(result)
      
    })
    

  } finally {
   
    //await client.close();
  }
}
bootstrap().catch(console.dir);

app.get('/', (req, res) => {
  res.send('doctorsPortal is Running')
})

app.listen(port, () => {
  console.log(`My final project run on port ${port}`)
})