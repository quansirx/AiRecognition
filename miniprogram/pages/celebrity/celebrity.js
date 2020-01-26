Page({
  data: {
    Name: "请上传照片",
    BasicInfo: "请上传照片",
    Confidence: "未知(70+置信度为可靠)",
    
    image_src: "https://quansirx.club/image01/face02.jpg"
  },
  UploadImage() {
    var random = Date.parse(new Date()) + Math.ceil(Math.random() * 1000)
    var myThis = this
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        wx.showLoading({
          title: '加载中...',
        });
        const tempFilePaths = res.tempFilePaths[0]
        console.log(tempFilePaths)
        myThis.setData({
          image_src: res.tempFilePaths[0]
        });
        var uploadTask = wx.cloud.uploadFile({
          cloudPath: random + '.png',
          filePath: tempFilePaths, // 文件路径
          success: res => {
            console.log(res.fileID)
            wx.cloud.callFunction({
              name: 'Celebrity-tag',
              data: {
                fileID: res.fileID
              },
              success: res => {
                wx.hideLoading()
                wx.showToast({
                  title: '成功',
                  icon: 'success',
                  duration: 500
                })
                myThis.setData({
                  Name: res.result.Faces[0].Name,
                  BasicInfo: res.result.Faces[0].BasicInfo,
                  Confidence: res.result.Faces[0].Confidence,
                })
                
              },
            })
          },
          fail: err => {
          }
        })
        uploadTask.onProgressUpdate((res) => {
          myThis.setData({
            progress: res.progress //上传进度
          })
        })
      }
    })
  },
  onLoad: function (options) {
    wx.cloud.init({
      env: 'test-f97abe'
    })
  }
})