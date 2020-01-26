// 云函数入口文件
const cloud = require('wx-server-sdk') //小程序云开发SDK
const TBPServer = require('./libs/tbp')

// 这里填入你的 SecretID 和 Secretkey ,在腾讯云账号信息可以找到
TBPServer.SetCapiV3Client('AKIDvjP2BDp4lHdt1zqUox0sZ6SgjQwG6NCw', 'mW8ZpvqgOcpslT0LXYUEnGIDwTp0zOf7')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

//云开发初始化
function getBots(param = {}) {
  return new Promise(function(resolve, reject) {
    const { Version = '2019-03-11', PageNumber = 1, PageSize = 50 } = param
    //构造异步函数
    TBPServer.GetBots({
      Version,
      PageNumber,
      PageSize,
      success(data) {
        console.log('TBPServer success', data)
        resolve(data)
      },
      fail(err) {
        console.log('TBPServer fail', err)
        reject(err)
      }
    })
  })
}

exports.main = async (event, context) => {
  return await getBots(event)
}
