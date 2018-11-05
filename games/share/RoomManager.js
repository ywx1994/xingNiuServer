const UnitTools = require("../../core/UnitTools.js");
const DDZRoom = require("../ddz/Room");
const NNRoom = require("../niuniu/Room");
const  PSZRoom = require("../psz/Room");
const Map = require("../../core/Map");
const myDB = require('../../core/db.js');
var IDs = require("../../core/IDs.js");
playerManager = require("../../model/PlayerManager");
var roomIDs = new IDs();
roomIDs.initFromRoomConfig();
class RoomManager {
    constructor(){
        this.roomList = new Map();
    }
    async createRoom(playerID,roomConfig,cb){
        if (roomConfig.roomRate.substr(0, 2) !== 'AA') {
            console.log('\n非AA支付，要扣钱！');
            let diamondCount = await myDB.getPlayerDiamondCount(playerID);
            let hasMoney = Number(diamondCount[0].diamond);
            let needDiamond = UnitTools.getNumFromStr(roomConfig.roomRate);
            if (hasMoney < needDiamond) {
                cb('您的钻石不足!');
                return;
            }
            hasMoney -= needDiamond;
            myDB.upDateDiamondCountByAccountID(playerID,hasMoney);
            console.log('\n** createRoom ** player.diamondCount = ' + diamondCount[0]);
        }
        var roomID = await roomIDs.getRoomID();
        console.log(roomID);
        if (roomConfig.gameType === '斗地主') {
            this.roomList.setKeyValue(roomID,new DDZRoom(playerID,roomID,roomConfig));
        } else if (roomConfig.gameType === '五醉牛') {
            this.roomList.setKeyValue(roomID,new NNRoom(playerID,roomID,roomConfig));
        } else if (roomConfig.gameType === '拼三张') {
            this.roomList.setKeyValue(roomID,new PSZRoom(playerID,roomID,roomConfig));
        }
        cb(null,roomID);
    }
    async joinRoom(playerID,roomID,cb){
        if (this.roomList.hasKey(roomID)) {
            let room = this.roomList.getNotCreate(roomID);
            let GJSZ = room.roomConfig.GJSZ;
            if (GJSZ !== null && GJSZ !== undefined) {
                for (let i = 0, len = GJSZ.length; i < len; i++) {
                    if (GJSZ[i] === '开始后禁止加入' && room.startGameTime !== undefined) {
                        if (cb) {
                            cb('游戏开始后禁止加入!');
                        }
                        return;
                    }
                }
            }
            if (room.roomConfig.roomRate.substr(0, 2) === 'AA') {
                console.log('\nAA开房，需判断自身的钱是否足够！');
                var diamondCount = await myDB.getPlayerDiamondCount(playerID);
                let needDiamond = UnitTools.getNumFromStr(room.roomConfig.roomRate);
                console.log('\n diamondCount = ' + diamondCount + ' ; needDiamond = ' + needDiamond);
                if (diamondCount < needDiamond) {
                    if (cb) {
                        cb('钻石不足，请充值!');
                    }
                    if (playerID === room.creatorID) {
                        console.log('是房主但钻石不够时，解散房间');
                        this.roomList.remove(room.roomID);
                    }
                    return;
                }
            }
            room.joinPlayer(playerID,RoomManager.g,(data)=>{
                if (data.data !== "success"){
                    cb(data.data);
                } else {
                    playerManager.enterTable(playerID,room,data.seatIndex);
                    cb(null,{config:room.roomConfig,roundCount:room.roundCount});
                }
            });
            return;
        }
        cb('房间' + roomID + '不存在!');
    }
    searchRoomList(playerID,cb) {
        let roomList = [];
        this.roomList.forEach((roomID, room) => {
            if (room.creatorID === playerID) {
                roomList.push(room.getConfig());
            }
        });
        cb(roomList);
    }
    deleteRoom(roomID) {
        this.roomList.remove(roomID);
    };
}
RoomManager.g = new RoomManager();
module.exports = RoomManager.g;