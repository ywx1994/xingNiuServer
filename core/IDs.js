/**
 * Created by litengfei on 2017/12/19.
 */
var Config = require("./Config.js");
var UnitTools = require("./UnitTools.js");
var fs = require("fs");
class IDs{
    constructor(){

    }

    initFromConfig(){
        this.idConfig = Config.getServerConfig().ids;
        if(this.idConfig.create){//创建
            this.generateIdsToFile(this.idConfig.from,this.idConfig.to,__dirname+"/../"+this.idConfig.path,__dirname+"/../"+this.idConfig.countpath);
        }
    }

    generateIdsToFile(from,to,filePath,countFilePath){
        var numCount = (to - from)+1;//多少个
        var buffer = new Buffer(4*numCount);//总的大小
        for(var i = from;i<=to;i++){
            var start = i- from;
            start = start * 4;
            buffer.writeUInt32LE(i,start);
        }

        for(var i = 0;i<numCount;i++){
            var randomIndex = UnitTools.random(0,numCount-1);
            var currentNum = buffer.readUInt32LE(i*4);
            var changeNum = buffer.readUInt32LE(randomIndex*4);

            buffer.writeUInt32LE(changeNum,i*4);
            buffer.writeUInt32LE(currentNum,randomIndex*4);
        }

        fs.writeFileSync(filePath,buffer,{flag:"w"});
        fs.writeFileSync(countFilePath,0,{flag:"w"});

    }

    async getID(){
        var self = this;
      return  new Promise(function (resolve,reject) {
          var countNum = parseInt(fs.readFileSync(__dirname+"/../"+self.idConfig.countpath,"utf-8"));
          var startBufferIndex = countNum * 4;
          var stream = fs.createReadStream(__dirname+"/../"+self.idConfig.path, { start: startBufferIndex, end: startBufferIndex+4,flags:"r"});
          stream.on("data",function (dataBuffer) {
              var id = dataBuffer.readUInt32LE(0);
              resolve(id);
              fs.writeFileSync(__dirname+"/../"+self.idConfig.countpath,countNum+1);
          })
        })
    }

}
module.exports = IDs;