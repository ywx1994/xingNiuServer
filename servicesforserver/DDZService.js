
/**
 * Created by litengfei on 2017/1/8.
 */
var app = require("./../core/app.js").instance;
var playerManager = require("../model/PlayerManager");
var UnitTools = require("./../core/UnitTools");
module.exports = function () {
    var onStart = function (serverID, serviceType, serverIP, serverPort, custom) {

    };

    var onClientIn = function (session) {

    };

    var onClientOut = function (session) {
        // var playerID = session.playerID;
        // var room = playerManager.getTable(playerID);
        // if (room) {
        //     room.playerOffLine(playerID);
        // }
    };

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
            room.playerRequestLeaveRoom(playerID,(data)=>{
                if (data) {
                    playerManager.leaveTable(playerID);
                }
                cb({ok:data});
            })
        }else {
            cb({ok:false});
        }
    };
    service.getExitString = function(cb){
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            if (room.creatorID === playerID||room.state > 1) {
                cb({data:'您确定解散房间吗？'});
            }else {
                cb({data:'您确定离开房间吗？'});
            }
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
    service.robState = function (value, cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.playerRobState(playerID,value);
        }
    };
    service.selfPushCards = function (cards, cb) {
        var playerID = cb.session.playerID;
        let handCards = playerManager.getCards(playerID);
        for (let i = 0; i < cards.length; i++) {
            let card = cards[i];
            let flag = false;
            for (let j = 0; j < handCards.length; j++) {
                if (card.id === handCards[j].id) {
                    flag = true;
                    break;
                }
            }
            if (!flag) {
                console.log("有外挂，玩家：" + playerID + "手中没有该张牌");
                return;
            }
        }
        var room = playerManager.getTable(playerID);
        if (room) {
            room.playerPushCard(playerID,cards,(err,data)=>{
                if (err) {
                    cb({ok:false,data:err});
                }else {
                    cb({ok:true,data:data});
                }
            });
        }else {
            cb({ok:false,data:"系统判定您不在房间内"});
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
        }
    };
    service.showRemainCards = function (cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            let handCards = playerManager.getCards(playerID);
            if (handCards.length !== 0) {
                room.playerShowRemainCards(playerID, handCards);
            }
        }
    };
    service.trust = function (cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.showTrust(playerID);
        }
    };
    service.stopTrust = function (cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.stopShowTrust(playerID);
        }
    };
    return {
        service: service, onClientIn: onClientIn, onClientOut: onClientOut, onStart: onStart
    };
};