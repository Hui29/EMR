const express = require('express');
const app = express();
const port = 3002;
const url = require('url');
const crypto = require('crypto'); 
const MyInfoConnector = require('myinfo-connector-nodejs');
const config = require('./config.js'); 
const fs = require('fs');


// 中间件用于获取 authCode 和 state
function extractAuthData(req, res, next) {
  // 获取完整的 URL
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  console.log(`fullUrl = ${fullUrl}`);

  // 解析 URL，获取 query 参数对象
  const urlParts = url.parse(fullUrl, true);
  const queryParams = urlParts.query;

  // 获取URL参数中的授权码
  req.authCode = queryParams.code;
  req.state = queryParams.state;

  next();
}

// 注册中间件
app.use('/callback', extractAuthData);

// 处理回调路由
app.get('/callback', (req, res) => {
  const txnNo = crypto.randomBytes(10).toString("hex");
  
  // 创建 MyInfoConnector 实例
  let connector = new MyInfoConnector(config.MYINFO_CONNECTOR_CONFIG);

  // 使用授权码、状态和交易号获取个人数据
  connector.getMyInfoPersonData(req.authCode, req.state, txnNo)
    .then(personData => {

	  // 提取 uinfin 字段中的 value 值
      const uinfinValue = personData.uinfin.value;
	  
      console.log(JSON.stringify(personData)); // log the data for demonstration purpose only
	  
	  fs.writeFile('personData.txt', JSON.stringify(personData, null, 2), (err) => {
        if (err) {
          console.error('Error writing personData.txt:', err);
          return;
        }
        console.log('personData.txt has been saved.');
      });
	  
      // 追加 uinfinValue 到 Pairs.txt 文件
      fs.appendFile('Pairs.txt', `${uinfinValue}\n`, (err) => {
        if (err) {
          console.error('Error appending to Pairs.txt:', err);
          return;
        }
        console.log('uinfinValue has been appended to Pairs.txt.');
      });
	  
	  //res.redirect('http://localhost:3000');
	  res.send('<script>window.location.href = "http://localhost:3000";</script>');

    })
    .catch(error => {
      console.log("---MyInfo NodeJs Library Error---".red);
      console.log(error);
      res.status(500).send({
        "error": error
      });
    });
});





app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
