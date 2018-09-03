/**
 * Created by litengfei on 2017/10/9.
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
     * 设置账号和密码
     * @param playerID
     * @param account
     * @param pass
     */
    setAccountAndPass(playerID,account,pass){
        var info = this.getOrCreatePlayer(playerID);
        info.account = account;
        info.pass = pass;
    }

    /**
     * 玩家进入桌子
     * @param hallID
     * @param tableID
     * @param pos
     * @return 如果进入成功，返回位置
     */
    enterTable(playerID,hallID,tableID,pos){

    }

    /**
     * 玩家离开桌子
     * @param playerID
     * @return 离开成功返回true 离开失败返回false
     */
    leaveTable(playerID){

    }


    /**
     * 是否在桌子里
     * @param playerID
     */
    isInTable(playerID){

    }

    /**
     * 获得所在桌子的信息
     * @param playerID
     * @return {hallID,tableID,pos}
     */
    getTalbeInfo(playerID){

    }



}
module.exports = PlayerManager;