var Carder = require("./Carder.js");
var playerManager = require("./../../model/PlayerManager.js");
var UnitTools = require("../../core/UnitTools");
var myDB = require("../../core/db");
//生成座位号
const getSeatIndex = function (playerList) {
    if (playerList.length === 0) {
        return 0;
    }
    if (playerList.length === 3) {
        return -1;
    }
    for (let i = 0; i < 3; i++) {
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
//房间的状态
const roomState = {
    Invalide: -1,        //无效
    WaitingReady: 1,    //等待准备
    GameStart: 2,       //游戏开始
    PushCard: 3,        //发牌
    LandClaim: 4,       //抢地主
    ShowBottomCards: 5, //显示底牌
    Playing: 6,          //开始出牌
    GameOver: 7,          //游戏结束
};
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
//获取数个随机数
const getRandomStr = function (count) {
    let str = '';
    for (let i = 0; i < count; i++) {
        str += Math.floor(Math.random() * 10);
    }
    return str;
};
//随机出第一个叫地主的人的座位号
const getFirstCaller = function () {
    let randomNum = getRandomStr(1);
    if (randomNum === 0) {
        return getFirstCaller();
    } else if (randomNum < 4) {
        return 0;
    } else if (randomNum < 7) {
        return 1;
    } else {
        return 2;
    }
};

class Room {
    constructor(playerID,roomID,roomConfig){
        this.creatorID = playerID;//创建者
        this.roomID = roomID;//房间号
        this.roomConfig = roomConfig;//房间配置信息
        this.type = roomConfig.gameType;//游戏类型
        this.playerList = [];//玩家列表
        this.readyPlayerList = [];//准备玩家列表
        this.state = roomState.Invalide;//房间状态
        this.roundCount = 0;//回合计数
        this.startGameTime = undefined;//游戏开始时间
        this.gameIsOver = false;//游戏是否结束标志
        this.startPlayerList = [];//已开始游戏玩家ID列表
        this.carder = Carder();//逻辑
        this.firstCaller = undefined;//首位可以叫地主的玩家的座位号
        this.firstRobPlayer = undefined;//第一个叫地主的玩家
        this.turnTimes = 0;//轮流选择次数
        this.robTimes = 0;//叫地主次数
        this.land = undefined;//地主
        this.landIndex = undefined;//地主所在列表的位置
        this.masterSeatIndex = undefined;//地主座位号
        this.pushCardPlayerList = [];//出牌玩家列表
        this.currentPlayerPushCardList = [];//当前玩家出的牌
        this.notPushCount = 0;//不出牌的次数，连续两次不出牌就可以随意出牌
        this.winner = undefined;//获胜的玩家
        this.landPushCount = 0;//地主出牌的次数
        this.farmerPushCount = 0;//农民出牌的次数，两个农民出牌的总次数
        this.multiple = 0;//当前倍数
        this.gameInfo = {gameItemContents: [], userContents: []};//游戏具体记录
        this.gameRecord = {};//游戏记录(包含_gameInfo)
        this.chooseDestroyRoomCount = 0;//已选择是否解散房间的次数
        this.agreeDestroyRoomCount = 0;//同意解散的人数
        this.setState(roomState.WaitingReady);
        this.roomManager = undefined;
    }
    async setState(state){
        console.log("------ state = " + state + " ;  _state = " + this.state);
        if (state === this.state) {
            return;
        }
        switch (state) {
            case roomState.WaitingReady:
                this.state = state;
                break;
            case roomState.GameStart:
                this.roundCount++;
                if (this.roundCount === 1 && this.roomConfig.roomRate.substr(0, 2) === 'AA') {
                    console.log('游戏开始了，这是AA支付，每位玩家都应扣除相应的钻石');
                    let needDiamond = UnitTools.getNumFromStr(this.roomConfig.roomRate);
                    for (let i = 0, len = this.playerList.length; i < len; i++) {
                        var diamondCount = await myDB.getPlayerDiamondCount(this.playerList[i]);
                        let hasMoney = Number(diamondCount[0].diamond);
                        hasMoney -= needDiamond;
                        let result = await myDB.upDateDiamondCountByAccountID(this.playerList[i], hasMoney);
                        if (result) {
                            console.log(result);
                        }
                    }
                }
                this.multiple = 1;
                for (let i = 0, len = this.playerList.length; i < len; i++) {
                    playerManager.gameSend(this.playerList[i],"changeMultiple",this.multiple);
                }
                if (this.startGameTime === undefined) {
                    this.startGameTime = getLocalDateStr();
                }
                this.gameIsOver = false;
                for (let i = 0, len = this.playerList.length; i < len; i++) {
                    playerManager.setIsGaming(this.playerList[i],true);
                    playerManager.gameSend(this.playerList[i],"gameStart",{});
                }
                this.startPlayerList = this.readyPlayerList;
                this.readyPlayerList = [];
                this.state = state;
                await this.setState(roomState.PushCard);
                break;
            case roomState.PushCard:
                console.log("我是斗地主,我发牌了。。。");
                this.ddzCards = this.carder.getDDZCards();
                for (let i = 0; i < this.startPlayerList.length; i++) {
                    for (let j = 0; j < this.playerList.length; j++) {
                        if (this.startPlayerList[i] === this.playerList[j]) {
                            this.ddzCards[i].sort((a, b) => {
                                return a.id -b.id;
                            });
                            playerManager.setCards(this.playerList[j],this.ddzCards[i]);
                           playerManager.gameSend(this.playerList[j],"pushCard",this.ddzCards[i]);
                        }
                    }
                }
                this.state = state;
                await this.setState(roomState.LandClaim);
                break;
            case roomState.LandClaim:
                console.log("接下来要开始抢地主了。。。");
                this.firstCaller = getFirstCaller();
                console.log("第一个叫地主："+this.firstCaller);
                for (let i = 0, len = this.playerList.length; i < len; i++) {
                    playerManager.gameSend(this.playerList[i],"canLandClaim",{caller:this.firstCaller,robTimes:this.robTimes});
                }
                this.state = state;
                break;
            case roomState.ShowBottomCards:
                for (let i = 0; i < this.playerList.length; i++) {
                    playerManager.gameSend(this.playerList[i],"showBottomCards",this.ddzCards[3])
                }
                this.state = state;
                setTimeout(async () => {
                  await  this.setState(roomState.Playing);
                }, 2000);
                break;
            case roomState.Playing:
                for (let i = 0; i < this.playerList.length; i++) {  //找到地主的下标
                    if (this.playerList[i] === this.land) {
                        this.landIndex = i;
                    }
                }
                this.turnPlayerPushCard();
                this.state = state;
                break;
            case roomState.GameOver:
                this.gameIsOver = true;
                let waitTime = 1000;
                if (this.landPushCount === 1 || this.farmerPushCount === 0) {
                    console.log('\n春天了');
                    waitTime = 3000;
                    this.multiple *= 2;
                    if (this.multiple > this.roomConfig.limitMultiplier) {
                        this.multiple = this.roomConfig.limitMultiplier;
                    }
                    setTimeout(() => {
                        for (let i = 0; i < this.playerList.length; i++) {
                            playerManager.gameSend(this.playerList[i],"changeMultiple",this.multiple);
                            playerManager.gameSend(this.playerList[i],"spring",{});
                        }
                    }, 1500);
                }

                setTimeout(() => {
                    let listSettlement = [];
                    let winnerList = [];
                    if (this.winner === this.land) {
                        winnerList.push(this.land);
                        for (let i = 0; i < this.playerList.length; i++) {
                            let playerID = this.playerList[i];
                            if (playerID === this.land) {
                                let singleScore = 2 * this.roomConfig.basicScore * this.multiple;
                                playerManager.setSingleScore(playerID,singleScore);
                                let ddzScore = playerManager.getScore(playerID);
                                ddzScore += singleScore;
                                playerManager.setScore(playerID,ddzScore);
                                listSettlement.push({
                                    playerID: playerID,
                                    nickName: playerManager.getInformation(playerID).nickName,
                                    settlement: singleScore
                                });
                            } else {
                                let singleScore = -1 * this.roomConfig.basicScore * this.multiple;
                                playerManager.setSingleScore(playerID,singleScore);
                                let ddzScore = playerManager.getScore(playerID);
                                ddzScore += singleScore;
                                playerManager.setScore(playerID,ddzScore);
                                listSettlement.push({
                                    playerID: playerID,
                                    nickName: playerManager.getInformation(playerID).nickName,
                                    settlement: singleScore
                                });
                            }
                        }
                    } else {
                        for (let i = 0; i < this.playerList.length; i++) {
                            if (this.playerList[i] !== this.land) {
                                winnerList.push(this.playerList[i]);
                            }
                        }
                        for (let i = 0; i < this.playerList.length; i++) {
                            let playerID = this.playerList[i];
                            if (playerID === this.land) {
                                let singleScore = -2 * this.roomConfig.basicScore * this.multiple;
                                playerManager.setSingleScore(playerID,singleScore);
                                let ddzScore = playerManager.getScore(playerID);
                                ddzScore += singleScore;
                                playerManager.setScore(playerID,ddzScore);
                                listSettlement.push({
                                    playerID: playerID,
                                    nickName: playerManager.getInformation(playerID).nickName,
                                    settlement: singleScore
                                });
                            } else {
                                let singleScore = 1 * this.roomConfig.basicScore * this.multiple;
                                playerManager.setSingleScore(playerID,singleScore);
                                let ddzScore = playerManager.getScore(playerID);
                                ddzScore += singleScore;
                                playerManager.setScore(playerID,ddzScore);
                                listSettlement.push({
                                    playerID: playerID,
                                    nickName: playerManager.getInformation(playerID).nickName,
                                    settlement: singleScore
                                });
                            }
                        }
                    }

                    for (let i = 0; i < this.playerList.length; i++) {
                        playerManager.gameSend(this.playerList[i],"oneGameOver",{winnerList:winnerList,listSettlement:listSettlement});
                    }
                    if (this.roundCount === 1) {
                        this.gameRecord.create_date = getLocalDateStr();
                        this.gameRecord.players = [];
                        for (let i = 0; i < this.playerList.length; i++) {
                            this.gameRecord.players.push(this.playerList[i]);
                        }
                        this.gameRecord.base_score = this.roomConfig.basicScore;
                        this.gameRecord.game_type = this.roomConfig.gameType;
                        this.gameRecord.house_master = this.creatorID;
                        this.gameRecord.total_round = this.roomConfig.roundCount;
                        this.gameRecord.room_id = this.roomID;
                        console.log("先瞧瞧 _gameRecord=" + JSON.stringify(this.gameRecord) + '\n');
                    }

                    this.gameInfo.gameItemContents.push({itemUsers: []});
                    for (let i = 0; i < this.playerList.length; i++) {
                        let isBanker = false;
                        if (this.playerList[i] === this.land) {
                            isBanker = true;
                        }
                        this.gameInfo.gameItemContents[this.gameInfo.gameItemContents.length - 1].itemUsers.push({
                            banker: isBanker,
                            username: this.playerList[i],
                            win: playerManager.getSingleScore(this.playerList[i])
                        });
                    }
                    console.log("再看看 _gameInfo=" + JSON.stringify(this.gameInfo) + '\n');

                    this.turnTimes = 0;
                    this.robTimes = 0;
                    this.firstRobPlayer = undefined;
                    this.startPlayerList = [];
                    this.notPushCount = 0;
                    this.landPushCount = 0;
                    this.farmerPushCount = 0;
                    this.land = undefined;
                    this.pushCardPlayerList = [];
                    this.landIndex = undefined;
                    this.currentPlayerPushCardList = [];
                    this.multiple = 0;
                    this.ddzCards = [];

                    if (this.roundCount === this.roomConfig.roundCount) {
                        this.allGameOver();
                    }
                }, waitTime);
                break;

        }
    }
    //产生地主
    changeLand () {
        console.log("通知已经产生了地主。。。_landID=" + this.land);
        let landCards = playerManager.getCards(this.land);
        for (let i = 0; i < this.ddzCards[3].length; i++) {
            landCards.push(this.ddzCards[3][i]);
        }
        landCards.sort((a, b) => {
            return a.id -b.id;
        });
        playerManager.setCards(this.land,landCards);
        console.log(landCards);
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i],"changeLand",this.land);
        }
        this.setState(roomState.ShowBottomCards);
    };

    //玩家抢地主的状态(抢的结果)
    playerRobState (playerID, value) {
        this.turnTimes++;
        console.log("*** room *** playerLandClaimState value=" + value);
        if (value === '叫地主' || value === '抢地主') {
            this.robTimes++;
            this.multiple *= 2;
            if (this.multiple > this.roomConfig.limitMultiplier) {
                this.multiple = this.roomConfig.limitMultiplier;
            }
            for (let i = 0, len = this.playerList.length; i < len; i++) {
                playerManager.gameSend(this.playerList[i],"changeMultiple",this.multiple);
            }
            if (this.firstRobPlayer === undefined) {
                this.firstRobPlayer = playerID;
            }
            this.masterSeatIndex = playerManager.getSeatIndex(playerID);

        }
        for (let i = 0, len = this.playerList.length; i < len; i++) {
            playerManager.gameSend(this.playerList[i],"playerRobState",{playerID:playerID,value:value})
        }
        if (this.turnTimes < 3) {
            let seatIndex = playerManager.getSeatIndex(playerID);
            let nextSeatIndex = seatIndex + 1 === 3 ? 0 : seatIndex + 1;
            for (let i = 0, len = this.playerList.length; i < len; i++) {
                playerManager.gameSend(this.playerList[i],"canLandClaim",{caller:nextSeatIndex,robTimes:this.robTimes});
            }
        } else if (this.turnTimes === 3) {
            if (this.robTimes === 0) {      //三个都不叫地主，第一个可以叫的人为地主
                this.masterSeatIndex = this.firstCaller;
                for (let i = 0, len = this.playerList.length; i < len; i++) {
                    let seatIndex = playerManager.getSeatIndex(this.playerList[i]);
                    if (seatIndex === this.masterSeatIndex) {
                        this.land = this.playerList[i];
                    }
                }
                this.changeLand();
            } else if (this.robTimes === 1) {
                for (let i = 0, len = this.playerList.length; i < len; i++) {
                    let seatIndex = playerManager.getSeatIndex(this.playerList[i]);
                    if (seatIndex === this.masterSeatIndex) {
                        this.land = this.playerList[i];
                    }
                }
                this.changeLand();
            } else {
                let nextSeatIndex = playerManager.getSeatIndex(this.firstRobPlayer);
                for (let i = 0, len = this.playerList.length; i < len; i++) {
                    playerManager.gameSend(this.playerList[i],"canLandClaim",{caller:nextSeatIndex,robTimes:this.robTimes});
                }
            }
        } else if (this.turnTimes === 4) {
            for (let i = 0, len = this.playerList.length; i < len; i++) {
                let seatIndex = playerManager.getSeatIndex(this.playerList[i]);
                if (seatIndex === this.masterSeatIndex) {
                    this.land = this.playerList[i];
                }
            }
            this.changeLand();
        }
    };
    //刷新出牌的玩家
    referTurnPlayerPushCard () {
        let index = this.landIndex;
        for (let i = 2; i >= 0; i--) {
            let z = index;
            if (z >= 3) {
                z -= 3;
            }
            this.pushCardPlayerList[i] = this.playerList[z];
            index++;
        }
    };
    //玩家轮流出牌
    turnPlayerPushCard() {
        if (this.gameIsOver) {
            console.log('turnPlayerPushCard 游戏结束了，不用让下家出牌了')
            return;
        }
        if (this.pushCardPlayerList.length === 0) {
            this.referTurnPlayerPushCard();
        }
        let player = this.pushCardPlayerList.pop();
        let seatIndex = playerManager.getSeatIndex(player);
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i],"canPushCard",{seatIndex:seatIndex,lastCardsLength:this.currentPlayerPushCardList.length});
        }
    };
    //玩家出牌
    playerPushCard (playerID, cards, cb) {
        if (cards.length === 0) {
            this.notPushCount++;
            if (this.notPushCount === 2) {
                this.currentPlayerPushCardList = [];
            }
            cb(null, '不出牌成功。。。');
            this.sendPlayerPushedCards(playerID, cards, 'noPush');
            this.turnPlayerPushCard();
        } else {
            let cardsValue = this.carder.isCanPushCards(cards);
            if (cardsValue) {
                if (playerID === this.land) {
                    this.landPushCount++;
                } else {
                    this.farmerPushCount++;
                }
                let styleOfCards = this.carder.getCardsStyle(cards);
                if (styleOfCards.value === 2) {
                    this.multiple *= 2;
                    if (this.multiple > this.roomConfig.limitMultiplier) {
                        this.multiple = this.roomConfig.limitMultiplier;
                    }
                    for (let i = 0, len = this.playerList.length; i < len; i++) {
                        playerManager.gameSend(this.playerList[i],"changeMultiple",this.multiple);
                    }
                }
                if (this.currentPlayerPushCardList.length === 0 || this.notPushCount === 2) {
                    if (cb) {
                        cb(null, '出牌成功。。。');
                    }
                    this.currentPlayerPushCardList = cards;
                    this.sendPlayerPushedCards(playerID, cards, cardsValue.name);
                    this.turnPlayerPushCard();
                } else {
                    console.log('牌型大小比较');
                    let result = this.carder.compareCard(cards, this.currentPlayerPushCardList);
                    console.log('*** room *** 比牌结果：' + result);
                    if (result === true) {
                        if (cb) {
                            cb(null, cardsValue);
                        }
                        this.currentPlayerPushCardList = cards;
                        this.sendPlayerPushedCards(playerID, cards, cardsValue.name);
                        this.turnPlayerPushCard();
                    } else {
                        if (cb) {
                            cb(result);
                        }
                    }
                }
            } else {
                if (cb) {
                    cb('非正确牌型，请重新选牌');
                }
            }
        }
    };
    //通知玩家出牌者和其出的牌
    sendPlayerPushedCards (playerID, cards, style) {
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i],"playerPushedCards",{playerID:playerID,cards:cards,style:style});
        }
        if (cards.length !== 0) {
            this.notPushCount = 0;
            let playerCards = playerManager.getCards(playerID);
            for (let i = 0; i < cards.length; i++) {
                let card = cards[i];
                for (let j = 0; j < playerCards.length; j++) {
                    if (card.id === playerCards[j].id) {
                        playerCards.splice(j, 1);
                        break;
                    }
                }
            }
            playerManager.setCards(playerID,playerCards);
            if (playerCards.length === 0) {
                this.winner = playerID;
                this.setState(roomState.GameOver);
            }
        }
    };
    //通知其他玩家显示自己手中剩余的牌
    playerShowRemainCards (playerID, remainCards) {
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i],"showOtherRemainCards",{playerID:playerID,remainCards:remainCards});
        }
    };

    //提示出牌
    playerRequestTipCards (playerID, cb) {
        let cardList = playerManager.getCards(playerID);
        console.log("拥有的牌"+JSON.stringify(cardList));
        if (cb) {
            let cardsList = this.carder.getTipCardsList(this.currentPlayerPushCardList, cardList);
            console.log("提示数组："+JSON.stringify(cardsList));
            if (cardsList !== false) {
                cb(null, cardsList);
            } else {
                cb('没有比上家大的牌！');
            }
        }
    };
    //游戏总成绩排序——>>从大到小
    sortScore () {
        let scoreList = {};
        for (let i = 0; i < this.playerList.length; i++) {
            let score = playerManager.getScore(this.playerList[i]);
            if (!scoreList.hasOwnProperty(score)) {
                scoreList[score] = 1;
            }
        }
        let keys = Object.keys(scoreList);
        keys.sort((a, b) => {
            return Number(b) - Number(a);
        });
        return keys;
    };
    //所有游戏结束
    allGameOver () {
        for (let i = 0; i < this.playerList.length; i++) {
            let playerID = this.playerList[i];
            this.gameInfo.userContents.push({
                head: playerManager.getInformation(playerID).avatarUrl,
                name: playerManager.getInformation(playerID).nickName,
                totalScore: playerManager.getScore(playerID),
                username: this.playerList[i]
            });
        }
        console.log("先看看 _gameInfo=" + JSON.stringify(this.gameInfo) + '\n');

        let playerInfoList = [];
        let scoreList = this.sortScore();
        let bigWinnerScore = scoreList[0];
        let tyrantScore = undefined;
        if (scoreList.length >= 2) {
            tyrantScore = scoreList[1];
        }
        for (let i = 0; i < this.playerList.length; i++) {
            let playerID = this.playerList[i];
            playerInfoList.push({
                accountID: playerID,
                nickName: playerManager.getInformation(playerID).nickName,
                avatarUrl: playerManager.getInformation(playerID).avatarUrl,
                score: playerManager.getScore(playerID)
            });
        }
        //保存游戏记录
        myDB.saveGameRecords("ddz",{
            gameRecord: this.gameRecord,
            gameInfo: this.gameInfo
        });
        //更新游戏总局数
        for (let i = 0, len = this.playerList.length; i < len; i++) {
            myDB.upDataTotalGamesByUniqueID(this.playerList[i]);
        }

        setTimeout(() => {
            for (let i = 0; i < this.playerList.length; i++) {
                playerManager.gameSend(this.playerList[i],"allGameOver",{
                    playerList: playerInfoList,
                    gameTime: this.startGameTime,
                    houseMasterID: this.creatorID,
                    bigWinnerScore: bigWinnerScore,
                    tyrantScore: tyrantScore
                });
            }
            this.roomManager.deleteRoom(this.roomID);
        }, 3000);
    };

    joinPlayer(playerID,roomManager,cb) {
        this.roomManager = roomManager;
        var seatIndex = getSeatIndex(this.playerList);
        if (seatIndex !== -1) {
            playerManager.initDDZGaming(playerID);
            this.playerList.push(playerID);
            cb({data:"success",seatIndex:seatIndex});
            return;
        }
        cb({data:"房间人数已满！"});
    }
    enterRoom(playerID,cb) {
        let info = playerManager.getInformation(playerID);
        info.seatIndex = playerManager.getSeatIndex(playerID);
        for (let i = 0; i < this.playerList.length; i++) {
            if (this.playerList[i] !== playerID) {
                playerManager.gameSend(this.playerList[i],"playerJoinRoom",info);
            }

        }
        let allInfo = [];
        for (let i = 0; i < this.playerList.length; i++) {
            let otherPlayerInfo = playerManager.getInformation(this.playerList[i]);
            otherPlayerInfo.seatIndex = playerManager.getSeatIndex(this.playerList[i]);
            otherPlayerInfo.accountID = this.playerList[i];
           allInfo.push(otherPlayerInfo);
        }
        cb({
            seatIndex: playerManager.getSeatIndex(playerID),
                readyPlayerList: this.readyPlayerList,
                playerData: allInfo
        });
    }
    getConfig() {
        let id = this.roomID;
        let gameType = this.roomConfig.gameType;
        let point = this.roomConfig.basicScore;
        let round = this.roomConfig.roundCount;
        let player = this.playerList.length;
        let totalPlayer = 3;
        return {roomID: id, gameType: gameType, point: point, round: round, player: player, totalPlayer: totalPlayer};
    }
    playerReady(playerID) {
        this.readyPlayerList.push(playerID);
        for (let i = 0, len = this.playerList.length; i < len; i++) {
            playerManager.gameSend(this.playerList[i],"playerReady",playerID);
        }
        //如果三个玩家都准备那就开始游戏
        if (this.readyPlayerList.length === 3) {
             this.setState(roomState.GameStart);
        }
    }
    //玩家掉线
    playerOffLine (playerID) {
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
                playerManager.gameSend(this.playerList[i],"otherLeaveRoom",playerManager.getInformation(playerID).seatIndex);
            }
        } else {
            for (let i = 0, len = this.playerList.length; i < len; i++) {//向房间其他玩家发送自己掉线消息
                playerManager.gameSend(this.playerList[i],"playerOffLine",playerManager.getInformation(playerID).seatIndex);
            }
        }
    };
    //玩家请求离开房间
    playerRequestLeaveRoom (playerID, cb) {
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
                    playerManager.gameSend(this.playerList[i],"otherLeaveRoom",playerID);
                }
                cb(null, '离开房间成功！');
            }
        }
    };

    //解散房间处理
     playerDestroyRoom (playerID, cb) {
        if (this.state === roomState.WaitingReady) {
            if (playerID === this.creatorID) {
                //解散房间时把房费还给房主（如果不是AA的话）
                if (this.roomConfig.roomRate.substr(0, 2) !== 'AA') {
                    let needDiamond = UnitTools.getNumFromStr(this.roomConfig.roomRate);
                    let diamondCount = myDB.getPlayerDiamondCount(playerID);
                    diamondCount+= needDiamond;
                    myDB.upDateDiamondCountByAccountID(this.creatorID, diamondCount);
                    console.log('\n** createRoom ** _houseManager.diamondCount = ' + diamondCount);
                }
                for (let i = 0, len = this.playerList.length; i < len; i++) {
                    playerManager.gameSend(this.playerList[i],"roomHasDestroyed",{});
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
                playerManager.gameSend(this.playerList[i],"destroyRoomRequest",{nickName: playerManager.getInformation(playerID).nickName,
                playerDataList:playerDataList});
            }
            cb(null);
        }
    };

    //玩家是否同意解散房间
    showDestroyRoomChoice (data) {
        this.chooseDestroyRoomCount++;
        if (data.choice === 1) {
            this.agreeDestroyRoomCount++;
        }
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i],"destroyRoomChoice",data);
        }
        console.log('\n _chooseDestroyRoomCount = ' + this.chooseDestroyRoomCount + ' ; _agreeDestroyRoomCount = ' + this.agreeDestroyRoomCount);
        if (this.chooseDestroyRoomCount === this.playerList.length) {
            if (this.chooseDestroyRoomCount === this.agreeDestroyRoomCount) {
                console.log('同意解散房间了');
                if (this.roundCount === 1 && this.state === roomState.GameOver || this.roundCount > 1) {
                    this.allGameOver();
                } else {
                    for (let i = 0; i < this.playerList.length; i++) {
                        playerManager.gameSend(this.playerList[i],"roomHasDestroyed",{});
                    }
                    this.roomManager.deleteRoom(this.roomID);
                }
            } else {
                for (let i = 0; i < this.playerList.length; i++) {
                    playerManager.gameSend(this.playerList[i],"destroyRoomFailed",{});
                }
            }
            this.chooseDestroyRoomCount = 0;
            this.agreeDestroyRoomCount = 0;
        }
    };

    //玩家发送表情
    faceChat (playerID, num) {
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i],"faceChat",{playerID:playerID,num:num});
        }
    };

    //玩家发送快捷语
    wordChat (playerID, num) {
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i],"wordChat",{playerID:playerID,num:num});
        }
    };

    //玩家发送动画聊天
    actionChat (data) {
        for (let i = 0, len = this.playerList.length; i < len; i++) {
            playerManager.gameSend(this.playerList[i],"actionChat",data);
        }
    };

    //托管
    showTrust (playerID) {
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i],"showTrust",playerID);
        }
    };

    //取消托管
    stopShowTrust (playerID) {
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i],"stopShowTrust",playerID);
        }
    };
}
module.exports = Room;