var Carder = require("./Carder.js");
var playerManager = require("./../../model/PlayerManager.js");
var UnitTools = require("../../core/UnitTools");
var myDB = require("../../core/db");
/**
 * 生成座位号
 * @param playerList
 * @returns {number}
 */
const getSeatIndex = function (playerList) {
    if (playerList.length === 0) {
        return 0;
    }
    if (playerList.length === 6) {
        return -1;
    }
    for (let i = 0; i < 6; i++) {
        let flag = false;
        for (let j = 0; j < playerList.length; j++) {
            if (i === playerManager.getSeatIndex(playerList[j])) {
                flag = true;
                break;
            }
        }
        if (!flag) {
            return i;
        }
    }
};
/**
 * 房间的状态
 * @type {{Invalide: number, WaitingReady: number, GameStart: number, PushCard: number}}
 */
const roomState = {
    Invalide: -1,        //无效
    WaitingReady: 1,    //等待准备
    GameStart: 2,       //游戏开始
    RobBanker: 3,       //抢庄
    PushCard: 4,        //发牌
    CompareCard: 5,    //比牌
    GameOver: 6,       //游戏结束
};
/**
 * 获取本地时间
 * @returns {string}
 */
const getLocalDateStr = function () {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let dateStr = year + '/' + month + '/' + day + '  ' + hours + ':' + minutes + ':' + seconds;
    return dateStr;
};
/**
 * 获取一个小于num的正整数
 * @param num
 */
const getRandomNum = function (num) {
    let randomNum = Math.floor(Math.random() * num);
    console.log('\n获取到的随机正整数为：' + randomNum);
    return randomNum;
};

class Room {
    constructor(playerID, roomID, roomConfig) {
        this.roomID = roomID;
        this.roomConfig = roomConfig;
        this.creatorID = playerID;
        this.type = roomConfig.gameType;//游戏类型
        this.playerList = [];                //玩家列表
        this.readyPlayerList = [];           //已准备玩家列表
        this.startPlayerList = [];           //已开始游戏玩家列表
        this.firstPlayerID = undefined;     //第一个进入房间者
        this.state = roomState.Invalide;    //房间状态
        this.carder = Carder();              //管理牌
        this.nnCards = undefined;          //单局所有玩家的牌
        this.robBankerList = [];            //参与抢庄的玩家列表
        this.robCount = 0;                  //抢庄次数（抢与不抢都记录）
        this.banker = undefined;           //庄家
        this.player = [];                    //闲家
        this.betCount = 0;                  //收到闲家下注的次数
        this.showDownCount = 0;            //所有玩家亮牌的次数
        this.compareCount = 0;             //比牌次数
        this.nnPlayer = [];                //牛牛上庄时，用于保存上局牛牛的玩家
        this.isPlaying = false;            //是否在游戏中的标志
        this.roundCount = 0;              //开始游戏的局数
        this.startGameTime = undefined;  //游戏开局时间
        this.gameRecord = {};             //游戏记录(包含_gameInfo)
        this.gameInfo = {gameItemContents: [], userContents: []};         //游戏具体记录
        this.chooseDestroyRoomCount = 0;    // 已选择是否解散房间的次数
        this.agreeDestroyRoomCount = 0;     // 同意解散的人数
        this.XJTZFlag = false;              // XJTZFlag 闲家推注标志
        this.setState(roomState.WaitingReady);
    }

