var Carder = require("./Carder.js");
var playerManager = require("./../../model/PlayerManager.js");
var UnitTools = require("../../core/UnitTools");
var myDB = require("../../core/db");
//分配座位
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
//获取数个随机数
const getRandomStr = function (count) {
    let str = '';
    for (let i = 0; i < count; i++) {
        str += Math.floor(Math.random() * 10);
    }
    return str;
};
//随机获取庄家
const getFirstCaller = function (num) {
    let randomNum = getRandomStr(1);
    if (randomNum >= num) {
        return getFirstCaller(num);
    } else {
        return randomNum;
    }
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
const roomState = {
    Invalide: -1,
    WaitingReady: 0,
    GameStart: 1,
    PushCard: 2,
    playGame: 3,
    gameOver: 4
};

class Room {
    constructor(playerID, roomID, roomConfig) {
        this.creatorID = playerID;//创建者
        this.roomID = roomID;//房间号
        this.roomConfig = roomConfig;//房间配置信息
        this.type = roomConfig.gameType;//游戏类型
        this.firstPlayerID = undefined;
        this.playerList = [];                 //玩家列表
        this.readyPlayerList = [];            //准备玩家
        this.startPlayerList = [];            //已开始游戏玩家列表
        this.playGamePlayerList = [];        //还在游戏的玩家
        this.pushPlayerList = [];            //循环出牌玩家列表
        this.state = roomState.Invalide;    //游戏进行过程
        this.banker = undefined;            //庄家
        this.dealer = new Carder();          //荷官
        this.allCards = undefined;
        this.isPlaying = false;            // 是否在游戏中的标志
        this.agreeDestroyRoomCount = 0;    // 选择解散的玩家
        this.chooseDestroyRoomCount = 0;   // 选择或拒绝解散的玩家
        this.bout = 0;                    // 回合
        this.roundCount = 0;              // 局数
        this.canAddChips = 0;             // 加注剩余值
        this.nowChips = 0;                // 当前注数
        this.totalChips = 0;              // 总注数
        this.startGameTime = undefined;  // 游戏开局时间
        this.gameRecord = {};             // 游戏记录(包含_gameInfo)
        this.gameInfo = {gameItemContents: [], userContents: []};         //游戏具体记录
        this.setState(roomState.WaitingReady);
        this.roomManager = undefined;
        this.SDYJ = false;//false:金大于顺；true:顺大于金
        this.BZSJJF = false;//false:豹子顺金不加分；true:豹子顺金加分
        this.XTPXKZS = false;//false:相同牌型比花色；true:相同牌型开者输
        this.BPJB = false; //false:比牌不加倍；true:比牌加倍
        this.A23 = 1; //A23的值 1：A23为散牌；2：A23为最小顺；3：A23为最大顺
        this.timeOutAutoAction = 1;//1:不操作 2:自动弃牌 3:自动跟注
        this.S235GreaterThanAAA = false; //false:235大于豹子；true:235大于AAA
        this.nowPlayer = undefined;//轮到当前操作的玩家
        let GJSZ = this.roomConfig.GJSZ;
        for (let i = 0; i < GJSZ.length; i++) {
            if (GJSZ[i] === "顺>金花") {
                this.SDYJ = true;
            }
            if (GJSZ[i] === "豹子顺金加分") {
                this.BZSJJF = true;
            }
            if (GJSZ[i] === "相同牌型开者输") {
                this.XTPXKZS = true;
            }
            if (GJSZ[i] === "比牌加倍") {
                this.BPJB = true;
            }
        }
        let TSGZ = this.roomConfig.spaceilRule;
        for (let i = 0; i < TSGZ.length; i++) {
            if (TSGZ[i] === "A23为最小顺") {
                this.A23 = 2;
            }
            if (TSGZ[i] === "A23为最大顺") {
                this.A23 = 3;
            }
            if (TSGZ[i] === "自动弃牌") {
                this.timeOutAutoAction = 2;
            }
            if (TSGZ[i] === "自动跟注") {
                this.timeOutAutoAction = 3;
            }
            if (TSGZ[i] === "散235>AAA") {
                this.S235GreaterThanAAA = true;
            }
        }
    }

    async setState(state) {
        if (state === this.state) {
            return;
        }
        switch (state) {
            case roomState.WaitingReady:
                this.state = state;
                break;
            case roomState.GameStart:
                this.startPlayerList = [];
                if (this.startGameTime === undefined) {
                    this.startGameTime = getLocalDateStr();
                }
                this.isPlaying = true;
                this.startPlayerList = this.readyPlayerList;
                this.readyPlayerList = [];
                console.log('开始游戏的玩家有几个？' + this.startPlayerList.length);
                if (this.roomConfig.roomRate.substr(0, 2) === 'AA') {
                    console.log('游戏开始了，这是AA支付，每位玩家都应扣除相应的钻石');
                    let needDiamond = UnitTools.getNumFromStr(this.roomConfig.roomRate);
                    for (let i = 0, len = this.startPlayerList.length; i < len; i++) {
                        let playerID = this.startPlayerList[i];
                        if (!playerManager.getIsGaming(playerID)) {
                            playerManager.setIsGaming(playerID, true);
                            let diamondCount = await myDB.getPlayerDiamondCount(playerID);
                            let hasMoney = Number(diamondCount[0].diamond);
                            hasMoney -= needDiamond;
                            myDB.upDateDiamondCountByAccountID(playerID, hasMoney);
                        }
                    }
                }

                this.roundCount++;
                this.playGamePlayerList = [];
                this.pushPlayerList = [];
                this.canAddChips = 9;
                this.nowChips = this.roomConfig.basicScore;
                this.totalChips = this.roomConfig.basicScore * this.startPlayerList.length;
                let startPlayerList = [];
                for (let i = 0, len = this.startPlayerList.length; i < len; i++) {
                    playerManager.setChips(this.playerList[i], this.nowChips);
                    startPlayerList.push(this.startPlayerList[i]);
                }
                for (let i = 0; i < this.playerList.length; i++) {
                    playerManager.gameSend(this.playerList[i], "gameStart", {
                        canAddChips: this.canAddChips,
                        nowChips: this.nowChips,
                        totalChips: this.totalChips,
                        startPlayerList: startPlayerList
                    });

                }
                if (this.banker === undefined) {
                    this.banker = this.startPlayerList[getFirstCaller(this.startPlayerList.length)];
                    playerManager.setIsBanker(this.banker, true);
                }
                for (let i = 0; i < this.playerList.length; i++) {
                    playerManager.gameSend(this.playerList[i], "showBanker", this.banker);
                }
                this.state = state;
                this.setState(roomState.PushCard);
                break;
            case roomState.PushCard:
                if (this.allCards === undefined || this.allCards.length < this.startPlayerList.length * 3) {
                    this.allCards = this.dealer.getCards();
                }
                for (let i = 0, len1 = this.playerList.length; i < len1; i++) {
                    let mark = false;       //开始游戏玩家的标志
                    for (let j = 0, len2 = this.startPlayerList.length; j < len2; j++) {
                        if (this.playerList[i] === this.startPlayerList[j]) {
                            mark = true;
                            let cardList = [];
                            for (let i = 0; i < 3; i++) {
                                cardList.push(this.allCards.pop());
                            }
                            cardList.sort((a, b) => {
                                return b.id - a.id;
                            });
                            playerManager.setCards(this.playerList[i], cardList);
                            playerManager.gameSend(this.playerList[i], "pushCard", cardList);
                            break;
                        }
                    }
                    if (!mark) {
                        playerManager.gameSend(this.playerList[i], "pushCard", 3);
                    }
                }
                this.state = state;
                this.setState(roomState.playGame);
                break;
            case roomState.playGame:
                for (let i = 0, len = this.startPlayerList.length; i < len; i++) {
                    let information = playerManager.getInformation(this.startPlayerList[i]);
                    let seatIndex = playerManager.getSeatIndex(this.startPlayerList[i]);
                    this.playGamePlayerList.push({
                        accountID: information.accountID,
                        seatIndex: seatIndex,
                        nickName: information.nickName,
                        avatarUrl: information.avatarUrl,
                        flag: true
                    });
                }
                this.bout = 0;
                this.turnPushCardPlayer();
                this.state = state;
                break;
            case roomState.gameOver:
                this.state = state;
                this.isPlaying = false;
                if (this.BZSJJF) {
                    for (let i = 0; i < this.playGamePlayerList.length; i++) {
                        let playerID = this.playGamePlayerList[i].accountID;
                        let cards = playerManager.getCards(playerID);
                        let cardsValue = this.dealer.getPlayerCardsValue(cards,this.A23);
                        if (cardsValue.value === 6) {
                            for (let j = 0; j < this.playGamePlayerList.length; j++) {
                                if (this.playGamePlayerList[j].accountID === playerID) {
                                    playerManager.addAward(this.playGamePlayerList[j].accountID, 10 * (this.playGamePlayerList.length - 1));
                                } else {
                                    playerManager.addAward(this.playGamePlayerList[j].accountID, -10);
                                }
                            }
                        }else if (cardsValue.value === 5) {
                            for (let j = 0; j < this.playGamePlayerList.length; j++) {
                                if (this.playGamePlayerList[j].accountID === playerID) {
                                    playerManager.addAward(this.playGamePlayerList[j].accountID, 5 * (this.playGamePlayerList.length - 1));
                                } else {
                                    playerManager.addAward(this.playGamePlayerList[j].accountID, -5);
                                }
                            }
                        }
                    }
                }
                let settlementList = [];
                for (let i = 0; i < this.playGamePlayerList.length; i++) {
                    let playerID = this.playGamePlayerList[i].accountID;
                    let information = playerManager.getInformation(playerID);
                    let seatIndex = playerManager.getSeatIndex(playerID);
                    let cards = playerManager.getCards(playerID);
                    let cardsValue = this.dealer.getPlayerCardsValue(cards,this.A23);
                    let chips = playerManager.getChips(playerID);
                    if (playerID === this.banker) {
                        settlementList.push({
                            seatIndex: seatIndex,
                            avatarUrl: information.avatarUrl,
                            cards: cards,
                            cardsValue:cardsValue.value,
                            award: this.BZSJJF? playerManager.getAward(playerID):false,
                            nickName: information.nickName,
                            money: this.totalChips - chips
                        });
                        playerManager.setSingleScore(playerID, this.totalChips - chips);
                        playerManager.addSingleScoreToScore(playerID);
                        playerManager.addScore(playerID,playerManager.getAward(playerID));
                    } else {
                        settlementList.push({
                            seatIndex: seatIndex,
                            avatarUrl: information.avatarUrl,
                            cards: cards,
                            cardsValue:cardsValue.value,
                            award: this.BZSJJF? playerManager.getAward(playerID):false,
                            nickName: information.nickName,
                            money: -chips
                        });
                        playerManager.setSingleScore(playerID, -chips);
                        playerManager.addSingleScoreToScore(playerID);
                        playerManager.addScore(playerID,playerManager.getAward(playerID));
                    }
                }

                for (let i = 0, len = this.startPlayerList.length; i < len; i++) {
                    let playerID = this.startPlayerList[i];
                    playerManager.setAward(playerID,0);
                    if (playerManager.getIsDisCard(playerID)) {
                        playerManager.setIsDisCard(playerID, false);
                    }
                    if (playerManager.getIsLookCards(playerID)) {
                        playerManager.setIsLookCards(playerID, false);
                    }
                }
                for (let i = 0; i < this.playerList.length; i++) {
                    playerManager.setCards(this.playerList[i], []);
                    playerManager.gameSend(this.playerList[i], "settlementPSZ", settlementList);
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
                    let isBanker = false;
                    if (this.playerList[i] === this.banker) {
                        isBanker = true;
                    }
                    this.gameInfo.gameItemContents[this.gameInfo.gameItemContents.length - 1].itemUsers.push({
                        banker: isBanker,
                        username: this.playerList[i],
                        win: playerManager.getSingleScore(this.playerList[i])
                    });
                }
                console.log("再看看 _gameInfo=" + JSON.stringify(this.gameInfo) + '\n');

                if (this.roundCount === this.roomConfig.roundCount) {
                    this.allGameOver();
                }
                break;
        }
    };

    referTurnPushPlayer() {
        this.playGamePlayerList.sort((a, b) => {
            return b.seatIndex - a.seatIndex;
        });
        let index = -1;
        for (let i = 0; i < this.playGamePlayerList.length; i++) {
            if (this.playGamePlayerList[i].seatIndex === playerManager.getSeatIndex(this.banker)) {
                index = i;
                break;
            }
        }
        for (let i = 0; i < this.playGamePlayerList.length; i++) {
            this.pushPlayerList.push(this.playGamePlayerList[index]);
            index++;
            if (index >= this.playGamePlayerList.length) {
                index -= this.playGamePlayerList.length;
            }
        }
    };

    turnPushCardPlayer() {
        if (this.pushPlayerList.length === 0) {
            this.referTurnPushPlayer();
            this.bout++;
            if (this.bout > Number(this.roomConfig.limitRound)) {
                for (let i = 0; i < this.playerList.length; i++) {
                    playerManager.setYGDD(this.playerList[i],false);
                    playerManager.gameSend(this.playerList[i], "outOfBout", {});
                }
            } else {
                for (let i = 0; i < this.playerList.length; i++) {
                    playerManager.gameSend(this.playerList[i], "changePSZBout", this.bout);
                }
            }
        }
        let seat = -1;
        let flag = false;
        do {
            if (this.pushPlayerList.length === 0) {
                flag = true;
                break;
            } else {
                let player = this.pushPlayerList.pop();
                if (player.flag) {
                    seat = player.seatIndex;
                }
            }
        } while (seat === -1);
        if (flag) {
            this.turnPushCardPlayer();
        } else {
            for (let i = 0; i < this.playerList.length; i++) {
                if (playerManager.getSeatIndex(this.playerList[i]) === seat) {
                    this.nowPlayer = this.playerList[i];
                    this.timer();
                    break;
                }
            }
            for (let i = 0; i < this.playerList.length; i++) {
                playerManager.gameSend(this.playerList[i], "turnToPlay", seat);
            }
        }
    }
    ;

//减少玩家并判断是否结束
    removePlayGamePlayer(seatIndex) {
        for (let i = 0; i < this.playGamePlayerList.length; i++) {
            if (this.playGamePlayerList[i].seatIndex === seatIndex) {
                this.playGamePlayerList[i].flag = false;
                break;
            }
        }
        for (let i = 0; i < this.playerList.length; i++) {
            if (playerManager.getSeatIndex(this.playerList[i]) === seatIndex) {
                playerManager.setIsDisCard(this.playerList[i], true);
            }
            playerManager.gameSend(this.playerList[i], "outRoundPlayer", seatIndex);
        }
        let index = 0;
        let lastPlayer = undefined;
        for (let i = 0; i < this.playGamePlayerList.length; i++) {
            if (this.playGamePlayerList[i].flag) {
                index++;
                lastPlayer = this.playGamePlayerList[i].accountID;
            }
        }
        if (index === 1) {
            playerManager.setIsBanker(this.banker, false);
            this.banker = lastPlayer;
            console.log("testIsBanker" + lastPlayer);
            playerManager.setIsBanker(this.banker, true);
            this.setState(roomState.gameOver);
        } else {
            this.turnPushCardPlayer();
        }
    };

    timer(){
        let time = 16;
        if (playerManager.getYGDD(this.nowPlayer)){
            time = 1;
        }
        this.t =setInterval(()=>{
            //console.log(time);
            time--;
            if(time<0){
                if (this.timeOutAutoAction === 3 ||playerManager.getYGDD(this.nowPlayer)) {
                    this.addChips(this.nowPlayer,0,data=>{
                        playerManager.setChips(this.nowPlayer,playerManager.getChips(this.nowPlayer)+data);
                    });
                }else if (this.timeOutAutoAction === 2) {
                    playerManager.setIsLookCards(this.nowPlayer, false);
                    playerManager.setIsDisCard(this.nowPlayer, true);
                    this.playerAbandon(this.nowPlayer);
                }else {
                    this.stopTimer();
                }
            }
        },1000);
    }
    stopTimer(){
        clearInterval(this.t);
    }
//弃牌
    playerAbandon(playerID) {
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "playerChoice", {
                seatIndex: playerManager.getSeatIndex(playerID),
                choice: 0
            });
        }
        this.stopTimer();
        this.removePlayGamePlayer(playerManager.getSeatIndex(playerID));

    };

