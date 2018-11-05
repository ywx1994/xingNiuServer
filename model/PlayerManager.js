/**
 * Created by youwenxing on 2018/9/18.
 */
var Map = require("./../core/Map.js");
class PlayerManager{
    constructor(){
        this.playerInfos = new Map();//isLogin
        this.onLineNums = 0;
    }

    /**
     * 获得或者创建playerID
     * @param playerID
     * @return 返回玩家的基础信息
     */
    getOrCreatePlayer(playerID){
        return this.playerInfos.getOrCreate(playerID);
    }
    /**
     * 获得在线的人数，即登录的人数
     */
    getOnlineNums(){
        return this.onLineNums;
    }

    /**
     * 设置登录状态
     * @param playerID
     * @param isLogin
     */
    setIsLogin(playerID,isLogin){
        var info = this.getOrCreatePlayer(playerID);
        if(isLogin == true && info.isLogin == false)this.onLineNums+=1;
        if(isLogin == false && info.isLogin == true && this.onLineNums > 0)this.onLineNums-=1;
        info.isLogin = isLogin;
    }
    /**
     * 得到登录状态
     * @param playerID
     */
    getIsLogin(playerID){
        return this.getOrCreatePlayer(playerID).isLogin;
    }

    /**
     * 设置游戏登录状态
     * @param playerID
     * @param isLogin
     */
    setIsLoginGame(playerID,isLogin){
        var info = this.getOrCreatePlayer(playerID);
        info.isLoginGame = isLogin;
    }
    /**
     * 得到登录游戏状态
     * @param playerID
     */
    getIsLoginGame(playerID){
        return this.getOrCreatePlayer(playerID).isLoginGame;
    }

    /**
     * 保存session
     * @param playerID
     * @param session
     */
    setSession(playerID,session){
        var info = this.getOrCreatePlayer(playerID);
        info.session = session;
    }
    /**
     * 获得session
     * @param playerID
     * @returns {Buffer | * | Session | null | module:http2.Http2Session}
     */
    getSession(playerID){
        return this.getOrCreatePlayer(playerID).session;
    }

    /**
     * 保存gameSession
     * @param playerID
     * @param session
     */
    setGameSession(playerID,session){
        var info = this.getOrCreatePlayer(playerID);
        info.gameSession = session;
    }
    /**
     * 获得gameSession
     * @param playerID
     * @returns {Buffer | * | Session | null | module:http2.Http2Session}
     */
    getGameSession(playerID){
        return this.getOrCreatePlayer(playerID).gameSession;
    }

    getPlayer(playerID){
        return this.getOrCreatePlayer(playerID);
    }
    //是否有该玩家
    hasPlayer(playerID){
        return this.playerInfos.hasKey(playerID);
    }
    //删除该玩家
    deletePlayer(playerID){
        this.playerInfos.remove(playerID);
    }

    //保存玩家资料
    setInformation(playerID,accountInfo,userInfo){
        var info = this.getOrCreatePlayer(playerID);
        info.information = {};
        info.information.accountID = playerID;
        info.information.createDate = accountInfo.create_date;
        info.information.ip = accountInfo.last_login_ip;
        info.information.platfrom = accountInfo.last_login_platfrom;
        info.information.nickName = accountInfo.nick_name;
        info.information.avatarUrl = accountInfo.avatar_url;
        info.information.sex = accountInfo.sex === 2?accountInfo.sex :1;
        info.information.city = accountInfo.city;
        info.information.diamond = userInfo.diamond;
        info.information.gold = userInfo.gold;
        info.information.ranking = userInfo.ranking;
        info.information.totalGame = userInfo.total_game;
    }
    getInformation(playerID){
        return this.getOrCreatePlayer(playerID).information;
    }
    addTotalGame(playerID){
        var info = this.getOrCreatePlayer(playerID);
        info.information.totalGame += 1;
    }

    /**
     * 设置游戏服务器url
     * @param playerID
     * @param url
     * @param gameType
     */
    setGameUrl(playerID,url,gameType){
        var info = this.getOrCreatePlayer(playerID);
        info.gameUrl = {url:url,gameType:gameType};
    }
    /**
     * 获取游戏服务器url
     * @param playerID
     * @returns {*}
     */
    getGameUrl(playerID){
        return this.getOrCreatePlayer(playerID).gameUrl;
    }

    getTable(playerID){
        var info = this.getOrCreatePlayer(playerID);
        return info.table;
    }

    /**
     * 玩家进入桌子
     * @param playerID
     * @param room
     * @param seatIndex
     * @return 如果进入成功，返回位置
     */
    enterTable(playerID,room,seatIndex){
        var info =  this.getOrCreatePlayer(playerID);
        info.table = room;
        info.seatIndex = seatIndex;
        info.isInTable = true;
    }
    /**
     * 获得所在桌子的信息
     * @param playerID
     * @return {hallID,tableID,pos}
     */
    getSeatIndex(playerID){
        return this.getOrCreatePlayer(playerID).seatIndex;
    }
    /**
     * 是否在桌子里
     * @param playerID
     */
    isInTable(playerID){
        return this.getOrCreatePlayer(playerID).isInTable;
    }
    /**
     * 玩家离开桌子
     * @param playerID
     * @return 离开成功返回true 离开失败返回false
     */
    leaveTable(playerID){
        var info =  this.getOrCreatePlayer(playerID);
        info.tableInfo = null;
        info.table = null;
        info.isInTable = false;
        info.gameUrl = null;
        info.gameSession = null;
        info.gameInfo = null;
    }


