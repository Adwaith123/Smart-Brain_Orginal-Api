const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password: 'root',
    database : 'smartbrain'
  }
});

const app  = express();

app.use(bodyParser.json());
app.use(cors())

app.post('/signin',(req,res)=>{
	db.select('email', 'hash').from('login')
	.where('email', '=', req.body.email)
	  .then(data => {
	  const isValid	= bcrypt.compareSync(req.body.password, data[0].hash);
	  if(isValid){
	  	return db.select('*').from('users')
	  	.where('email', '=' , req.body.email)
	  	.then(user => {
	  		res.json(user[0])
	  	 })
	  	.catch(err => res.status(400).json('Unable to get the user'))
	    }else{
           res.status(400).json('Wrong Credentials');
	    }
	  }) 
	  .catch(err => res.status(400).json('Wrong Credentials'))
})

app.post('/register',(req,res)=>{
	const {email,name,password} = req.body;
	const hash = bcrypt.hashSync(password);
	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail=>{
		  return trx('users')
				.returning('*')
				.insert({
					email: loginEmail[0],
					name: name,
					joined: new Date()
			    })
			.then(user=>{
				res.json(user[0]);
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})	
	.catch(err=> res.status(400).json('Unable to Register'))
})

app.get('/profile/:id', (req,res)=> {
	const { id } = req.params;
  db.select('*').from('users').where({id})
  .then(user=>{
  	if(user.length){
  		res.json(user[0])
  	} else{
  	 res.status(400).json('Not found')
  	}
  })
  .catch(err => res.status(400).json('Error in getting user'))
})


app.put('/image',(req,res)=>{
	const { id } = req.body;
	db('users').where('id' , '=', id)
	.increment('entries' , 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0]);
	})
	.catch(err => res.status(400).json('Unable to get the entries'))
})

// Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });

app.listen(3001, ()=> {
	console.log('app is running on port 3001');
})

/*
 End points to be expected from the Front-End
 -------------------------------------------------
/ --> response with this is working
/ signin --> POST = success or fail
/ register ---> POST = retrun new user
/profile/:userid ---> GET = user
image --> PUT udate on the user profile & it returns user count

*/