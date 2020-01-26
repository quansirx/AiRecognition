const CapiV3 = require('./qcloudApiV3.js')

// 支持腾讯云 API 3.0的请求
var capiv3

function SetCapiV3Client(secretid, secretkey) {
  if (!secretid || !secretkey) {
    throw new RequestError('ERR_INVALID_PARAMS', '请传入云账号信息')
  }

  capiv3 = new CapiV3({
    SecretId: secretid,
    SecretKey: secretkey,
    path: '/'
  })
}

/***
 * @class
 * 表示请求过程中发生的异常
 */
var RequestError = (function() {
  function RequestError(type, message) {
    Error.call(this, message)
    this.type = type
    this.message = message
  }

  RequestError.prototype = new Error()
  RequestError.prototype.constructor = RequestError

  return RequestError
})()

var noop = function noop() {}

//获取bots列表
function GetBots(options) {
  options.Action = 'GetBots'
  doQueryTBP(options)
}

function doQueryTBP(options) {
  var success = options.success || noop
  var fail = options.fail || noop
  var complete = options.complete || noop

  delete options.SecretKey

  // 成功回调
  var callSuccess = function(res) {
    success(res)
    complete(arguments)
  }

  // 失败回调
  var callFail = function(error) {
    fail(error)
    complete(arguments)
  }
  if (!capiv3) {
    throw new RequestError('ERR_INVALID_PARAMS', '请传入云账号信息')
  }
  capiv3.request(
    options,
    {
      serviceType: 'tbp',
      baseHost: 'tencentcloudapi.com',
      method: 'POST'
    },
    function(error, response, body) {
      body = JSON.parse(body)
      console.log('body', body)
      if (error) {
        callFail(error)
      } else {
        var err, errMsg
        if (!body || !body.Response) {
          errMsg = '请求Response为空'
          err = new RequestError('error', errMsg)
          callFail(err)
        } else {
          callSuccess(body)
        }
      }
    }
  )
}

module.exports = {
  SetCapiV3Client,
  GetBots
}
