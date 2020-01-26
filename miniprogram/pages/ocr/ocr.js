// miniprogram/pages/index/index.js

Page({
  data: {
    windowHeight: "20",
    windowWidth: "400",
    button_text: "上传图片",
    json_data: [],
    json: "",
    text_description_status:"block",
    text_ocr_status:"none",
    image_src: "https://6661-face-20191227-k0fgj-1301006784.tcb.qcloud.la/index/OCR.jpg?sign=92adbb2e248b874f32b1451e97114454&t=1577965702"
  },
  uploadImage() {
    var myThis = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(chooseImage_res) {
        wx.getFileSystemManager().readFile({
          filePath: chooseImage_res.tempFilePaths[0], //选择图片返回的相对路径
          encoding: 'base64', //编码格式
          success(base64_res) {
            wx.showLoading({
              title: '识别中……',
              mask: false,
            })
            wx.cloud.callFunction({
              name: "OCR_Detection",
              data: {
                base64: base64_res.data,
              },
              success(cloud_callFunction_res) {
                console.log(cloud_callFunction_res.result.TextDetections.length)
                if (cloud_callFunction_res.result.TextDetections.length == 0) {
                  wx.hideLoading()
                  wx.showModal({
                    title: '提示',
                    content: '未检测到文字，请重试',
                    success() {
                    }
                  })
                } else {
                  var newarray = []
                  for (var i = 0; i < cloud_callFunction_res.result.TextDetections.length; i++) {
                    newarray.push(cloud_callFunction_res.result.TextDetections[i].DetectedText)
                  }
                  myThis.setData({
                    json_data: newarray,
                    json: JSON.stringify(cloud_callFunction_res),
                    button_text:"重新上传",
                    image_src: chooseImage_res.tempFilePaths[0],  //展示上传的图片
                    text_description_status:"none",
                    text_ocr_status:"block"
                  })
                  wx.hideLoading()
                  wx.showToast({
                    title: '成功',
                    icon: 'success',
                    duration: 200
                  })
                }
              },
            })
          }
        })
      }
    })
  },
  onLoad() {
    var myThis = this;
    wx.getSystemInfo({
      success(getSystemInfo) {
        var windowHeight = (getSystemInfo.windowHeight - 411) / 4
        myThis.setData({
          windowWidth: getSystemInfo.windowWidth,
          windowHeight: windowHeight,
        })
      }
    })
  }
})