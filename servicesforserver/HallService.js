/**
 * Created by youwenxing on 2018/9/17.
 */
var app = require("./../core/app.js").instance;
var UnitTools = require("./../core/UnitTools.js");
var Config = require("../core/Config.js");
var playerManager = require("./../model/PlayerManager.js");
var roomController = require("../games/share/RoomManager.js");
var myDB = require("../core/db");
myDB.connect(Config.getServerConfig().mysql);
module.exports = function () {

    var onStart = function (serverID, serviceType, serverIP, serverPort, custom) {

    };

    var onClientIn = function (session) {

    };

    var onClientOut = function (session) {
        if (!playerManager.hasPlayer(session.playerID)) return;
        if (session === playerManager.getSession(session.playerID)){
            playerManager.setIsLogin(session.playerID,false);//设置非登录状态
        }
    };
    /**-----------------------------------------------------*/
    var service = {};


    /**
     * 账号登录
     * @param playerID account
     * @param cb ok false 表示需要重新登录
     */
    service.login = function (playerID,cb) {
        if (UnitTools.isNullOrUndefined(playerID)) {
            cb({ok:false});//连接大厅失败
            return;
        }
        playerManager.setIsLogin(playerID,true);//设置登录状态
        playerManager.setSession(playerID,cb.session);//保存session到玩家信息
        cb.session.playerID = playerID;//保存玩家id到session
        cb({ok:true});//连接大厅成功
    };

    /**
     * 创建房间
     * @param roomInfo 房间配置信息
     * @param cb
     */
    service.createRoom = async function (roomInfo,cb) {
        var playerID = cb.session.playerID;
        var isLogin = playerManager.getIsLogin(playerID);
        if (!isLogin){
            cb({ok:false});
            return;
        }

        await roomController.createRoom(playerID,roomInfo,(err,data)=>{
            if (err) {
                cb({ok:false,err:err});
            }else {
                cb({ok:true,err:false,roomID:data});
            }
        });
    };
    /**
     * 加入房间
     * @param roomID
     * @param cb
     */
    service.joinRoom = async function (roomID, cb) {
        var playerID = cb.session.playerID;
        if(!playerManager.getIsLogin(playerID)){
            cb({ok:false});
            return;
        }
        await roomController.joinRoom(playerID,roomID,(err,data)=>{
            if (err) {
                cb({ok:false,err:err});
            }else {
                let gameUrl = '';
                let gameService = undefined;
                if (data.config.gameType === '斗地主') {
                    gameService = app.getRandomService("DDZService");
                    gameUrl = "ws://"+gameService.ip+":"+gameService.port;
                } else if (data.config.gameType  === '五醉牛') {
                    gameService = app.getRandomService("NiuNiuService");
                    gameUrl = "ws://"+gameService.ip+":"+gameService.port;
                } else if (data.config.gameType  === '拼三张') {
                    gameService = app.getRandomService("PSZService");
                    gameUrl = "ws://"+gameService.ip+":"+gameService.port;
                }
                playerManager.setGameUrl(playerID,gameUrl,data);
                cb({ok:true,err:false,gameUrl:gameUrl,roomConfig:data});
            }
        });
    };
    //刷新玩家信息
    service.refreshSelfInfo = async function (cb) {
        var playerID = cb.session.playerID;
        if(!playerManager.getIsLogin(playerID)){
            cb({ok:false});
            return;
        }
        var accountInfo = await myDB.getAccountInfoByAccount(playerID);
        var userInfo = await myDB.getUserInfoByAccount(playerID);
        playerManager.setInformation(playerID,accountInfo[0],userInfo[0]);
        if (accountInfo && accountInfo.length !==0) {
            cb({ok:true,info:playerManager.getInformation(playerID)});
            return;
        }
        cb({ok:false});
    };
    //验证邀请码
    service.inviteCode = async function (code,cb) {
        var playerID = cb.session.playerID;
        if(!playerManager.getIsLogin(playerID)){
            cb({ok:false});
            return;
        }
        let ranking = await myDB.getRankingByAccountID(code);
        if (ranking && ranking.length !== 0) {
            let result = await myDB.upDateUserRanking(playerID,ranking[0].ranking);
            if (result) {
                cb({ok:true,data:ranking[0].ranking});
            }
        }else {
            cb({ok:false,data:"无此邀请码"});
        }
    };
    service.systemInfo = async function (cb) {
        let info = await myDB.getSystemInfo();
        if (info && info.length !== 0){
            cb({ok:true,info:info[0]});
        }else {
            cb({ok:false});
        }
    };
    service.gameRecord = async function (type,cb) {
        var playerID = cb.session.playerID;
        if(!playerManager.getIsLogin(playerID)){
            cb({ok:false});
            return;
        }
        let record = await myDB.getGameRecord(type);
        if (record) {
            let gameRecords = [];
            for (let i = 0; i < record.length; i++) {
                let playersJson = JSON.parse(record[i].players);
                // console.log('t_ddzgamescore 中的players=' + playersJson + '；playersJson的长度：' + playersJson.length);
                for (let j = 0; j < playersJson.length; j++) {
                    if (playerID === playersJson[j]) {//31312204
                        // console.log("找到一条游戏记录。。。");
                        let oneRecord = record[i];
                        // console.log('oneRecord:' + JSON.stringify(oneRecord));
                        gameRecords.push(oneRecord);
                        break;
                    }
                }
            }
            cb({ok:true,record:gameRecords});
            return;
        }
        cb({ok:true,record:[]});
    };
    service.logout = function (cb) {
        var playerID = cb.session.playerID;
        if(!playerManager.getIsLogin(playerID)){
            cb({ok:false});
            return;
        }
        playerManager.deletePlayer(playerID);
        cb({ok:true});
    };
    return {
        service: service, onClientIn: onClientIn, onClientOut: onClientOut, onStart: onStart
    };
};