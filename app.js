const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors')
const axios = require('axios')
const { v4: uuidv4 } = require('uuid');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
  allowedHeaders: "*",
}))
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.post('/payment-auth', async (req, res) => {
  const userId = uuidv4().substring(0,15)
  const {institutionId} = req.body
  try {
    const response = await axios.post("https://api.yapily.com/payment-auth-requests",
  {
    "applicationUserId": userId,
    "institutionId": institutionId,
    "callback": "https://node-standalone.herokuapp.com/callback",
    "paymentRequest": {
      "type": "DOMESTIC_PAYMENT",
      "reference": "Bills",
      "paymentIdempotencyId": userId + "-modelo-sandbox",
      "amount": {
        "amount": 8.70,
        "currency": "GBP"
      },
      "payee": {
        "name": "BILLS COFFEE LTD",
        "accountIdentifications": [
          {
            "type": "ACCOUNT_NUMBER",
            "identification": "99998888"
          },
          {
            "type": "SORT_CODE",
            "identification": "556677"
          }
        ],
        "address": {
          "country": "GB",
          "postCode": "E3 3FQ"
        }
      }
    }
  },
  { 
    withCredentials: false,
    headers:{
      "Content-Type": "application/json",
      "Authorization": "Basic YzRlZTRmZjItNDViYy00N2ViLWE5NzgtODc3ZjA3NWU3YmQ3OjA5NWJhNTc1LWU0YTYtNGFmNC1hYTczLWM1MWQyZDBmYjk2MQ=="
    } });
    res.status(200).send(response.data.data.authorisationUrl)
  } catch (error) {
    res.status(400).send(error)
  }
  })

app.get('/callback', async (req, res) => {
  const response = 
  await axios
  .post("https://api.yapily.com/payments",
  {
    "type": "DOMESTIC_PAYMENT",
    "reference": "Bills",
    "paymentIdempotencyId": req.query["application-user-id"] + "-" + req.query["institution"],
    "amount": {
      "amount": 8.70,
      "currency": "GBP"
    },
    "payee": {
      "name": "BILLS COFFEE LTD",
      "accountIdentifications": [
        {
          "type": "ACCOUNT_NUMBER",
          "identification": "99998888"
        },
        {
          "type": "SORT_CODE",
          "identification": "556677"
        }
      ],
      "address": {
        "country": "GB"
      }
    },
  },
  {
    headers:{
      "Content-Type": "application/json",
      "Consent": req.query.consent || "test consent",
      "Authorization": "Basic YzRlZTRmZjItNDViYy00N2ViLWE5NzgtODc3ZjA3NWU3YmQ3OjA5NWJhNTc1LWU0YTYtNGFmNC1hYTczLWM1MWQyZDBmYjk2MQ=="
    } 
  });
  // res.send(response.data)
  res.status(301).redirect("http://localhost:3001/success")
})


app.get('/get-banks', async (req, res) => {
  const response = 
  await axios
  .get("https://api.yapily.com/institutions",{
    withCredentials: false,
    headers:{
      "Authorization": "Basic YzRlZTRmZjItNDViYy00N2ViLWE5NzgtODc3ZjA3NWU3YmQ3OjA5NWJhNTc1LWU0YTYtNGFmNC1hYTczLWM1MWQyZDBmYjk2MQ=="
    } 
  });
  res.send(response.data)
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
