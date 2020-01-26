// 云函数入口文件
const cloud = require('wx-server-sdk') //小程序云开发SDK
const tencentcloud = require("tencentcloud-sdk-nodejs"); //腾讯云API 3.0 SDK
cloud.init() //云开发初始化
var synDetectCelebrity = function (url) {
  const TiiaClient = tencentcloud.tiia.v20190529.Client;
  const models = tencentcloud.tiia.v20190529.Models;

  const Credential = tencentcloud.common.Credential;
  const ClientProfile = tencentcloud.common.ClientProfile;
  const HttpProfile = tencentcloud.common.HttpProfile;

  let cred = new Credential("AKIDvjP2BDp4lHdt1zqUox0sZ6SgjQwG6NCw", "mW8ZpvqgOcpslT0LXYUEnGIDwTp0zOf7");	//这里填入你的SecretID和Secretkey,在腾讯云账号信息可以找到
  let httpProfile = new HttpProfile();
  httpProfile.endpoint = "tiia.tencentcloudapi.com";
  let clientProfile = new ClientProfile();
  clientProfile.httpProfile = httpProfile;
  let client = new TiiaClient(cred, "ap-guangzhou", clientProfile);

  let req = new models.DetectCelebrityRequest();
  let params = '{"ImageUrl":"' + url + '","NeedFaceAttributes":1}' //拼接参数
  req.from_json_string(params);
  return new Promise(function (resolve, reject) { //构造异步函数
    client.DetectCelebrity(req, function (errMsg, response) {
      if (errMsg) {
        reject(errMsg)
      } else {
        resolve(response);
      }
    })
  })
}

exports.main = async (event, context) => {
  const data = event
  const fileList = [data.fileID] //读取来自客户端的fileID
  console.log('cloud',fileList)
  const result = await cloud.getTempFileURL({
    fileList, //向云存储发起读取文件临时地址请求
  })
  const url = result.fileList[0].tempFileURL
  datas = await synDetectCelebrity(url) //调用异步函数，向腾讯云API发起请求
  return datas
}