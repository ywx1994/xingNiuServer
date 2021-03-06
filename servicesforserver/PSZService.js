
/**
 * Created by litengfei on 2017/1/8.
 */
var app = require("./../core/app.js").instance;
var playerManager = require("../model/PlayerManager");
var UnitTools = require("../core/UnitTools");
module.exports = function () {
    var onStart = function (serverID, serviceType, serverIP, serverPort, custom) {

    };

    var onClientIn = function (session) {

    };

    var onClientOut = function (session) {
        var playerID = session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.playerOffLine(playerID);
        }
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
    service.startGame = function (cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.firstPlayerStartGame();
        }
    };
    service.abandonCards = function (cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            playerManager.setIsLookCards(playerID,false);
            playerManager.setIsDisCard(playerID,true);
            room.playerAbandon(playerID);
        }
    };
    service.lookCards = function (cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        var cards = playerManager.getCards(playerID);
        if (cards) {
            cb({ok:true,data:{seatIndex:playerManager.getSeatIndex(playerID),cards:cards}});
        }else {
            cb({ok:false});
        }
        if (room) {
            room.lookCards(playerID);
        }
    };
    service.getComparePlayer = function (cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.getComparePlayer(playerID,data=>{
                cb({ok:true,data:data});
            })
        }else {
            cb({ok:false});
        }
    };
    service.compareCards = function (accountID,cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.compareCards(playerID,accountID);
            room.addChips(playerID,-1,data=>{
                playerManager.setChips(playerID,playerManager.getChips(playerID)+data);
            });
        }
    };
    service.addChips = function (chips,cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            room.addChips(playerID,chips,data=>{
               playerManager.setChips(playerID,playerManager.getChips(playerID)+data);
            });
        }
    };
    service.YGDD = function (flag, cb) {
        var playerID = cb.session.playerID;
        var room = playerManager.getTable(playerID);
        if (room) {
            playerManager.setYGDD(playerID,flag);
        }
    };
    return {
        service: service, onClientIn: onClientIn, onClientOut: onClientOut, onStart: onStart
    };
};