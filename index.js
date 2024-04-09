const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
require('dotenv').config()
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL);
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
})
const User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  description: {
    type: String,
  },
  duration: {
    type: Number,
  },
  date: {
    type: String
  },
  id: {
    type: String
  }
})
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.get('/api/users', async (req, res) => {
  try {
    let users = await User.find();
    let data = users.map(user => {
      let id = user._id.toString();
      let element = {
        username: user.username,
        _id: id
      }
      return element;
    })
    res.json(data);
  } catch(err) {
    console.error(err);
    res.json({message: err});
  }
})

app.post('/api/users', async (req, res) => {
  try {
    if (req.body.username == null || req.body.username === undefined) {
      return res.json({message: 'Username must be provided'});
    }
    let user = await User.create({username: req.body.username});
    let id = user._id.toString();
    let response = {
      username: user.username,
      _id: id
    }
    res.json(response);
  } catch (err) {
    console.log(err);
    res.json({message: err});
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
   try {
      if (req.params._id === null || 
          req.body.description == null ||
          req.body.duration == null 
          ) {
            return res.json({message: "provide valid inputs"});
        }
      let description = req.body.description.toString();
      let duration = parseInt(req.body.duration);
      let date;
      if (!req.body.date) {
        date = new Date();
        date = date.toDateString();
      } else {
        date = req.body.date;
        let newDate = new Date(date);
        date = newDate.toDateString();
      }
      let user = await User.findOne({_id: req.params._id});
      let username;
      if (user) {
        username = user.username;
      } else {
        return res.json({message: "illegal user"});
      }
      let exercise = await Exercise.create({
        username,
        description,
        duration,
        date,
        id:req.params._id
      })
      res.json({
        username,
        description,
        duration,
        date,
        _id: req.params._id
      })
   } catch (err) {
      console.log(err);
      res.json({message: err}); 
   }
})

app.get('/api/users/:_id/logs', async (req, res) =>{
  const userId = req.params._id;
	const from = req.query.from || new Date(0).toISOString().substring(0, 10);
	const to =
		req.query.to || new Date(Date.now()).toISOString().substring(0, 10);
	const limit = Number(req.query.limit) || 0;

	//? Find the user
	let user = await User.findOne({_id: userId})

  if(!user) return res.json({message: 'User not found'});
	//? Find the exercises
	let exercises = await Exercise.find({
		id: userId,
		//date: { $gte: from, $lte: to },
	})
		.select('description duration date')
		.limit(limit);

	let parsedDatesLog = exercises.map((exercise) => {
		return {
			description: exercise.description,
			duration: exercise.duration,
			date: exercise.date,
		};
	});
  console.log(parsedDatesLog);
	res.json({
		username: user.username,
		count: parsedDatesLog.length,
    _id: req.params._id,
		log: parsedDatesLog,
	});
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
