var express = require('express')
var bodyParser = require('body-parser')
var path = require('path')
var session = require('express-session')
var axios = require('axios')
var config = require('./config')
var app = express()

var port = 8080

var userList = [
  {
    openId: '',
    sessionKey: '',
    nickName: '',
    avatarUrl: '',
    unionId: '',
    phone: ''
  }
]

app
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())
  .use(session({
    secret: 'alittlegirl',
    resave: false,
    saveUninitialized: true
  }))

  .use((req, res, next) => {
    console.log(`req.url: ${req.url}`)
    console.log(`session`, req.session.id)
    next()
  })

  .all('/oauth/login', (req, res) => {
    var params = req.body
    var {code, type} = params
    if (type === 'wxapp') {
      axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: config.appId,
          secret: config.appSecret,
          js_code: code,
          grant_type: 'authorization_code'
        }
      }).then(({data}) => {
        var openId = data.openid
        var user = userList.find(user => {
          return user.openId === openId
        })
        if (!user) {
          user = {
            openId,
            sessionKey: data.session_key
          }
        }
        req.session.user = user
      }).then(() => {
        res.send(req.session.user)
      })
    }
  })

  .get('/user/info', (req, res) => {
    res.send(req.session.user)
  })

  .post('/user/bindphone', (req, res) => {
    var {encryptedData, iv} = req.body
  })

  .get('/user/bindinfo', (req, res) => {
    var {encryptedData, iv} = req.body

  })

  .listen(port, err => {
    console.log(`listen on http://localhost:${port}`)
  })
