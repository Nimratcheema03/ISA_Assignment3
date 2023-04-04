const mongoose = require("mongoose")
const express = require("express")
const { connectDB } = require("./connectDB.js")
const { getTypes } = require("./getTypes.js")
const cors = require("cors")
const dotenv = require("dotenv")
dotenv.config();
const userModel = require("./userModel.js")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require('express-async-errors');
// const {populatePokemons} = require('./populatePokemons.js');
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
  pokeModel = mongoose.model('pokemons', pokeSchema);
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
    const accessToken = jwt.sign({ user: payload.user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1m' })
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


  const accessToken = jwt.sign({ user: user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' })
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
  await userModel.findOneAndUpdate({ refreshToken}, { "token_invalid": true, "refreshToken": null }, { new: true })
  res.json({user:user, msg: 'Logged out' });
})

const authUser = async (req, res, next) => {
  const token = req.header('auth-token-access')
  console.log(token)

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
      username: decodedToken.user.username
    };
    const userid =  decodedToken.user._id
    console.log(userid)
    const userWithToken = await userModel.findOne({_id: userid});
    console.log(userWithToken)
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
const apiReportMiddleware = require('./apiMiddleware.js')
app.get('/api/v1/pokemons', async (req, res) => {
  try{
  if (!req.query["count"])
    req.query["count"] = 10
  if (!req.query["after"])
    req.query["after"] = 0
  const docs = await pokeModel.find({})
    .sort({ "id": 1 })
    .skip(req.query["after"])
    .limit(req.query["count"])
  res.json({docs})
  }catch(err){
    res.status(400).json(err)
  }

})

app.get('/api/v1/allpokemons',apiReportMiddleware, async (req, res) => {
  const pokemons = await pokeModel.find().lean();
  if (pokemons.length !== 0) {
    res.status(200).json(pokemons);
  } else {
    res.status(404).json({ message: "No pokemons found" });
  }
});


app.get('/api/v1/pokemonss',apiReportMiddleware, async (req, res) => {
  const id = req.query.id
        const pokemon = await pokeModel.find({"id": id})
        console.log(pokemon)
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

app.get('/pokemonImage/:id', apiReportMiddleware, async(req, res)=>{
  let id = req.params.id
  console.log("id", id)
  try{
      const pokemon = await pokeModel.findOne({"id": id})
      if(pokemon){
          let desiredLength = 3;
          let paddedNumber = id.toString().padStart(desiredLength, '0');
          const response  = `https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/images/${paddedNumber}.png`
          if(response){
          res.status(200).json(response)
          }else{
             res.json(404).json('no imagee')
          }
      }else{
          res.status(404).json({
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

const ApiReport = require('./apiReport');

app.get('/top-users-by-endpoint', async (req, res) => {
  try {
    const result = await ApiReport.aggregate([
      {
        $match: {
          status_code: { $ne: 404 }
        }
      },
      {
        $group: {
          _id: {
            endpoint: {
              $cond: [
                { $regexMatch: { input: '$endpoint', regex: /\/pokemonImage\// } },
                { $substr: ['$endpoint', 0, 14] },
                '$endpoint'
              ]
            },
            username: '$username'
          },
          requests: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.endpoint': 1, requests: -1 }
      },
      {
        $group: {
          _id: '$_id.endpoint',
          topUsers: { $push: { username: '$_id.username', requests: '$requests' } }
        }
      },
      {
        $project: {
          _id: 0,
          endpoint: '$_id',
          topUsers: { $slice: ['$topUsers', 10] }
        }
      }
    ]);
    console.log('Top users for each endpoint report:', result);
    res.json(result);
  } catch (err) {
    console.error('Error generating top users for each endpoint report:', err);
    res.status(500).send('Error generating report');
  }
});



app.get('/unique-users-over-time', async (req, res) => {
  const endDate = new Date().toLocaleString;
  const startDate = new Date(new Date().getTime() - 24 * 60 * 60 * 1000); // last day

  try {
    const result = await ApiReport.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $addFields: {
          minute: {
            $dateToString: {
              format: '%Y-%m-%d %H',
              date: '$timestamp',
              timezone: 'America/Vancouver',
            },
          },
        },
      },
      {
        $group: {
          _id: '$minute',
          uniqueUsers: { $addToSet: '$username' },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          uniqueUsersCount: { $size: '$uniqueUsers' },
        },
      },
    ]);

    console.log('Unique API users over time report:', result);
    res.json(result);
  } catch (err) {
    console.error('Error generating unique API users over time report:', err);
    res.status(500).send('Error generating report');
  }
});


app.get('/top-users-over-time', async (req, res) => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // last day

  try {
    const result = await ApiReport.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { username: '$username' },
          requests: { $sum: 1 }
        }
      },
      {
        $sort: { requests: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          username: '$_id.username',
          requests: 1
        }
      }
    ]);

    console.log('Top API users over time report:', result);
    res.json(result);
  } catch (err) {
    console.error('Error generating top API users over time report:', err);
    res.status(500).send('Error generating report');
  }
});

app.get('/4xx-errors-by-endpoint', async (req, res) => {
  try {
    const result = await ApiReport.aggregate([
      {
        $match: {
          status_code: { $gte: 400 }
        }
      },
      {
        $group: {
          _id: { endpoint: '$endpoint', status_code: '$status_code' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $project: {
          _id: 0,
          endpoint: '$_id.endpoint',
          status_code: '$_id.status_code',
          count: 1
        }
      }
    ]);
    console.log('4xx/5xx errors by endpoint report:', result);
    res.json(result);
  } catch (err) {
    console.error('Error generating 4xx/5xx errors by endpoint report:', err);
    res.status(500).send('Error generating report');
  }
});

app.get('/4xx-5xx-errors', async (req, res) => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

  try {
    const result = await ApiReport.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          status_code: { $gte: 400 }
        }
      },
      {
        $group: {
          _id: { endpoint: '$endpoint', status_code: '$status_code' },
          failed_requests: { $push: { timestamp: '$timestamp', request: '$$ROOT' } }
        }
      },
      {
        $sort: { '_id.endpoint': 1 }
      },
      {
        $project: {
          _id: 0,
          endpoint: '$_id.endpoint',
          status_code: '$_id.status_code',
          failed_requests: 1
        }
      }
    ]);

    console.log('4xx/5xx errors by endpoint report:', result);
    res.json(result);
  } catch (err) {
    console.error('Error generating 4xx/5xx errors by endpoint report:', err);
    res.status(500).send('Error generating report');
  }
});
