var Crypto = require('crypto-js')
var request = require('request')

function toUint8Array(wordArray) {
  // Shortcuts
  var words = wordArray.words
  var sigBytes = wordArray.sigBytes

  // Convert
  var u8 = new Uint8Array(sigBytes)
  for (var i = 0; i < sigBytes; i++) {
    var byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
    u8[i] = byte
  }

  return u8
}

var defaultsOpt = {}
/**
 * API 构造函数
 * @param {Object} [defaults] 默认参数及配置
 * @param {String} defaults.serviceType 服务类型. 如: cvm, vpc, dfw, lb 等. 根据 `serviceType` 和 `baseHost` 将拼装成请求域名, 如: `vpc.api.qcloud.com`
 * @param {String} defaults.path='/' Api 请求路径
 * @param {String} defaults.method='POST' 请求方法
 * @param {String} defaults.baseHost='tencentcloudapi.com' Api 的基础域名. 与 `serviceType` 拼装成请求域名.
 * @param {String} defaults.SecretId secretId
 * @param {String} defaults.SecretKey secretKey
 * @constructor
 */
var qcloudApiV3 = function(defaults) {
  Object.assign(
    defaultsOpt,
    {
      path: '/',
      method: 'POST',
      protocol: 'https'
    },
    defaults
  )
}

/**
 * 生成 API 的请求地址
 * @param {Object} opts
 * @returns {string}
 */
qcloudApiV3.prototype.generateUrl = function(opts) {
  opts = opts || {}
  var host = this._getHost(opts)
  var path = opts.path === undefined ? defaultsOpt.path : opts.path

  return (opts.protocol || defaultsOpt.protocol) + '://' + host + path
}

/**
 * 生成请求参数.
 * @param {Object} data 该次请求的参数. 同 `request` 方法的 `data` 参数
 * @param {Object} [opts] 请求配置. 同 `request` 方法的 `opts` 参数
 * @returns {string} 包括签名的参数字符串
 */
qcloudApiV3.prototype.generateQueryString = function(data, opts) {
  opts = opts || defaultsOpt

  var defaults = defaultsOpt

  delete data.success
  delete data.fail
  delete data.complete

  //附上公共参数
  var param = {
    Region: defaultsOpt.Region,
    SecretId: opts.SecretId || defaultsOpt.SecretId,
    Timestamp: Math.round(Date.now() / 1000),
    Nonce: Math.round(Math.random() * 65535),
    ...data
  }

  var isAPIv3 = !!data.Version

  var keys = Object.keys(param)
  var qstr = '',
    bodystr = '',
    signStr

  var host = this._getHost(opts)
  var method = (opts.method || defaults.method).toUpperCase()
  var path = opts.path === undefined ? defaults.path : opts.path

  keys.sort()

  //暂不支持纯数字键值及空字符串键值
  keys.forEach(function(key) {
    var val = param[key]
    // 排除上传文件的参数
    // modify 2018-10-25 云APIv3调用不排除‘@’字符开头的参数
    if (!isAPIv3 && method === 'POST' && val && val[0] === '@') {
      return
    }
    if (key === '') {
      return
    }
    if (
      val === undefined ||
      val === null ||
      (typeof val === 'number' && isNaN(val))
    ) {
      val = ''
    }
    //把参数中的 "_" (除开开头)替换成 "."
    qstr += '&' + (key.indexOf('_') ? key.replace(/_/g, '.') : key) + '=' + val
    bodystr +=
      '&' +
      (key.indexOf('_') ? key.replace(/_/g, '.') : key) +
      '=' +
      encodeURIComponent(val)
  })

  qstr = qstr.slice(1)
  bodystr = bodystr.slice(1)
  //console.log("加密前：",method + host + path + '?' + qstr);

  signStr = this.sign(
    method + host + path + '?' + qstr,
    opts.SecretKey || defaults.SecretKey
  )

  param.Signature = signStr
  console.log('signStr:', encodeURIComponent(signStr))
  bodystr += '&Signature=' + encodeURIComponent(signStr)

  return bodystr
}

/**
 * 请求 API
 * @param {Object} data 该次请求的参数.
 * @param {Object} [data.SecretId] Api SecrectId, 通过 `data` 参数传入时将覆盖 `opt` 传入及默认的 `secretId`
 * @param {Object} [opts] 请求配置. 配置里的参数缺省使用默认配置 (`defaultsOpt`) 里的对应项
 * @param {String} opts.host 该次请求使用的 API host. 当传入该参数的时候, 将忽略 `serviceType` 及默认 `host`
 * @param {requestCallback} callback 请求回调
 * @param {Object} [extra] 传给 request 库的额外参数
 */
qcloudApiV3.prototype.request = function(data, opts, callback, extra) {
  if (typeof opts === 'function') {
    callback = opts
    opts = defaultsOpt
  }
  opts = opts || defaultsOpt
  callback = callback || Function.prototype

  var url = this.generateUrl(opts)
  var method = (opts.method || defaultsOpt.method).toUpperCase()
  var dataStr = this.generateQueryString(data, opts)
  var option = { url: url, method: method }
  // var maxKeys =
  // 	opts.maxKeys === undefined ? defaultsOpt.maxKeys : opts.maxKeys

  if (method === 'POST') {
    // option.form = JSON.parse(dataStr, null, null, {
    // 	maxKeys: maxKeys
    // })
  } else {
    option.url += '?' + dataStr
  }

  Object.assign(option, extra)

  /**
   * `.request` 的请求回调
   * @callback requestCallback
   * @param {Error} error 请求错误
   * @param {Object} body API 请求结果
   */
  request(
    {
      url: option.url,
      form: dataStr,
      method: method,
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      }
    },
    callback
  )
}

/**
 * 生成签名,签名方法sha1
 * @param {String} str 需签名的参数串
 * @param {String} secretKey
 * @returns {String} 签名
 */
qcloudApiV3.prototype.sign = function(str, secretKey) {
  var sha1_result = Crypto.HmacSHA1(str, secretKey)
  var bytes = toUint8Array(sha1_result)
  var res = Buffer.from(bytes).toString('base64')
  console.log('base64后：', res)
  return res
}

/**
 * 获取 API host
 * @param opts 请求配置
 * @param {String} [opts.serviceType] 服务类型. 如: cvm, vpc, dfw, lb 等
 * @param {String} [opts.host] 如果配置中直接传入 host, 则直接返回该 host
 * @returns {String}
 * @private
 */
qcloudApiV3.prototype._getHost = function(opts) {
  var host = opts.host
  if (!host) {
    host =
      (opts.serviceType || defaultsOpt.serviceType) +
      '.' +
      (opts.baseHost || defaultsOpt.baseHost)
  }
  return host
}

module.exports = qcloudApiV3
