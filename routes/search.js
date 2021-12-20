
const express = require('express');
const router = express.Router();
const request = require('request');
const convert = require('xml-js');

const msgcode = require('../value/message');

//기본변수 선언
let naver_url = 'https://openapi.naver.com/v1/search/book_adv.xml';
const client_id = process.env.NAVER_CLIENT_ID
const client_secret = process.env.NAVER_CLIENT_SECRET
const header = {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret};

// console.log({header});

router.get('/:type/:value', async function(req, res){
    console.log({params:req.params});

    let type = req.params.type; //검색유형
    let value = req.params.value; //값

    let chk_list = ['d_titl', 'd_auth','d_isbn','d_publ'];
    
    let chk=false;
    for(var key in chk_list){
        console.log({key})
        if(type == chk_list[key]){
            chk=true;
            break;
        }
    }
    //해당 타입이 없을경우 에러처리
    if(!chk){
        res.send({
            code:201,
            output: msgcode.code.E201
        })
        return;
    }

    let url = naver_url + `?${type}=${value}`;

    let options = {
        url: url,
        headers: header
    }

    request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
          //console.log(body)
          
          //결과정제하기. 
          // let result = refineNews(data.query, body);
          let result = convert.xml2json(body, {compact: true, spaces: 4})
          // res.end(result);
          res.end(result);
        } else {
          res.status(response.statusCode).end();
          console.log('error = ' + response.statusCode);
          console.log({body})
        }
      });
    
});

module.exports = router;
