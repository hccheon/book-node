const express = require('express');
const controller = require('../controllers/controller_book');
const common = require('../config/common');
const msg = require('../value/message');
const router = express.Router();

/**
 * C PUT
 * R GET 전체, 검색은 isbm, 책제목 또는 
 * U POST
 * D DELETE 
 */

//책 리스트 가져오기 
router.get('/', common.ipfilter(common.ips, {mode: 'allow'}), async (req, res) => {
    try{
        let out = await controller.book_get_all();
        res.send(out);
        return;
    } catch (err) {
        
        console.log({err:err});
    }
});

//책 조건 검색
router.get('/:type/:value', common.ipfilter(common.ips, {mode: 'allow'}), async (req, res) => {
    try{
        console.log({req_params:req.params})
        var type = req.params.type;
        var value = req.params.value;
        var chk_params_ok = false;

        if( ((type=="isbn") || (type=='title') || (type=='author') || (type=='publisher'))){
            chk_params_ok = true;
        }
        if(!chk_params_ok){
            res.send({
                code:200,
                rows:-1,
                output: msg.code.S005
            })
            return;
        }

        let out = await controller.book_get_by_type(type, value);
        res.send(out);
        return;
    } catch (err) {
        
        console.log({err:err});
    }
});

//책 추가
router.post('/', common.ipfilter(common.ips, {mode: 'allow'}), async (req, res)=>{
    console.log({req_body: req.body});
    
    try{
        let data = req.body,
            result = {};

        if(
            (data.title==undefined) || (data.author==undefined) || (data.publisher==undefined) ||
            (data.isbn==undefined) || (data.link==undefined)  
        ){
            res.send(common.successCode(0,"파라미터를 확인해주세요."));
            return;
        }else{
            //missing
            // if(valid.missingValidation(data)){
            //     result = {
            //         code: 500,
            //         rows: 0,
            //         output: 'missing값을 확인하세요.'
            //     }
            //     res.send(result);
            //     return;
            // }
        }

        let out = await controller.book_create_book(data.title, data.author, data.publisher, data.isbn, data.link);

        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//책 삭제(with isbn)
router.delete('/', common.ipfilter(common.ips, {mode: 'allow'}), async (req, res)=>{
    console.log({req_body: req.body});
    try{
        let data = req.body;

        if(data.isbn == undefined || data.isbn =="") { // 파라미터값이 undefined 경우
            res.send(common.errorCode(msg.code.S002)); 
            return;
        }

        /* if(valid.missingValidation(data)) { // 파라미터값이 null 일 경우
            res.send(common.errorCode(msg.code.S003)); 
            return;
        } */

        let out = await controller.book_delete_book(data.isbn);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//책 수정
router.post('/modify', common.ipfilter(common.ips, {mode: 'allow'}), async (req, res)=>{
    console.log({req_body: req.body});
    
    try{
        let data = req.body,
            result = {};

        if(
            (data.title==undefined) || (data.author==undefined) || (data.publisher==undefined) ||
            (data.isbn==undefined) || (data.link==undefined) || (data._id==undefined)   
        ){
            res.send(common.successCode(0,"파라미터를 확인해주세요."));
            return;
        }else{
            //missing
            // if(valid.missingValidation(data)){
            //     result = {
            //         code: 500,
            //         rows: 0,
            //         output: 'missing값을 확인하세요.'
            //     }
            //     res.send(result);
            //     return;
            // }
        }

        let out = await controller.book_modify_book(data.title, data.author, data.publisher, data.isbn, data.link, data._id);

        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//연구 정보 수정(all columns)
router.post('/changeAll', common.ipfilter(common.ips, {mode: 'allow'}), async (req, res)=>{
    console.log({req_body: req.body});
    try{
        let data = req.body;

        if((data.PRTNO==undefined) || (data.TITLE==undefined) || (data.SPONSORID==undefined) || (data.SAPPL==undefined) || (data.SSEX==undefined) || (data.STARGET==undefined) || (data.SACTIVE==undefined) || (data.SNUM==undefined)) {
            res.send(common.errorCode('입력값을 확인하세요.'));
            return;
        }

        if(valid.missingValidation(data)) {
            res.send(common.errorCode('missing값을 확인하세요.'));
            return;
        }

        let out = await controller.study_change_allColumns(data.PRTNO, data.TITLE, data.SPONSORID, data.SAPPL, data.SSEX, data.STARGET, data.SACTIVE, data.SNUM);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//특정 연구자가 참여한 모든 연구 가져오기 (with INVMAIL)
router.post('/getStudiesOfInvestigator', common.ipfilter(common.ips, {mode: 'allow'}), async (req, res)=>{
    console.log({req_body: req.body});
    try{
        let data = req.body;

        if(data.INVMAIL == undefined) {
            res.send(common.errorCode('입력값을 확인하세요.'));
            return;
        }

        if(valid.missingValidation(data)) {
            res.send(common.errorCode('missing값을 확인하세요.'));
            return;
        }

        let out = await controller.study_getStudiesOfInvestigator(data.INVMAIL);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

module.exports = router;
