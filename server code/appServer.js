const mongoose = require("mongoose")
const express = require("express")
const { connectDB } = require("./connectDB.js")
const { getTypes } = require("./getTypes.js")
const morgan = require("morgan")
const cors = require("cors")
const dotenv = require("dotenv")
dotenv.config();
const userModel = require("./userModel.js")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require('express-async-errors');
const {populatePokemons} = require('./populatePokemons.js');
const {
  PokemonBadRequest,
  PokemonBadRequestMissingID,
  PokemonBadRequestMissingAfter,
  PokemonDbError,
  PokemonNotFoundError,
  PokemonDuplicateError,
  PokemonNoSuchRouteError,
  PokemonAuthError
} = require("./errors.js")




const app = express()
// const port = 5000
var pokeModel = null;

const start = async () => {
  await connectDB({ "drop": false });
  const pokeSchema = await getTypes();
  pokeModel = await populatePokemons(pokeSchema)
  app.listen(process.env.authServerPORT, async(err) => {
    if (err)
      throw new PokemonDbError(err)
    else
      console.log(`Phew! Server is running on port: ${process.env.pokeServerPORT}`);
      const doc = await userModel.findOne({ "username": "admin" })
      if (!doc)
        userModel.create({ username: "admin", password: bcrypt.hashSync("admin", 10), role: "admin", email: "admin@admin.ca" })
  })
}
start()
app.use(express.json())
app.use(morgan(":method"))

app.use(cors({
  exposedHeaders: ['auth-token-access', 'auth-token-refresh']
}))