//看牌
    lookCards(playerID) {
        playerManager.setIsLookCards(playerID, true);
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "playerChoice", {
                seatIndex: playerManager.getSeatIndex(playerID),
                choice: 1
            });
        }
    }
    ;

//获取比牌对手
    getComparePlayer(playerID, cb) {
        let playerList = [];
        for (let i = 0; i < this.playGamePlayerList.length; i++) {
            if (this.playGamePlayerList[i].flag && this.playGamePlayerList[i].seatIndex !== playerManager.getSeatIndex(playerID)) {
                playerList.push(this.playGamePlayerList[i]);
            }
        }
        if (cb) {
            cb(playerList);
        }
    }
    ;

//比牌
    compareCards(seatIndex1, seatIndex2) {
        let player1 = undefined;
        let player2 = undefined;
        for (let i = 0; i < this.startPlayerList.length; i++) {
            if (playerManager.getSeatIndex(this.startPlayerList[i]) === seatIndex1) {
                player1 = this.startPlayerList[i];
            }
            if (playerManager.getSeatIndex(this.startPlayerList[i]) === seatIndex2) {
                player2 = this.startPlayerList[i];
            }
        }
        this.stopTimer();
        //true为1赢，false为2赢
        let result = this.dealer.compare(playerManager.getCards(player1), playerManager.getCards(player2), this.SDYJ, this.XTPXKZS, this.A23, this.S235GreaterThanAAA);
        setTimeout(() => {
            if (result) {
                this.removePlayGamePlayer(seatIndex2);
            } else {
                this.removePlayGamePlayer(seatIndex1);
            }
        }, 5000);
        for (let i = 0; i < this.playerList.length; i++) {
            // let seatIndex = _playerList[i].seatIndex;
            // let flag = false;
            let cards1 = [];
            let cards2 = [];
            if (playerManager.getIsLookCards(player1)){
                cards1 = playerManager.getCards(player1);
            }
            if (playerManager.getIsLookCards(player2)){
                cards2 = playerManager.getCards(player2);
            }
            // if (seatIndex === seatIndex1 || seatIndex === seatIndex2) {
            //     flag = true;
            // }
            // if (flag) {
            //     cards1 = player1.cards;
            //     cards2 = player2.cards;
            // }
            let information1 = playerManager.getInformation(player1);
            let information2 = playerManager.getInformation(player2);
            if (this.playerList[i] === player1) {
                playerManager.gameSend(this.playerList[i], "compareResult", [{
                    nickName: information1.nickName,
                    avatarUrl: information1.avatarUrl,
                    result: result,
                    cards: cards1
                },
                    {nickName: information2.nickName, avatarUrl: information2.avatarUrl, result: !result, cards: []}]);
            }else if (this.playerList[i] === player2) {
                playerManager.gameSend(this.playerList[i], "compareResult", [{
                    nickName: information1.nickName,
                    avatarUrl: information1.avatarUrl,
                    result: result,
                    cards: []
                },
                    {nickName: information2.nickName, avatarUrl: information2.avatarUrl, result: !result, cards: cards2}]);
            }else {
                playerManager.gameSend(this.playerList[i], "compareResult", [{
                    nickName: information1.nickName,
                    avatarUrl: information1.avatarUrl,
                    result: result,
                    cards: []
                },
                    {nickName: information2.nickName, avatarUrl: information2.avatarUrl, result: !result, cards: []}]);
            }
        }
    }
    ;

    addChips(playerID, chips, cb) {
        let choice = -1;
        let compareFlag = false;
        if (chips === 0) {
            choice = 4;
        } else if (chips === -1) {
            choice = 2;
            compareFlag = true;
            chips = 0;
        } else {
            choice = 3;
        }
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "playerChoice", {
                seatIndex: playerManager.getSeatIndex(playerID),
                choice: choice
            });
        }
        this.canAddChips -= chips;
        this.nowChips += chips;
        let addChips = 0;
        if (playerManager.getIsLookCards(playerID)) {
            addChips = addChips + this.nowChips * 2;
        } else {
            addChips += this.nowChips;
        }
        if (compareFlag && this.BPJB) {
            addChips *= 2;
        }
        this.totalChips += addChips;
        if (cb) {
            cb(addChips);
        }
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "changeChips", {
                seatIndex: playerManager.getSeatIndex(playerID),
                canAddChips: this.canAddChips,
                nowChips: addChips,
                totalChips: this.totalChips
            });
        }
        if (!compareFlag) {
            this.stopTimer();
            this.turnPushCardPlayer();
        }
    }
    ;

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
    }
    ;

    allGameOver() {
        for (let i = 0; i < this.playerList.length; i++) {
            this.gameInfo.userContents.push({
                head: playerManager.getInformation(this.playerList[i]).avatarUrl,
                name: playerManager.getInformation(this.playerList[i]).nickName,
                totalScore: playerManager.getScore(this.playerList[i]),
                username: this.playerList[i]
            });
        }
        console.log("先看看 _gameInfo=" + JSON.stringify(this.gameInfo) + '\n');

        //----------------------------------- 全部游戏结束，保存到数据库 begin----------------------------------
        let playerInfoList = [];
        let scoreList = this.sortScore();
        let bigWinnerScore = scoreList[0];
        let tyrantScore = undefined;
        if (scoreList.length >= 2) {
            tyrantScore = scoreList[1];
        }
        for (let i = 0; i < this.playerList.length; i++) {
            playerInfoList.push({
                accountID: this.playerList[i],
                nickName: playerManager.getInformation(this.playerList[i]).nickName,
                avatarUrl: playerManager.getInformation(this.playerList[i]).avatarUrl,
                score: playerManager.getScore(this.playerList[i])
            });
        }
        //保存游戏记录
        myDB.saveGameRecords("psz", {
            gameRecord: this.gameRecord,
            gameInfo: this.gameInfo
        });
        //有参与游戏的玩家游戏总局数+1
        for (let i = 0, len = this.playerList.length; i < len; i++) {
            if (playerManager.getIsGaming(this.playerList[i])) {
                myDB.upDataTotalGamesByUniqueID(this.playerList[i]);
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
    }
    ;

    joinPlayer(playerID, roomManager, cb) {
        this.roomManager = roomManager;
        if (this.playerList.length === 0) {
            this.setState(roomState.WaitingReady);
            this.firstPlayerID = playerID;
        }
        var seatIndex = getSeatIndex(this.playerList);
        if (seatIndex !== -1) {
            playerManager.enterTable(playerID, this.roomID, seatIndex);
            playerManager.initPSZGaming(playerID);
            this.playerList.push(playerID);
            cb({data: "success", seatIndex: seatIndex});
            return;
        }
        cb({data: "房间人数已满！"});
    }

    enterRoom(playerID, cb) {
        let info = playerManager.getInformation(playerID);
        info.seatIndex = playerManager.getSeatIndex(playerID);
        info.isBanker = playerManager.getIsBanker(playerID);
        info.score = playerManager.getScore(playerID);
        info.chips = playerManager.getChips(playerID);
        info.cards = playerManager.getCards(playerID);
        info.ranking = playerManager.getCards(playerID);
        for (let i = 0; i < this.playerList.length; i++) {
            if (playerID !== this.playerList[i]) {
                playerManager.gameSend(this.playerList[i], "playerJoinRoom", info);
            }
        }
        if (this.playerList.length === 1) {
            playerManager.gameSend(playerID, "canStartGame", {});//给房主开始游戏的权利
        }
        let playerData = [];
        for (let i = 0; i < this.playerList.length; i++) {
            let otherPlayerInfo = playerManager.getInformation(this.playerList[i]);
            otherPlayerInfo.accountID = this.playerList[i];
            otherPlayerInfo.seatIndex = playerManager.getSeatIndex(this.playerList[i]);
            otherPlayerInfo.isBanker = playerManager.getIsBanker(this.playerList[i]);
            otherPlayerInfo.chips = playerManager.getChips(this.playerList[i]);
            otherPlayerInfo.score = playerManager.getScore(this.playerList[i]);
            otherPlayerInfo.cards = playerManager.getCards(this.playerList[i]).length;
            otherPlayerInfo.isDiscard = playerManager.getIsDisCard(this.playerList[i]);
            otherPlayerInfo.isLookCards = playerManager.getIsLookCards(this.playerList[i]);
            playerData.push(otherPlayerInfo);
        }
        let readyPlayerList = [];
        for (let i = 0; i < this.readyPlayerList.length; i++) {
            readyPlayerList.push(this.readyPlayerList[i]);
        }
        let startPlayerList = [];
        for (let i = 0; i < this.startPlayerList.length; i++) {
            startPlayerList.push(this.startPlayerList[i]);
        }
        if (cb) {
            cb({
                firstPlayerID: this.firstPlayerID,
                seatIndex: playerManager.getSeatIndex(playerID),
                playerData: playerData,
                readyPlayerList: readyPlayerList,
                startPlayerList: startPlayerList,
                houseManagerID: this.creatorID,
                totalChips: this.totalChips,
                bout: this.bout
            });
        }
    }
    ;

    /**
     * 给每个玩家发送自己准备好了的消息
     * @param playerID
     */
    playerReady(playerID) {
        if (this.isPlaying) {
            playerManager.gameSend(playerID, "cannotSeat", "游戏已开始，请在本局结束后加入");
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
    }
    ;

    /**
     * 当房间第一个玩家点击开始游戏，下发通知其他玩家游戏开始了
     */
    firstPlayerStartGame() {
        this.setState(roomState.GameStart);
    }
    ;

    /**
     * 当第一位玩家掉线了，下发消息通知其他玩家，将开始游戏的权利交给其他玩家
     * 如果下一个玩家准备好了，就要将他从_readyPlayerList中删掉
     */
    getConfig() {
        let id = this.roomID;
        let gameType = this.roomConfig.gameType;
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
    }
    ;

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
    }
    ;

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
    }
    ;

//解散房间处理
    async playerDestroyRoom(playerID, cb) {
        if (this.state === roomState.WaitingReady) {
            if (playerID === this.creatorID) {
                //解散房间时把房费还给房主（如果不是AA的话）
                if (this.roomConfig.roomRate.substr(0, 2) !== 'AA') {
                    let needDiamond = UnitTools.getNumFromStr(this.roomConfig.roomRate);
                    let diamondCount = await
                        myDB.getPlayerDiamondCount(playerID);
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
    }
    ;

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
    }
    ;

//玩家发送表情
    faceChat(playerID, num) {
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "faceChat", {playerID: playerID, num: num});
        }
    }
    ;

//玩家发送快捷语
    wordChat(playerID, num) {
        for (let i = 0; i < this.playerList.length; i++) {
            playerManager.gameSend(this.playerList[i], "wordChat", {playerID: playerID, num: num});
        }
    }
    ;

//玩家发送动画聊天
    actionChat(data) {
        for (let i = 0, len = this.playerList.length; i < len; i++) {
            playerManager.gameSend(this.playerList[i], "actionChat", data);
        }
    }
    ;
}

module.exports = Room;