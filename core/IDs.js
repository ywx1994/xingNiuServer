var Config = require("./Config.js");
var UnitTools = require("./UnitTools.js");
var fs = require("fs");
class IDs {
    constructor(){

    }
    initFromConfig(){
        this.idConfig = Config.getServerConfig().ids;
        if (this.idConfig.create){
            this.generateIdsToFile(this.idConfig.from,this.idConfig.to,__dirname+"/../"+this.idConfig.path,__dirname+"/../"+this.idConfig.countpath);
        }
    }
    generateIdsToFile(from,to,filePath,countFilePath){
        var numCount = to-from+1;//个数
        var buffer = new Buffer(4*numCount);//总位数
        for (var i = from; i <= to; i++) {
            var start = (i-from)*4;
            buffer.writeInt32LE(i,start);
        }
        for (var i = 0; i < numCount; i++) {
            var randomIndex = UnitTools.random(0,numCount-1);
            var currentNum = buffer.readInt32LE(i*4);
            var changeNum = buffer.readInt32LE(randomIndex*4);
            buffer.writeInt32LE(currentNum,randomIndex*4);
            buffer.writeInt32LE(changeNum,i*4);
        }
        fs.writeFileSync(filePath,buffer,{flag:"w"});
        fs.writeFileSync(countFilePath,0,{flag:"w"});
    }
    async getID(){
        var self = this;
       return new Promise(function (resolve, reject) {
           var countNum = fs.readFileSync(__dirname+"/../"+self.idConfig.countpath,"utf-8");
           var startBufferIndex = countNum*4;
           var stream = fs.createReadStream(__dirname+"/../"+self.idConfig.path,{start:startBufferIndex,end:startBufferIndex+4,flags:"r"});
           stream.on("data",function (dataBuffer) {
               var id = dataBuffer.readInt32LE(0);
               resolve(id);
               countNum++;
               fs.writeFileSync(__dirname+"/../"+self.idConfig.countpath,countNum);
           })
        })
    }
    /**------------------------------------房间号------------------------------------------------------------------*/
    initFromRoomConfig(){
        this.tableIdConfig = Config.getServerConfig().tableIdConfig;
        if (this.tableIdConfig.create){
            this.generateIdsToFile(this.tableIdConfig.from,this.tableIdConfig.to,__dirname+"/../"+this.tableIdConfig.path,__dirname+"/../"+this.tableIdConfig.countpath);
        }
    }
    async getRoomID(){
        var self = this;
        return new Promise(function (resolve, reject) {
            var countNum = fs.readFileSync(__dirname+"/../"+self.tableIdConfig.countpath,"utf-8");
            var startBufferIndex = countNum*4;
            var stream = fs.createReadStream(__dirname+"/../"+self.tableIdConfig.path,{start:startBufferIndex,end:startBufferIndex+4,flags:"r"});
            stream.on("data",function (dataBuffer) {
                var id = dataBuffer.readInt32LE(0);
                resolve(id);
                countNum++;
                fs.writeFileSync(__dirname+"/../"+self.tableIdConfig.countpath,countNum);
            })
        })
    }

}
module.exports = IDs;