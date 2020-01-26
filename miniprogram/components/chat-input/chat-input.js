let _page
let inputObj = {}
let windowHeight, windowWidth

function init(page, opt) {
  windowHeight = opt.systemInfo.windowHeight
  windowWidth = opt.systemInfo.windowWidth

  if (!windowHeight || !windowWidth) {
    console.error(
      '没有获取到手机的屏幕尺寸：windowWidth',
      windowWidth,
      'windowHeight',
      windowHeight
    )
    return
  }
  _page = page
}

function setTextMessageListener(cb) {
  if (_page) {
    _page.chatInputBindBlurEvent = function() {
      setTimeout(() => {
        let obj = {}
        if (
          !inputObj.inputValueEventTemp ||
          !inputObj.inputValueEventTemp.detail.value
        ) {
          inputObj.inputValueEventTemp = null
        }
        _page.setData(obj)
      })
    }
    _page.enterHandler = function(e) {
      _page.setData({
        textMessage: ''
      })
      typeof cb === 'function' && cb(e)
      inputObj.inputValueEventTemp = null
    }
    _page.confirmHandler = function() {
      if (
        !!inputObj.inputValueEventTemp &&
        !!inputObj.inputValueEventTemp.detail.value
      ) {
        typeof cb === 'function' &&
          cb(JSON.parse(JSON.stringify(inputObj.inputValueEventTemp)))
      }

      _page.setData({
        textMessage: ''
      })
      inputObj.inputValueEventTemp = null
    }
    _page.chatInputGetValueEvent = function(e) {
      inputObj.inputValueEventTemp = e
      _page.setData({
        textMessage: e.detail.value
      })
    }
  }
}

module.exports = {
  init: init,
  setTextMessageListener: setTextMessageListener
}
