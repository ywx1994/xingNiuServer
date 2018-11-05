
/**
 * Created by litengfei on 2017/1/8.
 */
var app = require("./../core/app.js").instance;
var playerManager = require("../model/PlayerManager");
var UnitTools = require("../core/UnitTools");
module.exports = function () {
    var onStart = function (serverID, serviceType, serverIP, serverPort, custom) {

    }

    var onClientIn = function (session) {

    }

    var onClientOut = function (session) {
        var playerID = session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.playerOffLine(playerID);
        }
    }

    var service = {};
    service.enterRoom = function (playerID,cb) {
        if (UnitTools.isNullOrUndefined(playerID)) {
            cb({ok:false});
            return;
        }
        playerManager.setGameSession(playerID,cb.session);
        cb.session.playerID = playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.enterRoom(playerID,data=>{
                cb({ok:true,playerInfo:data});
            })
        }else {
            cb({ok:false});
        }
    };
    service.playerReady = function (cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.playerReady(playerID);
            cb({ok:true});
        }else {
            cb({ok:false});
        }
    };
    service.playerLeaveRoom = function (cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.playerRequestLeaveRoom(playerID,(err,data)=>{
                if (err) {
                    cb({ok:false,data:err});
                    return;
                }
                playerManager.leaveTable(playerID);
                cb({ok:true,data:data});
            })
        }else {
            cb({ok:false,data:"系统判定您不在房间内"});
        }

    };
    service.destroyRoom = function (cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.playerDestroyRoom(playerID,err=>{
                if (err) {
                    cb({ok:false,err:err});
                }else {
                    cb({ok:true});
                }
            });
        }
    };
    service.destroyRoomChoice = function (data,cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.showDestroyRoomChoice(data);
        }
    };
    service.faceChat = function (num,cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.faceChat(playerID,num);
        }
    };
    service.wordChat = function (num,cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.wordChat(playerID,num);
        }
    };
    service.actionChat = function (data,cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.actionChat(data);
        }
    };
    service.startGame = function (cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.firstPlayerStartGame();
        }
    };
    service.robState = function (value, cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.playerRobState(playerID,value);
        }
    };
    service.playerBet = function (data,cb) {
        var playerID = cb.session.playerID;
        playerManager.setPlayerBet(playerID,data.playerBet);
        console.log("playerBet"+JSON.stringify(data.playerBet));
        if (data.type === 2) {
            let oldCount = playerManager.getXJTZCount(playerID);
            oldCount++;
            playerManager.setXJTZCount(playerID,oldCount);
        }
        var room = playerManager.getTable(playerID);
        if (room) {
            room.onePlayerBet(playerID);
        }
    };
    service.showDownCards = function (data,cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.playerShowDownCards(playerID,data.cardsValue,data.multiple);
        }
    };
    service.tipCards = function (cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.playerRequestTipCards(playerID,(err,data)=>{
                if (err) {
                    cb({ok:false,data:err});
                }else {
                    cb({ok:true,data:data});
                }
            })
        }else {
            cb({ok:false,data:"系统判定您不在房间内"});
        }
    };
    service.compareCardWithBanker = function (cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.playerCompareCardWithBanker(playerID);
        }
    };
    return {
        service: service, onClientIn: onClientIn, onClientOut: onClientOut, onStart: onStart
    };
};