    /**
     * 设置房间状态
     * @param state
     * @param flag
     */
    async setState(state, flag) {
        console.log("------ state = " + state + " ;  _state = " + this.state);
        if (state === this.state) {
            return;
        }
        switch (state) {
            case roomState.WaitingReady:
                this.state = state;
                break;
            case roomState.GameStart:
                this.state = state;
                this.roundCount++;
                if (this.startGameTime === undefined) {
                    this.startGameTime = getLocalDateStr();
                }
                this.isPlaying = true;
                this.startPlayerList = this.readyPlayerList;
                this.readyPlayerList = [];
                this.player = [];
                if (this.roomConfig.roomRate.substr(0, 2) === 'AA') {
                    console.log('游戏开始了，这是AA支付，每位玩家都应扣除相应的钻石');
                    let needDiamond = UnitTools.getNumFromStr(this.roomConfig.roomRate);
                    for (let i = 0, len = this.startPlayerList.length; i < len; i++) {
                        let playerID = this.startPlayerList[i];
                        if (!playerManager.getIsGaming(playerID)) {
                            playerManager.setIsGaming(playerID, true);
                            console.log("playerID:" + playerID);
                            let diamondCount = await myDB.getPlayerDiamondCount(playerID);
                            let hasMoney = Number(diamondCount[0].diamond);
                            hasMoney -= needDiamond;
                            myDB.upDateDiamondCountByAccountID(playerID, hasMoney);
                        }
                    }
                }
                for (let j = 0; j < this.playerList.length; j++) {
                    playerManager.gameSend(this.playerList[j], "gameStart", {startPlayerList: this.startPlayerList});
                }
                setTimeout(() => {
                    let smallType = this.roomConfig.smallType;
                    console.log('\n看看玩的是什么牛牛：' + smallType);
                    if (smallType === '牛牛上庄' || smallType === '固定庄家') {
                        this.setState(roomState.RobBanker);
                    }

                    if (smallType === '明牌抢庄') {
                        this.setState(roomState.PushCard, 'pushFour');
                    }

                    if (smallType === '通比牛牛') {
                        this.setState(roomState.RobBanker);
                        let playerBet = Number(this.roomConfig.basicScore);
                        for (let i = 0, len = this.playerList.length; i < len; i++) {
                            playerManager.gameSend(this.playerList[i], "showPlayerBet", playerBet);//展示默认玩家下注（游戏规则中定下的）
                        }
                        this.setState(roomState.PushCard, 'pushAll');
                    }
                }, 500);

                break;
            case roomState.RobBanker:
                this.state = state;
                let smallType = this.roomConfig.smallType;
                if (this.roundCount === 1) {
                    let GJSZ = this.roomConfig.GJSZ;
                    for (let i = 0, len = GJSZ.length; i < len; i++) {
                        if (GJSZ[i] === '闲家推注') {
                            this.XJTZFlag = true;
                        }
                    }
                }
                switch (smallType) {
                    case '牛牛上庄':
                        //第一回随机一个庄家
                        if (this.roundCount === 1) {
                            this.banker = this.startPlayerList[getRandomNum(this.startPlayerList.length)];
                            playerManager.setIsBanker(this.banker, true);
                            console.log('\n牛牛上庄的庄家是：' + JSON.stringify(this.banker));
                            for (let i = 0; i < this.playerList.length; i++) {
                                //sendShowBanker中type为1：客户端有跑马灯效果，2：没有效果，只是庄家的图片交换一下，3：庄家不变
                                playerManager.gameSend(this.playerList[i], "showBanker", {
                                    bankerID: this.banker,
                                    type: 1
                                });
                            }
                        }
                        //当玩家中有牛牛出现，该玩家坐庄
                        if (this.roundCount > 1 && this.nnPlayer.length !== 0) {
                            playerManager.setIsBanker(this.banker, false);
                            this.banker = this.nnPlayer[getRandomNum(this.nnPlayer.length)];
                            playerManager.setIsBanker(this.banker, true);
                            playerManager.setSingleScore(this.banker, 0);
                            console.log('\n牛牛上庄(有牛牛)的庄家是：' + JSON.stringify(this.banker));
                            if (this.XJTZFlag) {
                                for (let i = 0; i < this.playerList.length; i++) {
                                    //sendShowBanker中type为1：客户端有跑马灯效果，2：没有效果，只是庄家的图片交换一下，3：庄家不变
                                    playerManager.gameSend(this.playerList[i], "showBanker", {
                                        bankerID: this.banker,
                                        type: 2,
                                        lastScore: playerManager.getSingleScore(this.playerList[i]),
                                        XJTZCount: playerManager.getXJTZCount(this.playerList[i])
                                    });
                                    if (playerManager.getXJTZCount(this.playerList[i]) === 1) {
                                        playerManager.setXJTZCount(this.playerList[i], 0);
                                    }
                                }
                            } else {
                                for (let i = 0; i < this.playerList.length; i++) {
                                    //sendShowBanker中type为1：客户端有跑马灯效果，2：没有效果，只是庄家的图片交换一下，3：庄家不变
                                    playerManager.gameSend(this.playerList[i], "showBanker", {
                                        bankerID: this.banker,
                                        type: 2
                                    });
                                }
                            }
                        }
                        //庄家坐住不变
                        if (this.roundCount > 1 && this.nnPlayer.length === 0) {
                            if (this.XJTZFlag) {
                                for (let i = 0; i < this.playerList.length; i++) {
                                    //sendShowBanker中type为1：客户端有跑马灯效果，2：没有效果，只是庄家的图片交换一下，3：庄家不变
                                    playerManager.gameSend(this.playerList[i], "showBanker", {
                                        bankerID: this.banker,
                                        type: 3,
                                        lastScore: playerManager.getSingleScore(this.playerList[i]),
                                        XJTZCount: playerManager.getXJTZCount(this.playerList[i])
                                    });
                                    if (playerManager.getXJTZCount(this.playerList[i]) === 1) {
                                        playerManager.setXJTZCount(this.playerList[i], 0);
                                    }
                                }
                            } else {
                                for (let i = 0; i < this.playerList.length; i++) {
                                    //sendShowBanker中type为1：客户端有跑马灯效果，2：没有效果，只是庄家的图片交换一下，3：庄家不变
                                    playerManager.gameSend(this.playerList[i], "showBanker", {
                                        bankerID: this.banker,
                                        type: 3
                                    });
                                }
                            }
                        }
                        this.nnPlayer = [];
                        break;
                    case '固定庄家':
                        if (this.banker === undefined) {
                            for (let i = 0; i < this.startPlayerList.length; i++) {
                                if (this.startPlayerList[i] === this.firstPlayerID) {
                                    this.banker = this.startPlayerList[i];
                                    playerManager.setScore(this.banker, Number(this.roomConfig.SZFS));
                                    break;
                                }
                            }
                            console.log('\n规则的上庄分数：' + this.roomConfig.SZFS);
                            console.log('\n庄家的分数为：' + this.banker.score);
                            for (let i = 0; i < this.playerList.length; i++) {
                                //sendShowBanker中type为1：客户端有跑马灯效果，2：没有效果，只是庄家的图片交换一下，3：庄家不变
                                playerManager.gameSend(this.playerList[i], "showBanker", {
                                    bankerID: this.banker,
                                    bankerScore: playerManager.getScore(this.banker),
                                    type: 2
                                });
                            }
                        } else {
                            if (this.XJTZFlag) {
                                for (let i = 0; i < this.playerList.length; i++) {
                                    //sendShowBanker中type为1：客户端有跑马灯效果，2：没有效果，只是庄家的图片交换一下，3：庄家不变
                                    playerManager.gameSend(this.playerList[i], "showBanker", {
                                        bankerID: this.banker,
                                        type: 3,
                                        lastScore: playerManager.getSingleScore(this.playerList[i]),
                                        XJTZCount: playerManager.getXJTZCount(this.playerList[i])
                                    });
                                    if (playerManager.getXJTZCount(this.playerList[i]) === 1) {
                                        playerManager.setXJTZCount(this.playerList[i], 0);
                                    }
                                }
                            } else {
                                for (let i = 0; i < this.playerList.length; i++) {
                                    //sendShowBanker中type为1：客户端有跑马灯效果，2：没有效果，只是庄家的图片交换一下，3：庄家不变
                                    playerManager.gameSend(this.playerList[i], "showBanker", {
                                        bankerID: this.banker,
                                        type: 3
                                    });
                                }
                            }
                        }

                        break;
                    case '自由抢庄':
                        if (this.banker !== undefined) {
                            playerManager.setIsBanker(this.banker, false);
                        }
                        if (this.robBankerList.length !== 0) {
                            this.banker = this.robBankerList[getRandomNum(this.robBankerList.length)];
                            playerManager.setIsBanker(this.banker, true);
                            playerManager.setSingleScore(this.banker, 0);
                        } else {
                            this.banker = this.startPlayerList[getRandomNum(this.startPlayerList.length)];
                            playerManager.setIsBanker(this.banker, true);
                            playerManager.setSingleScore(this.banker, 0)
                        }
                        if (this.XJTZFlag) {
                            for (let i = 0; i < this.playerList.length; i++) {
                                //sendShowBanker中type为1：客户端有跑马灯效果，2：没有效果，只是庄家的图片交换一下，3：庄家不变
                                playerManager.gameSend(this.playerList[i], "showBanker", {
                                    bankerID: this.banker,
                                    type: 1,
                                    lastScore: playerManager.getSingleScore(this.playerList[i]),
                                    XJTZCount: playerManager.getXJTZCount(this.playerList[i])
                                });
                                if (playerManager.getXJTZCount(this.playerList[i]) === 1) {
                                    playerManager.setXJTZCount(this.playerList[i], 0);
                                }

                            }
                        } else {
                            for (let i = 0; i < this.playerList.length; i++) {
                                //sendShowBanker中type为1：客户端有跑马灯效果，2：没有效果，只是庄家的图片交换一下，3：庄家不变
                                playerManager.gameSend(this.playerList[i], "showBanker", {
                                    bankerID: this.banker,
                                    type: 1
                                });
                            }
                        }
                        break;
                    case '明牌抢庄':
                        if (this.banker !== undefined) {
                            playerManager.setIsBanker(this.banker, false);
                        }
                        if (this.robBankerList.length !== 0) {
                            let robBankerMap = {};
                            for (let i = 0, len = this.robBankerList.length; i < len; i++) {
                                if (robBankerMap.hasOwnProperty(playerManager.getRobBankerMultiples(this.robBankerList[i]))) {
                                    robBankerMap[playerManager.getRobBankerMultiples(this.robBankerList[i])].push(this.robBankerList[i]);
                                } else {
                                    robBankerMap[playerManager.getRobBankerMultiples(this.robBankerList[i])] = [this.robBankerList[i]];
                                }
                            }
                            console.log('\n明牌抢庄参与者：' + JSON.stringify(robBankerMap));
                            let keys = Object.keys(robBankerMap);
                            keys.sort((a, b) => {
                                return Number(b) - Number(a);
                            });
                            console.log('\n抢庄倍数排序：' + JSON.stringify(keys));
                            this.banker = robBankerMap[keys[0]][getRandomNum(robBankerMap[keys[0]].length)];
                            playerManager.setIsBanker(this.banker, true);
                            playerManager.setSingleScore(this.banker, 0);
                        } else {
                            this.banker = this.startPlayerList[getRandomNum(this.startPlayerList.length)];
                            playerManager.setIsBanker(this.banker, true);
                            playerManager.setSingleScore(this.banker, 0);
                        }
                        console.log('\n明牌抢庄的庄家是：' + this.banker);
                        if (this.XJTZFlag) {
                            for (let i = 0; i < this.playerList.length; i++) {
                                //sendShowBanker中type为1：客户端有跑马灯效果，2：没有效果，只是庄家的图片交换一下，3：庄家不变
                                playerManager.gameSend(this.playerList[i], "showBanker", {
                                    bankerID: this.banker,
                                    type: 1,
                                    robBankerMultiples: playerManager.getRobBankerMultiples(this.banker),
                                    lastScore: playerManager.getSingleScore(this.playerList[i]),
                                    XJTZCount: playerManager.getXJTZCount(this.playerList[i])
                                });
                                if (playerManager.getXJTZCount(this.playerList[i]) === 1) {
                                    playerManager.setXJTZCount(this.playerList[i], 0);
                                }
                            }
                        } else {
                            for (let i = 0; i < this.playerList.length; i++) {
                                //sendShowBanker中type为1：客户端有跑马灯效果，2：没有效果，只是庄家的图片交换一下，3：庄家不变
                                playerManager.gameSend(this.playerList[i], "showBanker", {
                                    bankerID: this.banker,
                                    type: 1,
                                    robBankerMultiples: playerManager.getRobBankerMultiples(this.banker)
                                });

                            }
                        }
                        break;
                    case '通比牛牛':
                        let playerBet = Number(this.roomConfig.basicScore);
                        console.log('\n通比牛牛的注数：' + playerBet);
                        for (let i = 0, len = this.startPlayerList.length; i < len; i++) {
                            playerManager.setPlayerBet(this.startPlayerList[i], playerBet);
                        }
                        break;
                    default:
                        console.log('\n我可能走错了。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。');
                        break;
                }

                //闲家
                if (this.banker !== undefined) {
                    for (let i = 0; i < this.startPlayerList.length; i++) {
                        if (this.startPlayerList[i] !== this.banker) {
                            this.player.push(this.startPlayerList[i]);
                        }
                    }
                } else {
                    this.player = this.startPlayerList;
                }
                console.log('\n' + smallType + '的闲家是：' + JSON.stringify(this.player));
                break;
            case roomState.PushCard:
                this.state = state;
                console.log("我是五醉牛,我发牌了。。。");
                if (this.nnCards === undefined) {
                    this.nnCards = this.carder.getWZNCards(this.startPlayerList);
                    console.log('\n准备的牌' + JSON.stringify(this.nnCards));
                }
                let cardsLength = 0;
                if (flag === 'pushOne') {
                    cardsLength = 1;
                    console.log('\n就发一张牌');
                } else if (flag === 'pushFour') {
                    cardsLength = 4;
                    console.log('\n只发四张牌');
                } else if (flag === 'pushAll') {
                    cardsLength = 5;
                    console.log('\n发了五张牌');
                } else {
                    console.log('我想我是忘记传参数了。。。。。。');
                }

                for (let i = 0, len1 = this.playerList.length; i < len1; i++) {
                    let mark = false;
                    for (let j = 0, len2 = this.startPlayerList.length; j < len2; j++) {
                        if (this.playerList[i] === this.startPlayerList[j]) {
                            mark = true;
                            if (cardsLength === 1) {
                                let cards = playerManager.getCards(this.playerList[i]);
                                cards.push(this.nnCards[j][4]);
                                playerManager.setCards(this.playerList[i], cards);
                                playerManager.gameSend(this.playerList[i], "pushCard", [this.nnCards[j][4]]);
                            } else {
                                let cards = playerManager.getCards(this.playerList[i]);
                                for (let k = 0; k < cardsLength; k++) {
                                    cards.push(this.nnCards[j][k]);
                                }
                                playerManager.setCards(this.playerList[i], cards);
                                playerManager.gameSend(this.playerList[i], "pushCard", playerManager.getCards(this.playerList[i]));
                            }
                            break;
                        }
                    }
                    if (!mark) {
                        playerManager.gameSend(this.playerList[i], "pushCard", cardsLength);
                    }
                }
                break;
            case roomState.CompareCard:
                this.state = state;
                break;
            case roomState.GameOver:
                this.state = state;
                this.isPlaying = false;
                //--------------------------------- 记录游戏数据 -------------------------------
                if (this.roundCount === 1) {
                    this.gameRecord.create_date = getLocalDateStr();
                    this.gameRecord.base_score = this.roomConfig.basicScore;
                    this.gameRecord.game_type = this.roomConfig.smallType;
                    this.gameRecord.house_master = this.creatorID;
                    this.gameRecord.total_round = this.roomConfig.roundCount;
                    this.gameRecord.room_id = this.roomID;
                    this.gameRecord.players = [];
                    for (let i = 0; i < this.playerList.length; i++) {
                        this.gameRecord.players.push(this.playerList[i]);
                    }
                    // console.log("先瞧瞧 _gameRecord=" + JSON.stringify(_gameRecord) + '\n');
                } else {
                    for (let i = 0; i < this.playerList.length; i++) {
                        let flag = false;
                        for (let j = 0, len = this.gameRecord.players.length; j < len; j++) {
                            if (this.gameRecord.players[j] === this.playerList[i]) {
                                flag = true;
                                break;
                            }
                        }
                        if (!flag) {
                            this.gameRecord.players.push(this.playerList[i]);
                        }
                    }
                }
                this.gameInfo.gameItemContents.push({itemUsers: []});
                for (let i = 0; i < this.playerList.length; i++) {
                    this.gameInfo.gameItemContents[this.gameInfo.gameItemContents.length - 1].itemUsers.push({
                        banker: playerManager.getIsBanker(this.playerList[i]),
                        username: this.playerList[i],
                        win: playerManager.getSingleScore(this.playerList[i])
                    });
                }
                // console.log("再看看 _gameInfo=" + JSON.stringify(_gameInfo) + '\n');
                this.nnCards = undefined;
                this.startPlayerList = [];
                this.robBankerList = [];
                this.betCount = 0;
                this.robCount = 0;
                this.showDownCount = 0;
                this.compareCount = 0;
                for (let i = 0; i < this.playerList.length; i++) {
                    playerManager.singleGameEndInit(this.playerList[i]);
                    if (this.banker !== undefined) {
                        playerManager.setSingleScore(this.banker, 0);
                    } else {
                        playerManager.setSingleScore(this.playerList[i], 0);
                    }
                    playerManager.gameSend(this.playerList[i], "oneGameOver", {});
                }

                if (this.roundCount === this.roomConfig.roundCount) {
                    this.allGameOver();
                }
                break;
            default:
                break;
        }
    };

