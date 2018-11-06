var UnitTools = require("./../core/UnitTools.js");
var express = require("express");
var app = express();
var myDB = require('./../core/db.js');
var Config = require("../core/Config.js");
var IDs = require("./../core/IDs.js");
var playerManager = require("../model/PlayerManager.js");
myDB.connect(Config.getServerConfig().mysql);
var ids = new IDs();
ids.initFromConfig();
var onlinePlayer = 0;
//获取本地时间
const getLocalDateStr = function () {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let dateStr = year + '-' + month + '-' + day + '  ' + hours + ':' + minutes + ':' + seconds;
    return dateStr;
};
const getClientIp = function (req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress || '';
};
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", 'text\/plain; charset=utf-8');
    next();
});


//注册或更新玩家
app.get("/weixinRegister/",async function (req, res) {
    let uid = req.query.uid;
    let nickName = req.query.nickName;
    let avatarUrl = req.query.avatarUrl;
    let sex = req.query.sex;
    let city = req.query.city;
    let platform = req.query.platform;
    let ip = getClientIp(req).match(/\d+.\d+.\d+.\d+/);
    ip = ip ? ip.join('.') : null;
    let playerInfo = await myDB.getAccountInfoByUid(uid);
    if (playerInfo) {
        if (playerInfo.length !== 0) {
            let loginDate = getLocalDateStr();
            let updateResult = await myDB.upDateAccountInfo(uid,loginDate,ip,platform,nickName,avatarUrl,sex,city);
            if (updateResult) {
                res.send({ok:true,accountID:playerInfo[0].account_id,hallIP:"ws://127.0.0.1:39401"});
            }
        }else {
            let accountID = await ids.getID();
            let diamond = 12;
            let gold = 1000;
            let createDate = getLocalDateStr();
            let registerResult = await myDB.createAccount(uid,accountID,ip,createDate,platform,nickName,avatarUrl,sex,city,diamond,gold);
            if (registerResult) {
                res.send({ok:true,accountID:accountID,hallIP:"ws://127.0.0.1:39401"});
            }
        }
    }else {
        res.send({ok:false});
    }
});
//登录
app.get("/weixinlogin/",async function (req, res) {
    let uid = req.query.uid;
    console.log(uid);
    if (uid === "zzz"){    /**测试用*/
        uid = uid+onlinePlayer;
    }
    let platform = req.query.platform;
    let ip = getClientIp(req).match(/\d+.\d+.\d+.\d+/);
    ip = ip ? ip.join('.') : null;

    let loginDate = getLocalDateStr();
    let playerInfo = await myDB.getAccountInfoByUid(uid);
    if (playerInfo && playerInfo.length !== 0) {
        let updateResult = await myDB.upDateLoginInfo(uid,loginDate,ip,platform);
        if (updateResult) {
            res.send({ok:true,accountID:playerInfo[0].account_id,hallIP:"ws://127.0.0.1:39401"});
            onlinePlayer++;/**测试用*/
            console.log("登录用户："+onlinePlayer);
        }
    }else {
        res.send({ok:false});
    }
});
app.listen(3001);