const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

//config 읽기
const dataBuffer = fs.readFileSync(path.join(__dirname, "..", "config/config.json"));
const dataJSON = dataBuffer.toString()
var config = JSON.parse(dataJSON);

// IP 주소 기반 접근 제어
var ipfilter = require('express-ipfilter').IpFilter;
var ips=['::ffff:*', '::1','::ffff:127.0.0.1'];

//개발자용 db정보
config = config.development2;
//config = config.development3;
const setting = {
    host: config.host,
    user: config.username,
    password: config.password,
    database: config.database,
    connectionLimit: 4,
    dateStrings: 'date'
}

const pool = mysql.createPool(setting);

function getPool() {
    return pool;
}

function errorCode(output) {
    return {
        code: 500,
        rows: -1,
        output: output
    };
}

function successCode(rows,output) {
    return {
        code: 200,
        rows: rows,
        output: output
    };
}

module.exports = {
    getPool,
    errorCode,
    successCode,
    ipfilter,
    ips,
}