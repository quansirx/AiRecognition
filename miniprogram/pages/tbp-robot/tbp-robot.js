const chatInput = require('../../components/chat-input/chat-input')

Page({
  data: {
    textMessage: '',
    scroll_top: 10000, // 竖向滚动条位置

    currentDialog: {
      // 当前语音输入内容
      create: '04/27 15:37',
      text: '等待说话'
    },
    toView: 'fake', // 滚动位置
    lastId: -1, // dialogList 最后一个item的 id
    curBot: {},
    botType: 0, // 1、内置bot  2、用户bot
    dialogList: []
  },
  onLoad: function(options) {
    this.initChatInputData(options)
    this.setData({
      // 当前机器人的参数配置
      curBot: options,
      botType: options.botType
    })
  },
  onShow: function() {
    this.setData({
      toView: 'fake'
    })
  },
  initChatInputData(options) {
    let systemInfo = wx.getSystemInfoSync()
    chatInput.init(this, {
      systemInfo: systemInfo
    })

    let self = this
    chatInput.setTextMessageListener(function(e) {
      let content = e.detail.value
      if (content && content.length > 0) {
        self.doQueryRequest(content)
      }
    })
  },
  onMyEvent: function(e) {
    this.doQueryRequest(e.detail)
  },
  // 回车或者点击发送消息触发的回调
  doQueryRequest: function(text) {
    const { currentDialog, dialogList } = this.data
    let currentData = {
      ...currentDialog,
      text: text,
      id: this.data.lastId++
    }

    this.setData({
      currentDialog: currentData
    })

    this.scrollToNew()
    this.postText(currentData, dialogList.length)
  },
  // 对话请求
  postText: function(item, index) {
    const { BotId } = this.data.curBot
    let queryText = item.text && item.text.trim()

    let self = this

    wx.cloud.callFunction({
      name: 'TBP_TEXT_PROCESS',
      data: {
        queryText,
        BotId
      },
      success(cloud_callFunction_res) {
        const { result } = cloud_callFunction_res
        console.log('cloud_callFunction_res ', result)
        self.setDialogInfo(result, item, index)
      }
    })
  },

  // 发送回复消息函数
  setDialogInfo: function(resData, item, index) {
    const { ResponseMessage } = resData
    const tmpDialogList = this.data.dialogList.slice(0)

    const GroupList = (ResponseMessage && ResponseMessage.GroupList) || []
    let messageBody =
      GroupList.find(group => group.ContentType === 'text/plain') || {}

    if (!isNaN(index)) {
      const tmpDialog = {
        ...item,
        answer: messageBody.Content,
        id: this.data.lastId
      }

      tmpDialogList[index] = tmpDialog
      this.setData({
        dialogList: tmpDialogList
      })

      this.scrollToNew()
    }
  },
  // 重新滚动到底部
  scrollToNew: function() {
    this.setData({
      toView: this.data.toView
    })
  }
})