    /**
     * 对玩家的总分数进行排序
     * @returns {string[]}
     */
    sortScore() {
        let scoreList = {};
        for (let i = 0; i < this.playerList.length; i++) {
            if (!scoreList.hasOwnProperty(playerManager.getScore(this.playerList[i]))) {
                scoreList[playerManager.getScore(this.playerList[i])] = 1;
            }
        }
        let keys = Object.keys(scoreList);
        keys.sort((a, b) => {
            return Number(b) - Number(a);
        });
        return keys;
    };

    allGameOver() {
        this.XJTZFlag = false;
        for (let i = 0; i < this.playerList.length; i++) {
            let playerID = this.playerList[i];
            let information = playerManager.getInformation(playerID);
            this.gameInfo.userContents.push({
                head: information.avatarUrl,
                name: information.nickName,
                totalScore: playerManager.getScore(playerID),
                username: playerID
            });
        }
        // console.log("先看看 _gameInfo=" + JSON.stringify(_gameInfo) + '\n');

        //----------------------------------- 全部游戏结束，保存到数据库 begin----------------------------------
        let playerInfoList = [];
        let scoreList = this.sortScore();
        let bigWinnerScore = scoreList[0];
        let tyrantScore = undefined;
        if (scoreList.length >= 2) {
            tyrantScore = scoreList[1];
        }
        for (let i = 0; i < this.playerList.length; i++) {
            let playerID = this.playerList[i];
            let information = playerManager.getInformation(playerID);
            playerInfoList.push({
                accountID: playerID,
                nickName: information.nickName,
                avatarUrl: information.avatarUrl,
                score: playerManager.getScore(playerID)
            });
        }
        //保存游戏记录
        myDB.saveGameRecords("wzn",{
            gameRecord: this.gameRecord,
            gameInfo: this.gameInfo
        });
        //有参与游戏的玩家游戏总局数+1
        for (let i = 0, len = this.playerList.length; i < len; i++) {
            let playerID = this.playerList[i];
            if (playerManager.getIsGaming(playerID)) {
                myDB.upDataTotalGamesByUniqueID(playerID);
            }
        }
        //----------------------------------- 全部游戏结束，保存到数据库 end ----------------------------------
        if (this.banker !== undefined) {
            playerManager.setIsBanker(this.banker, false);
        }
        setTimeout(() => {
            for (let i = 0; i < this.playerList.length; i++) {
                playerManager.gameSend(this.playerList[i], "allGameOver", {
                    playerList: playerInfoList,
                    gameTime: this.startGameTime,
                    houseMasterID: this.creatorID,
                    bigWinnerScore: bigWinnerScore,
                    tyrantScore: tyrantScore
                });
            }
            this.roomManager.deleteRoom(this.roomID);
        }, 1000);
    };

