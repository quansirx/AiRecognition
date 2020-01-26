Page({
  data: {
    botList: []
  },
  onLoad: function() {
    var self = this

    wx.cloud.callFunction({
      name: 'TBP_GET_BOTS',
      data: {
        Version: '2019-03-11',
        PageNumber: 1,
        PageSize: 50
      },
      success(cloud_callFunction_res) {
        const data = cloud_callFunction_res && cloud_callFunction_res.result
        if (data == null || data.Response == null) {
          console.error('获取内置robot列表失败：data异常')
          return
        }

        const res = data.Response
        if (res.BotList !== null) {
          self.setData({
            botList: res.BotList
          })
        } else {
          console.error('获取内置robot列表失败：', res)
          throw res
        }
      }
    })
  }
})
