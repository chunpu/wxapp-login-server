var express = require('express')
var bodyParser = require('body-parser')
var path = require('path')
var session = require('express-session')
var axios = require('axios')
var config = require('./config')
var WXBizDataCrypt = require('./WXBizDataCrypt')
var app = express()

var port = 8080

var userList = [
  {
    openId: '',
    sessionKey: '',
    nickName: '',
    avatarUrl: '',
    unionId: '',
    phoneNumber: ''
  }
]

var sessionMap = {

}

app
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())
  .use(session({
    secret: 'alittlegirl',
    resave: false,
    saveUninitialized: true
  }))

  .use((req, res, next) => {
    req.user = sessionMap[req.session.id]
    console.log(`req.url: ${req.url}`)
    console.log(`session`, req.session.id)
    next()
  })

  .post('/oauth/login', (req, res) => {
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
          userList.push(user)
          console.log('新用户', user)
        } else {
          console.log('老用户', user)
        }
        sessionMap[req.session.id] = user
        req.user = user
      }).then(() => {
        res.send(req.user)
      })
    }
  })

  .get('/user/info', (req, res) => {
    res.send(req.user)
  })

  .post('/user/bindphone', (req, res) => {
    var user = req.user
    if (user) {
      var {encryptedData, iv} = req.body
      var pc = new WXBizDataCrypt(config.appId, user.sessionKey)
      var data = pc.decryptData(encryptedData, iv)
      Object.assign(user, data)
      res.send(req.user)
    }
  })

  .post('/user/bindinfo', (req, res) => {
    var user = req.user
    if (user) {
      var {encryptedData, iv} = req.body
      var pc = new WXBizDataCrypt(config.appId, user.sessionKey)
      var data = pc.decryptData(encryptedData, iv)
      Object.assign(user, data)
      res.send(req.user)
    }
  })

  .listen(port, err => {
    console.log(`listen on http://localhost:${port}`)
  })
