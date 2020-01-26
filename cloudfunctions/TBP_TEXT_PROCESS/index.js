// 云函数入口文件
const cloud = require('wx-server-sdk') //小程序云开发SDK
const tencentcloud = require('tencentcloud-sdk-nodejs') //腾讯云API 3.0 SDK

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

//云开发初始化
var textProcess = function(BotId, queryText) {
  const TBPClient = tencentcloud.tbp.v20190627.Client
  const models = tencentcloud.tbp.v20190627.Models

  const Credential = tencentcloud.common.Credential
  const ClientProfile = tencentcloud.common.ClientProfile
  const HttpProfile = tencentcloud.common.HttpProfile

  // 这里填入你的 SecretID 和 Secretkey ,在腾讯云账号信息可以找到
  const cred = new Credential('AKIDvjP2BDp4lHdt1zqUox0sZ6SgjQwG6NCw', 'mW8ZpvqgOcpslT0LXYUEnGIDwTp0zOf7')

  let httpProfile = new HttpProfile()
  httpProfile.endpoint = 'tbp.tencentcloudapi.com'
  let clientProfile = new ClientProfile()
  clientProfile.httpProfile = httpProfile
  let client = new TBPClient(cred, 'ap-guangzhou', clientProfile)
  console.log('client', client)
  let req = new models.TextProcessRequest()

  const params = JSON.stringify({
    Version: '2019-06-27',
    BotId,
    BotEnv: 'release',
    InputText: queryText,
    TerminalId: '122112'
  })
  //拼接参数
  req.from_json_string(params)

  return new Promise(function(resolve, reject) {
    //构造异步函数
    client.TextProcess(req, function(errMsg, response) {
      if (errMsg) {
        reject(errMsg)
      } else {
        resolve(response)
      }
    })
  })
}

exports.main = async (event, context) => {
  const { BotId, queryText } = event
  const resp = await textProcess(BotId, queryText)
  return resp
}