    /**
     * 给每个玩家发送自己准备好了的消息
     * @param playerID
     */
    playerReady(playerID) {
        if (this.isPlaying) {
            playerManager.gameSend(playerID, "cannotSeat", "'游戏已开始，请在本局结束后加入'");
            return;
        }
        this.readyPlayerList.push(playerID);
        if (this.readyPlayerList.length >= 2) {
            // console.log("\n可以通知第一位玩家可以开始游戏了。。。\n");
            for (let i = 0; i < this.playerList.length; i++) {      //只通知第一位玩家
                if (this.playerList[i] === this.firstPlayerID) {
                    playerManager.gameSend(this.playerList[i], "canStartGame", this.firstPlayerID);
                }
            }
        }
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "playerReady", playerID);
        }
        console.log('*** room *** playerReady: readyPlayerList = ' + JSON.stringify(this.readyPlayerList));

        if (this.readyPlayerList.length === this.playerList.length && this.roundCount > 0) {
            this.setState(roomState.GameStart);
        }
    };

    /**
     * 当房间第一个玩家点击开始游戏，下发通知其他玩家游戏开始了
     * @param player
     * @param cb
     */
    firstPlayerStartGame() {
        this.setState(roomState.GameStart);
    };

    /**
     *  玩家抢庄情况
     * @param playerID
     * @param value
     */
    playerRobState(playerID, value) {
        this.robCount++;
        if (value === 'rob') {
            this.robBankerList.push(playerID);
        }
        if (value !== 'rob' && value !== 'norob') {
            playerManager.setRobBankerMultiples(playerID, Number(value));
            this.robBankerList.push(playerID);
        }
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "playerRobState", {playerID: playerID, value: value});
        }
        if (this.robCount === this.startPlayerList.length) {
            console.log('\n所有玩家都已抢庄，抢庄结束。。。');
            setTimeout(() => {
                this.setState(roomState.RobBanker);
            }, 500);
        }

    };

    /**
     * 玩家下注
     * @param playerID
     */
    onePlayerBet(playerID) {
        this.betCount++;
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "oneBetOver", {
                playerID: playerID,
                bet: playerManager.getPlayerBet(playerID)
            });
        }
        if (this.betCount === this.player.length) {
            if (this.roomConfig.smallType === '明牌抢庄') {
                this.setState(roomState.PushCard, 'pushOne');
            } else {
                this.setState(roomState.PushCard, 'pushAll');
            }
        }
    };

    /**
     * 牛牛提示牌
     * @param playerID
     * @param cb
     */
    playerRequestTipCards(playerID, cb) {
        let cardList = playerManager.getCards(playerID);
        if (cb) {
            let cardsValue = this.carder.getTip(cardList, this.roomConfig.TSPX);
            let multiple = this.getMultiple(cardsValue.value);
            playerManager.setCardsValue(playerID, cardsValue.value);
            console.log("cardsvalue:" + playerManager.getCardsValue(playerID));
            playerManager.setMultiple(playerID, multiple);
            if (cardsValue.value === 10) {
                this.nnPlayer.push(playerID);
            }
            console.log('\n** 牛牛提示 ** id = ' + playerID + ' ; cardsValue = ' + cardsValue + '  ; multiple = ' + multiple);

            if (cardsValue === false) {
                cb('异常牌型！');
            } else {
                cb(null, {cardsValue: cardsValue.value, multiple: multiple});
            }
        }
    };

    /**
     * 玩家亮牌，通知除自己以外的玩家
     * @param playerID
     * @param cardsValue
     * @param multiple
     */
    playerShowDownCards(playerID, cardsValue, multiple) {
        this.showDownCount++;
        playerManager.setIsShowDownCards(playerID, true);
        for (let i = 0; i < this.playerList.length; i++) {
            if (this.playerList[i] !== playerID) {
                playerManager.gameSend(this.playerList[i], "playerShowDownCards", {
                    playerID: playerID,
                    cardsValue: cardsValue,
                    multiple: multiple,
                    cardsData: playerManager.getCards(playerID)
                });
            }
        }
        //todo 所有玩家都已经亮牌
        if (this.showDownCount === this.startPlayerList.length) {
            console.log('所有玩家都亮好牌了。。。');
            for (let i = 0; i < this.playerList.length; i++) {
                playerManager.gameSend(this.playerList[i], "showDownOver", {});
                console.log('** 通知了 ' + this.playerList[i] + ' 玩家 **');
            }
            if (this.roomConfig.smallType === '通比牛牛') {
                this.compareCardWithNotBanker();
            }
        }
    };

    /**
     * 没有庄家的比牌
     */
    compareCardWithNotBanker() {
        let map = {};
        for (let i = 0, len = this.startPlayerList.length; i < len; i++) {
            if (map.hasOwnProperty(this.startPlayerList[i].cardsValue)) {
                map[this.startPlayerList[i].cardsValue].push(this.startPlayerList[i]);
            } else {
                map[this.startPlayerList[i].cardsValue] = [this.startPlayerList[i]];
            }
        }
        let keys = Object.keys(map);
        keys.sort((a, b) => {
            return Number(b) - Number(a);
        });
        console.log('无庄比牌：' + JSON.stringify(keys));
        let big = undefined;
        if (map[keys[0]].length === 1) {
            big = map[keys[0]][0];
            console.log('只有一位最大玩家：' + big);
        } else {
            for (let i = 0, len = map[keys[0]].length - 1; i < len; i++) {
                if (big === undefined) {
                    big = map[keys[0]][i];
                }
                let num = this.carder.compareCard(playerManager.getCards(big), playerManager.getCards(map[keys[0]][i + 1]));
                if (num < 0) {
                    big = map[keys[0]][i + 1];
                }
            }
            console.log('经过筛选，最大玩家为：' + big);
        }
        console.log("\n 最大玩家的牌：" + playerManager.getCardsValue(big) + ' ; ' + playerManager.getMultiple(big));

        //先发送不是最大玩家的比牌结果
        for (let i = 0, len1 = this.startPlayerList.length; i < len1; i++) {
            let account = this.startPlayerList[i];
            if (account !== big) {
                playerManager.setSingleScore(account, -1 * playerManager.getMultiple(big) * playerManager.getPlayerBet(account));
                playerManager.addSingleScoreToScore(account);
                let bigSingleScore = playerManager.getSingleScore(big);
                bigSingleScore -= playerManager.getSingleScore(account);
                playerManager.setSingleScore(big, bigSingleScore);
                console.log('\n单个玩家的比牌结果：' + this.startPlayerList[i] + ' ; ' + playerManager.getSingleScore(account) + ' ; ' + playerManager.getScore(account));
                for (let j = 0, len2 = this.playerList.length; j < len2; j++) {
                    playerManager.gameSend(this.playerList[j], "compareCardResult", {
                        playerID: account,
                        score: playerManager.getSingleScore(account)
                    })
                }
            }
        }
        playerManager.addSingleScoreToScore(big);
        console.log('\n最大玩家的比牌结果：' + big + ' ; ' + playerManager.getSingleScore(big) + ' ; ' + playerManager.getScore(big));
        //再发送最大玩家的比牌结果
        for (let i = 0, len = this.playerList.length; i < len; i++) {
            playerManager.gameSend(this.playerList[i], "compareCardResult", {
                playerID: big,
                score: playerManager.getSingleScore(big)
            });
        }
        this.setState(roomState.GameOver);
    };

    //通过 cardsValue 获得翻倍数 multiple
    getMultiple(cardsValue) {
        let multiple = 0;   //倍数
        if (this.roomConfig.FBGZ.length < 20 && cardsValue < 8) {
            multiple = 1;
        }
        if (this.roomConfig.FBGZ.length > 20 && cardsValue < 7) {
            multiple = 1;
        }
        if (this.roomConfig.FBGZ.length > 20 && cardsValue === 7) {
            multiple = 2;
        }
        if (cardsValue === 8) {
            multiple = 2;
        }
        if (cardsValue === 9) {
            multiple = 3;
        }
        if (cardsValue === 10 || cardsValue === 11) {
            multiple = 4;
        }
        if (cardsValue === 12) {
            multiple = 5;
        }
        if (cardsValue === 13) {
            multiple = 6;
        }
        if (cardsValue === 14) {
            multiple = 8;
        }
        return multiple;
    };

    /**
     * 玩家与庄家比牌
     * @param playerID
     */
    playerCompareCardWithBanker(playerID) {
        console.log('\n进到比牌阶段：' + playerID + ' : ' + playerManager.getCardsValue(playerID) + ' : ' + playerManager.getCardsValue(this.banker));
        this.compareCount++;
        let playerCardsValue = playerManager.getCardsValue(playerID);
        let bankerCardsValue = playerManager.getCardsValue(this.banker);
        let singleScore = 0;
        if (playerCardsValue > bankerCardsValue) {
            singleScore = playerManager.getMultiple(playerID) * playerManager.getPlayerBet(playerID) * playerManager.getRobBankerMultiples(this.banker);
            playerManager.setSingleScore(playerID, singleScore);
        }
        if (playerCardsValue < bankerCardsValue) {
            singleScore = playerManager.getMultiple(this.banker) * playerManager.getPlayerBet(playerID) * playerManager.getRobBankerMultiples(this.banker);
            playerManager.setSingleScore(playerID, -1 * singleScore);
        }
        if (playerCardsValue === bankerCardsValue) {
            let num = this.carder.compareCard(playerManager.getCards(playerID), playerManager.getCards(this.banker));
            console.log('\n比牌得到的数：' + num);
            if (num > 0) {
                singleScore = playerManager.getMultiple(playerID) * playerManager.getPlayerBet(playerID) * playerManager.getRobBankerMultiples(this.banker);
                playerManager.setSingleScore(playerID, singleScore);
            } else {
                singleScore = playerManager.getMultiple(this.banker) * playerManager.getPlayerBet(playerID) * playerManager.getRobBankerMultiples(this.banker);
                playerManager.setSingleScore(playerID, -1 * singleScore);
            }
        }

        playerManager.addSingleScoreToScore(playerID);
        let oldBankerSingleScore = playerManager.getSingleScore(this.banker);
        oldBankerSingleScore -= playerManager.getSingleScore(playerID);
        playerManager.setSingleScore(this.banker, oldBankerSingleScore);
        console.log('\nplayer.singleScore = ' + playerManager.getSingleScore(playerID) + ' ; bankerSingleScore = ' + oldBankerSingleScore);
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "compareCardResult", {
                playerID: playerID,
                score: playerManager.getSingleScore(playerID)
            });
        }

        if (this.compareCount === this.player.length) {
            playerManager.addSingleScoreToScore(this.banker);
            for (let i = 0; i < this.playerList.length; i++) {
                playerManager.gameSend(this.playerList[i], "compareCardResult", {
                    playerID: this.banker,
                    score: playerManager.getSingleScore(this.banker)
                });
            }
            this.setState(roomState.GameOver);

            if (this.roomConfig.SZFS !== undefined && this.roomConfig.SZFS > 0) {
                if (playerManager.getScore(this.banker) <= 0) {
                    this.allGameOver();
                }
            }
        }
    };


    joinPlayer(playerID, roomManager, cb) {
        this.roomManager = roomManager;
        if (this.playerList.length === 0) {
            this.setState(roomState.WaitingReady);
            this.firstPlayerID = playerID;
        }
        var seatIndex = getSeatIndex(this.playerList);
        if (seatIndex !== -1) {
            playerManager.enterTable(playerID, this.roomID, seatIndex);
            playerManager.initNiuNiuGaming(playerID);
            this.playerList.push(playerID);
            cb({data: "success", seatIndex: seatIndex});
            return;
        }
        cb({data: "房间人数已满！"});
    }

    enterRoom(playerID, cb) {
        let info = playerManager.getInformation(playerID);
        info.seatIndex = playerManager.getSeatIndex(playerID);
        info.cards = [];
        info.cardsValue = undefined;
        info.multiple = undefined;
        info.score = 0;
        info.isBanker = false;
        info.playerBet = 0;
        for (let i = 0; i < this.playerList.length; i++) {
            if (this.playerList[i] !== playerID) {
                playerManager.gameSend(this.playerList[i], "playerJoinRoom", info);
            }
        }
        let allInfo = [];
        for (let i = 0; i < this.playerList.length; i++) {
            let playerID = this.playerList[i];
            let cards = undefined;
            let cardsValue = undefined;
            let multiple = undefined;
            let gameInfo = playerManager.getGameInfo(playerID);
            if (playerManager.getIsShowDownCards(playerID)) {
                cards = gameInfo.cards;
                cardsValue = gameInfo.cardsValue;
                multiple = gameInfo.multiple;
            } else {
                cards = gameInfo.cards.length;
            }
            console.log('\n** playerEnterRoomScene ** cards = ' + JSON.stringify(cards) + ' ; ');
            let otherPlayerInfo = playerManager.getInformation(this.playerList[i]);
            otherPlayerInfo.accountID = this.playerList[i];
            otherPlayerInfo.seatIndex = playerManager.getSeatIndex(this.playerList[i]);
            otherPlayerInfo.cards = cards;
            otherPlayerInfo.cardsValue = cardsValue;
            otherPlayerInfo.multiple = multiple;
            otherPlayerInfo.score = gameInfo.score;
            otherPlayerInfo.isBanker = gameInfo.isBanker;
            otherPlayerInfo.playerBet = gameInfo.playerBet;
            allInfo.push(otherPlayerInfo);
        }
        if (cb) {
            cb({
                firstPlayerID: this.firstPlayerID,
                seatIndex: info.seatIndex,
                playerData: allInfo,
                readyPlayerList: this.readyPlayerList,
                startPlayerList: this.startPlayerList,
                houseManagerID: this.creatorID
            });
        }
    }

    getConfig() {
        let id = this.roomID;
        let gameType = this.roomConfig.smallType;
        let point = this.roomConfig.basicScore;
        let round = this.roomConfig.roundCount;
        let player = this.playerList.length;
        let totalPlayer = 6;
        return {roomID: id, gameType: gameType, point: point, round: round, player: player, totalPlayer: totalPlayer};
    }

    /**
     * 当第一位玩家掉线了，下发消息通知其他玩家，将开始游戏的权利交给其他玩家
     * 如果下一个玩家准备好了，就要将他从_readyPlayerList中删掉
     */
    changeFirstPlayer() {
        if (this.playerList.length === 0) {
            return;
        }
        this.firstPlayerID = this.playerList[0];
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "changeFirstPlayer", this.firstPlayerID);
        }
    };

    //玩家掉线
    playerOffLine(playerID) {
        if (!playerManager.getIsGaming(playerID)) {
            for (let i = 0, len = this.playerList.length; i < len; i++) {//将该玩家从_playerList中删除
                if (this.playerList[i] === playerID) {
                    this.playerList.splice(i, 1);
                    break;
                }
            }
            for (let i = 0, len = this.readyPlayerList.length; i < len; i++) {//如果将该玩家准备了，就从_readyPlayerList中删除
                if (this.readyPlayerList[i] === playerID) {
                    this.readyPlayerList.splice(i, 1);
                    break;
                }
            }
            for (let i = 0, len = this.playerList.length; i < len; i++) {//向房间其他玩家发送自己掉线消息
                playerManager.gameSend(this.playerList[i], "otherLeaveRoom", playerManager.getInformation(playerID).seatIndex);
            }
            if (this.firstPlayerID === playerID) {//如果自己是第一个玩家，那就让其他玩家执行第一个玩家的权利
                this.changeFirstPlayer();
            }
        } else {
            for (let i = 0, len = this.playerList.length; i < len; i++) {//向房间其他玩家发送自己掉线消息
                playerManager.gameSend(this.playerList[i], "playerOffLine", playerManager.getInformation(playerID).seatIndex);
            }
        }
    };

    //玩家请求离开房间
    playerRequestLeaveRoom(playerID, cb) {
        if (cb) {
            if (playerManager.getIsGaming(playerID)) {
                cb('游戏已开始,不能离开房间！');
            } else {
                for (let i = 0; i < this.readyPlayerList.length; i++) {
                    if (playerID === this.readyPlayerList[i]) {
                        this.readyPlayerList.splice(i, 1);
                    }
                }
                for (let i = 0; i < this.playerList.length; i++) {
                    if (playerID === this.playerList[i]) {
                        this.playerList.splice(i, 1);
                    }
                }
                for (let i = 0; i < this.playerList.length; i++) {
                    playerManager.gameSend(this.playerList[i], "otherLeaveRoom", playerID);
                }
                if (this.firstPlayerID === playerID) {//如果自己是第一个玩家，那就让其他玩家执行第一个玩家的权利
                    this.changeFirstPlayer();
                }
                cb(null, '离开房间成功！');
            }
        }
    };

    //解散房间处理
    playerDestroyRoom(playerID, cb) {
        if (this.state === roomState.WaitingReady) {
            if (playerID === this.creatorID) {
                //解散房间时把房费还给房主（如果不是AA的话）
                if (this.roomConfig.roomRate.substr(0, 2) !== 'AA') {
                    let needDiamond = UnitTools.getNumFromStr(this.roomConfig.roomRate);
                    let diamondCount = myDB.getPlayerDiamondCount(playerID);
                    let hasMoney = Number(diamondCount[0].diamond);
                    hasMoney -= needDiamond;
                    myDB.upDateDiamondCountByAccountID(this.creatorID, hasMoney);
                    console.log('\n** createRoom ** _houseManager.diamondCount = ' + diamondCount);
                }
                for (let i = 0, len = this.playerList.length; i < len; i++) {
                    playerManager.gameSend(this.playerList[i], "roomHasDestroyed", {});
                }
                this.roomManager.deleteRoom(this.roomID);
                cb(null);
            } else {
                if (cb) {
                    cb('您不是房主，无权解散房间!');
                }
            }
        } else {
            let playerDataList = [];
            for (let i = 0, len = this.playerList.length; i < len; i++) {
                let playerData = {
                    accountID: this.playerList[i],
                    nickName: playerManager.getInformation(this.playerList[i]).nickName,
                    avatarUrl: playerManager.getInformation(this.playerList[i]).avatarUrl
                };
                playerDataList.push(playerData);
            }
            for (let i = 0, len = this.playerList.length; i < len; i++) {
                playerManager.gameSend(this.playerList[i], "destroyRoomRequest", {
                    nickName: playerManager.getInformation(playerID).nickName,
                    playerDataList: playerDataList
                });
            }
            cb(null);
        }
    };

    //玩家是否同意解散房间
    showDestroyRoomChoice(data) {
        this.chooseDestroyRoomCount++;
        if (data.choice === 1) {
            this.agreeDestroyRoomCount++;
        }
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "destroyRoomChoice", data);
        }
        console.log('\n _chooseDestroyRoomCount = ' + this.chooseDestroyRoomCount + ' ; _agreeDestroyRoomCount = ' + this.agreeDestroyRoomCount);
        if (this.chooseDestroyRoomCount === this.playerList.length) {
            if (this.chooseDestroyRoomCount === this.agreeDestroyRoomCount) {
                console.log('同意解散房间了');
                if (this.roundCount === 1 && this.state === roomState.GameOver || this.roundCount > 1) {
                    this.allGameOver();
                } else {
                    for (let i = 0; i < this.playerList.length; i++) {
                        playerManager.gameSend(this.playerList[i], "roomHasDestroyed", {});
                    }
                    this.roomManager.deleteRoom(this.roomID);
                }
            } else {
                for (let i = 0; i < this.playerList.length; i++) {
                    playerManager.gameSend(this.playerList[i], "destroyRoomFailed", {});
                }
            }
            this.chooseDestroyRoomCount = 0;
            this.agreeDestroyRoomCount = 0;
        }
    };

    //玩家发送表情
    faceChat(playerID, num) {
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "faceChat", {playerID: playerID, num: num});
        }
    };

    //玩家发送快捷语
    wordChat(playerID, num) {
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "wordChat", {playerID: playerID, num: num});
        }
    };

    //玩家发送动画聊天
    actionChat(data) {
        for (let i = 0, len = this.playerList.length; i < len; i++) {
            playerManager.gameSend(this.playerList[i], "actionChat", data);
        }
    };
}

module.exports = Room;