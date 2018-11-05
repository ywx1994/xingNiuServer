const mysql = require('mysql');
let client = undefined;
/**
 * 数据库查询
 * @param sql   查询语句
 * @param cb    回调
 */
const query = async function (sql) {
    return new Promise(function (resolve, reject) {
        client.getConnection((err, connection) => {
            if (err) {
                console.log('*** db *** get connection = ' + err + "\n");
                reject(err);
            } else {
                // console.log("begin query......");
                connection.query(sql, (connErr, result) => {
                    if (connErr) {
                        console.log(sql + connErr);
                        reject(connErr);
                    } else {
                        resolve(result);
                    }
                    connection.release();
                })
            }
        });
    });
};
//获取账号信息
exports.getAccountInfoByUid = async function (uid) {
    let sql = "select * from t_account where uid = '" + uid + "' ;";
    let data = await query(sql).catch(function (err) {
        console.log("*** app *** isPlayerIsExit err = " + err);
    });
    return Promise.resolve(data);
};
//获取玩家信息
exports.getAccountInfoByAccount = async function(accountID){
    let sql = "select * from t_account where account_id = '" + accountID + "' ;";
    let data = await query(sql).catch(function (err) {
        console.log("*** app *** isPlayerIsExit err = " + err);
    });
    return Promise.resolve(data);
};
exports.getUserInfoByAccount = async function (accountID) {
    let sql = "select * from t_user where account_id = '" + accountID + "' ;";
    let data = await query(sql).catch(function (err) {
        console.log("*** app *** isPlayerIsExit err = " + err);
    });
    return Promise.resolve(data);
};

//登录时更新玩家信息
exports.upDateAccountInfo =async function (uid,loginDate,ip,platform,nickName,avatarUrl,sex,city) {
    let sql = "update t_account set last_login_ip = '" + ip
        + "',last_login_date = '" + loginDate
        + "',last_login_platform = '" + platform
        + "',nick_name = '" + nickName
        + "',avatar_url = '" + avatarUrl
        + "',sex = '" + sex
        + "',city = '" + city
        + "' where uid = '" + uid + "' ;";
    let data = await query(sql).catch(function (err) {
        console.log('upDateUserInfo失败:'+err);
    });
    return Promise.resolve(data);
};
exports.upDateLoginInfo = async function(uid,loginDate,ip,platform){
    let sql = "update t_account set last_login_ip = '" + ip
        + "',last_login_date = '" + loginDate
        + "',last_login_platform = '" + platform
        + "' where uid = '" + uid + "' ;";
    let data = await query(sql).catch(function (err) {
        console.log('upDateUserInfo失败:'+err);
    });
    return Promise.resolve(data);
};
//注册玩家
exports.createAccount = async function (uid,accountID,ip,createDate,platform,nickName,avatarUrl,sex,city,diamond,gold) {
    let sql = 'insert into t_account(uid,account_id,create_date,last_login_ip,last_login_date,last_login_platform,nick_name,avatar_url,sex,city) values('
        + "'" + uid
        + "'" + ','
        + "'" + accountID
        + "'" + ','
        + "'" + createDate
        + "'" + ','
        + "'" + ip
        + "'" + ','
        + "'" + createDate
        + "'" + ','
        + "'" + platform
        + "'" + ','
        + "'" + nickName
        + "'" + ','
        + "'" + avatarUrl
        + "'" + ','
        + sex + ','
        + "'" + city
        + "'" + ');';
    let sql2 = 'insert into t_user(account_id,diamond,gold,total_game) values('
        + "'" + accountID
        + "'" + ','
        + diamond + ','
        + gold + ',0);';
    let data = await query(sql).catch((err)=>{
        console.log('** db ** create player err = ' + err);
    });
    let data2 = await query(sql2).catch((err)=>{
        console.log('** db ** create player err = ' + err);
    });
    if (data && data2) {
        return Promise.resolve(true);
    }
    return Promise.resolve(false);
};
//查询钻石数量
exports.getPlayerDiamondCount = async function(playerID){
    let sql = "select diamond from t_user where account_id = '"+playerID+"';";
    let data = await query(sql).catch(function (err) {
        console.log("*** db *** select diamond err"+ err);
    });
    return Promise.resolve(data);
};

//查找代理
exports.getRankingByAccountID = async function(code){
    let sql = "select * from t_ranking where ranking = '" + code + "' ;";
    let data = await query(sql).catch((err)=>{
        console.log('** db ** search ranking err = ' + err);
    });
    return Promise.resolve(data);
};
//更新玩家邀请码
exports.upDateUserRanking = async function(playerID,code){
    let sql = "update t_user set ranking = '" + code + "',diamond = diamond+8 where account_id = '" + playerID + "' ;";
    let data = await query(sql).catch(err=>{
        console.log('** db ** update ranking err = ' + err);
    });
    let sql1 = "update t_user set diamond = diamond+20 where account_id = '" + code + "' ;";
    let data1 = await query(sql1).catch(err=>{
        console.log('** db ** update ranking1 err = ' + err);
    });
    return Promise.resolve(data);
};
//查找系统信息
exports.getSystemInfo = async function(){
    let sql = "select * from t_systemInfo;";
    let data = await query(sql).catch(err=>{
        console.log('** db ** search systemInfo err = ' + err);
    });
    return Promise.resolve(data);
};
exports.getGameRecord = async function(type){
    let sql = "select * from t_"+type+"gameRecord";
    let data = await query(sql).catch(err=>{
        console.log('** db ** search gameRecord err = ' + err);
    });
    return Promise.resolve(data);
};
exports.upDateDiamondCountByAccountID = function(playerID,diamondCount){
    let sql = "update t_user set diamond = '"+ diamondCount + "'where account_id = '" + playerID + "' ;";
     query(sql).catch(err=>{
        console.log('** db ** update diamond err = ' + err);
    });
};
exports.upDataTotalGamesByUniqueID = function(playerID){
    let sql = "update t_user set total_game = total_game+1 where account_id = '" + playerID + "' ;";
    query(sql).catch(err=>{
        console.log('** db ** update total_game err = ' + err);
    });
};
exports.saveGameRecords = function (type,data) {
    let sql = 'insert into t_'+type+'gameRecord(create_date,players,base_score,game_type,house_master,total_round,room_id,game_info) values ('
        + "'" + data.gameRecord.create_date
        + "'" + ','
        + "'" + JSON.stringify(data.gameRecord.players)
        + "'" + ','
        + "'" + data.gameRecord.base_score
        + "'" + ','
        + "'" + data.gameRecord.game_type
        + "'" + ','
        + "'" + data.gameRecord.house_master
        + "'" + ','
        + "'" + data.gameRecord.total_round
        + "'" + ','
        + "'" + data.gameRecord.room_id
        + "'" + ','
        + "'" + JSON.stringify(data.gameInfo)
        + "'" + ');';
    query(sql).catch(err=>{
        console.log('** db ** saveGameRecord err = ' + err);
    });
};
exports.connect = function (config) {
    client = mysql.createPool(config);
};