    /**
     * 向客户端发送消息
     * @param playerID
     * @param eventName
     * @param data
     */
    send(playerID,eventName,data){
        var session = this.getSession(playerID);
        if(session){
            try{
                session.proxy[eventName].apply(session.proxy,[data]);
            }catch(e){

            }
        }
    }
    gameSend(playerID,eventName,data){
        var session = this.getGameSession(playerID);
        if(session){
            try{
                session.proxy[eventName].apply(session.proxy,[data]);
            }catch(e){

            }
        }
    }

    /**
     *游戏参数
     */
    getGameInfo(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo;
    }
    //倍数
    setMultiple(playerID,multiple){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.multiple = multiple;
    }
    getMultiple(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.multiple;
    }
    //是否庄
    setIsBanker(playerID,flag){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.isBanker = flag;
    }
    getIsBanker(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.isBanker;
    }
    //是否正在游戏
    setIsGaming(playerID,isGaming){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.isGaming = isGaming;
    }
    getIsGaming(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.isGaming;
    }
    //手牌
    setCards(playerID,cards){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.cards = cards;
    }
    getCards(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.cards;
    }
    //总积分
    setScore(playerID,score){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.score = score;
    }
    getScore(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.score;
    }
    //单局积分
    setSingleScore(playerID,score){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.singleScore = score;
    }
    getSingleScore(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.singleScore;
    }
    //加积分
    addSingleScoreToScore(playerID){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.score += info.gameInfo.singleScore;
    }
    //减积分
    deleteScore(playerID,score){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.score -= score;
    };
    //加积分
    addScore(playerID,score){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.score += score;
    }
    /**
     * 斗地主玩家参数
     */
    initDDZGaming(playerID){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo = {};
        info.gameInfo.score = 0;
        info.gameInfo.singleScore = 0;
        info.gameInfo.isGaming = false;
        info.gameInfo.cards = [];
        info.gameInfo.multiple = undefined;
    }

    /**
     * 牛牛玩家参数
     */
    initNiuNiuGaming(playerID){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo = {};
        info.gameInfo.cards = [];
        info.gameInfo.cardsValue = undefined;
        info.gameInfo.score = 0;
        info.gameInfo.singleScore = 0;
        info.gameInfo.isGaming = false;
        info.gameInfo.isShowDownCards = false;
        info.gameInfo.multiple = undefined;
        info.gameInfo.XJTZCount = 0;
        info.gameInfo.isBanker = false;
        info.gameInfo.playerBet = 0;
        info.gameInfo.robBankerMultiples = 1;//抢庄倍数
    }
    singleGameEndInit(playerID){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.cards = [];
        info.gameInfo.isShowDownCards = false;
        info.gameInfo.cardsValue = undefined;
        info.gameInfo.multiple = undefined;
        info.gameInfo.playerBet = 0;
        info.gameInfo.robBankerMultiples = 1;
    }
    //抢庄倍数
    setRobBankerMultiples(playerID,value){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.robBankerMultiples = value;
    }
    getRobBankerMultiples(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.robBankerMultiples;
    }
    //是否亮牌
    setIsShowDownCards(playerID,flag){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.isShowDownCards = flag;
    }
    getIsShowDownCards(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.isShowDownCards;
    }
    //牌值
    setCardsValue(playerID,value){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.cardsValue = value;
    }
    getCardsValue(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.cardsValue;
    }
    //闲家推注
    setPlayerBet(playerID,bet){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.playerBet = bet;
    }
    getPlayerBet(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.playerBet;
    }
    //闲家推注次数
    setXJTZCount(playerID,count){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.XJTZCount = count;
    }
    getXJTZCount(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.XJTZCount;
    }

    /**
     * 拼三张参数
     */
    initPSZGaming(playerID){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo = {};
        info.gameInfo.score = 0;
        info.gameInfo.singleScore = 0;
        info.gameInfo.isGaming = false;
        info.gameInfo.cards = [];
        info.gameInfo.isBanker = false;
        info.gameInfo.chips = 0;
        info.gameInfo.isDisCard = false;
        info.gameInfo.isLookCards = false;
        info.gameInfo.award = 0;
    }
    setAward(playerID,award){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.award = award;
    }
    getAward(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.award;
    }
    addAward(playerID,award){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.award += award;
    }
    //下注
    setChips(playerID,chips){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.chips = chips;
    }
    getChips(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.chips;
    }
    //是否弃牌
    setIsDisCard(playerID,flag){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.isDisCard = flag;
    }
    getIsDisCard(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.isDisCard;
    }
    //是否看牌
    setIsLookCards(playerID,flag){
        var info = this.getOrCreatePlayer(playerID);
        info.gameInfo.isLookCards = flag;
    }
    getIsLookCards(playerID){
        return this.getOrCreatePlayer(playerID).gameInfo.isLookCards;
    }
}
PlayerManager.g = new PlayerManager();
module.exports = PlayerManager.g;