app.post('/register', async (req, res) => {
  try{
    const { username, password, email, role } = req.body
    if(!username || ! password || !email){
      const error = new PokemonAuthError("Please provide all proper credential to register");
      return res.status(error.pokeErrCode).json({
        name: error.name,
        code: error.pokeErrCode,
        message: error.message
      });
    }
    if(role){
    const validRoles = ['admin', 'user'];
    if (!validRoles.includes(role)) {
      const error = new PokemonAuthError(`Invalid role value. Role must be one of: ${validRoles.join(', ')}.`);
      return res.status(error.pokeErrCode).json({
        name: error.name,
        code: error.pokeErrCode,
        message: error.message
      });
    }
  }
    if(password.length < 6){
      const error = new PokemonAuthError(`Password must be of length 6`);
      return res.status(error.pokeErrCode).json({
        name: error.name,
        code: error.pokeErrCode,
        message: error.message
      });
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const userWithHashedPassword = { ...req.body, password: hashedPassword }
    const user = await userModel.findOne({"username": username})
    if(!user){
      const new_user = await userModel.create(userWithHashedPassword)
      res.status(201).json({
        "userinfo": new_user,
        "msg": "user created succesfully"
      })
    }else{
      const error = new PokemonAuthError("User already exsist");
      return res.status(error.pokeErrCode).json({
        name: error.name,
        code: error.pokeErrCode,
        message: error.message
      });
    }
  }catch(error){
    const dbError = new PokemonAuthError("An error occurred while registering the user. Please check that you are entering proper credentials.");
    return res.status(dbError.pokeErrCode).json({
      name: dbError.name,
      code: dbError.pokeErrCode,
      message: dbError.message
    });
  }
})

app.get('/requestNewAccessToken', async (req, res) => {
  const refreshToken = req.header('auth-token-refresh')
  if (!refreshToken) {
    throw new PokemonAuthError("No Token: Please provide a token.")
  }
  const user = await userModel.findOne({ refreshToken });
  if (!user) {
    const error = new PokemonAuthError("Invalid Token: Please provide a valid refresh token.");
    return res.status(error.pokeErrCode).json({
      name: error.name,
      code: error.pokeErrCode,
      message: error.message
    });
  }
  try {
    const payload = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const accessToken = jwt.sign({ user: payload.user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10s' })
    res.header('auth-token-access', accessToken)
    res.status(200).send("All good!");
  }catch (error) {
    const error1 = new PokemonAuthError("Invalid Token: Please provide a valid refresh token.");
    return res.status(error1.pokeErrCode).json({
      name: error1.name,
      code: error1.pokeErrCode,
      message: error1.message
    });
  }
})

app.post('/login',async (req, res) => {
  const { username, password } = req.body
  if(!username || !password){
    const error = new PokemonAuthError("Please provide proper credentials to login");
    return res.status(error.pokeErrCode).json({
      name: error.name,
      code: error.pokeErrCode,
      message: error.message,
    });
  }
  const user = await userModel.findOne({ username })

  if (!user) {
    const error = new PokemonAuthError("User not found");
    return res.status(error.pokeErrCode).json({
      name: error.name,
      code: error.pokeErrCode,
      message: error.message,
    });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    const error = new PokemonAuthError("Password is incorrect");
    return res.status(error.pokeErrCode).json({
      name: error.name,
      code: error.pokeErrCode,
      message: error.message,
    });
  }


  const accessToken = jwt.sign({ user: user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10s' })
  if (!user.refreshToken) {
      const refreshToken = jwt.sign({ user: user }, process.env.REFRESH_TOKEN_SECRET)
      const update = await userModel.findOneAndUpdate({ username }, { "token_invalid": false, "refreshToken": refreshToken }, { new: true })
      res.header('auth-token-access', accessToken)
      res.header('auth-token-refresh', refreshToken)
      res.status(200).json({ update});
  } else{
    const update = await userModel.findOneAndUpdate({ username }, { "token_invalid": false}, { new: true })
      res.header('auth-token-access', accessToken)
      res.header('auth-token-refresh', update.refreshToken)
      res.status(200).json({ update});
  }
  
})


app.get('/logout', async (req, res) => {
  const refreshToken = req.header('auth-token-refresh')
  if (!refreshToken) {
    const error = new PokemonAuthError("No Token: Please provide a token.");
    return res.status(error.pokeErrCode).json({
      name: error.name,
      code: error.pokeErrCode,
      message: error.message
    });
  }
  const user = await userModel.findOne({ refreshToken });
  if (!user) {
    const error = new PokemonAuthError("User not found");
    return res.status(error.pokeErrCode).json({
      name: error.name,
      code: error.pokeErrCode,
      message: error.message
    });
  }
  user.refreshToken = null;
  user.token_invalid = true;
  await user.save();
  res.json({user:user, msg: 'Logged out' });
})

const authUser = async (req, res, next) => {
  const token = req.header('auth-token-access')

  if (!token) {
    const error = new PokemonAuthError("No Token: Please provide the access token using the headers");
    return res.status(error.pokeErrCode).json({
      name: error.name,
      code: error.pokeErrCode,
      message: error.message
    });
  }
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    req.user = {
      uniqueUserId: decodedToken.user._id
    };
    const userid =  decodedToken.user._id
    console.log(userid)
    const userWithToken = await userModel.findOne({ userid});
    if (!userWithToken || userWithToken.token_invalid) {
      const error = new PokemonAuthError("Please Login.");
      return res.status(error.pokeErrCode).json({
        name: error.name,
        code: error.pokeErrCode,
        message: error.message
      });
    }
    next()
  } catch (err) {
    const error = new PokemonAuthError("Invalid Token Verification. Log in again.");
    return res.status(error.pokeErrCode).json({
      name: error.name,
      code: error.pokeErrCode,
      message: error.message
    });
  }
};

const authAdmin = async (req, res, next) => {
  const payload = jwt.verify(req.header('auth-token-access'), process.env.ACCESS_TOKEN_SECRET)
  if (payload?.user?.role == "admin") {
    return next()
  }else{
    const error = new PokemonAuthError("Access denied");
    return res.status(error.pokeErrCode).json({
      name: error.name,
      code: error.pokeErrCode,
      message: error.message
    });
  }
}

app.use(authUser)

app.get('/api/v1/pokemons', async (req, res) => {
  if (!req.query["count"])
    req.query["count"] = 10
  if (!req.query["after"])
    req.query["after"] = 0
  const docs = await pokeModel.find({})
    .sort({ "id": 1 })
    .skip(req.query["after"])
    .limit(req.query["count"])
  res.json({docs})

})

app.get('/api/v1/allpokemons', async (req, res) => {
  const pokemons = await pokeModel.find().lean();
  if (pokemons.length !== 0) {
    res.status(200).json(pokemons);
  } else {
    res.status(404).json({ message: "No pokemons found" });
  }
});


app.get('/api/v1/pokemon', async (req, res) => {
  const {id }= req.query.id
        const pokemon = await pokeModel.find({"id": id})
        if(pokemon.length != 0){
            res.send(pokemon)
        }
        else{
            res.status(404).json(
                {
                errMsg: "Pokemon not found"
                }
            )
    }
})

app.get('/pokemonImage/:id', async(req, res)=>{
  let id = req.params.id
  try{
      const pokemon = await pokeModel.findOne({"id": id})
      if(pokemon){
          let desiredLength = 3;
          let paddedNumber = id.toString().padStart(desiredLength, '0');
          const response  = `https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/images/${paddedNumber}.png`
          res.json(response)
      }else{
          res.json({
              msg : "Pokemon not found"
          })
      }
  }
  catch(err){
      res.json(validationData(err))
  }
})

app.use(authAdmin)
app.post('/api/v1/pokemon/', async (req, res) => {
  if (!req.body.id) {
    const error = new PokemonBadRequestMissingID();
    return res.status(400).json({
      name: error.name,
      code: error.pokeErrCode,
      message: error.message
    });
}
  const poke = await pokeModel.find({ "id": req.body.id })
  if (poke.length != 0) {
    const error = new PokemonDuplicateError();
    return res.status(400).json({
      name: error.name,
      code: error.pokeErrCode,
      message: error.message
    });
  }
  const pokeDoc = await pokeModel.create(req.body)
  res.status(201).json({
    pokeInfo: pokeDoc,
    msg: "Added Successfully"
  })
})

app.delete('/api/v1/pokemon', async (req, res) => {
  const docs = await pokeModel.findOneAndRemove({ id: req.query.id })
  if (docs)
    res.json({
      msg: "Deleted Successfully"
    })
  else{
  const error = new PokemonNotFoundError();
  return res.status(404).json({
    name: error.name,
    code: error.pokeErrCode,
    message: error.message
  });
}
})

app.put('/api/v1/pokemon/:id', async (req, res) => {
  const selection = { id: req.params.id }
  const update = req.body
  const options = {
    new: true,
    runValidators: true,
    overwrite: true
  }
  const doc = await pokeModel.findOneAndUpdate(selection, update, options)
  if (doc) {
    res.json({
      msg: "Updated Successfully",
      pokeInfo: doc
    })
  } else {
    const error = new PokemonNotFoundError();
  return res.status(404).json({
    name: error.name,
    code: error.pokeErrCode,
    message: error.message
  });
  }
})

app.patch('/api/v1/pokemon/:id', async (req, res) => {
  const selection = { id: req.params.id }
  const update = req.body
  const options = {
    new: true,
    runValidators: true
  }
  const doc = await pokeModel.findOneAndUpdate(selection, update, options)
  if (doc) {
    res.json({
      msg: "Updated Successfully",
      pokeInfo: doc
    })
  } else {
    const error = new PokemonNotFoundError();
   return res.status(404).json({
    name: error.name,
    code: error.pokeErrCode,
    message: error.message
  });
  }
})


app.get('/report', (req, res) => {
  console.log("Report requested");
  res.send(`Table ${req.query.id}`)
})

