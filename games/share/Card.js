class Card {
    constructor(value,shape,king,count){
        if(shape){
            this.shape = shape;
        }
        if(value){
            this.value = value;
        }
        if(king){
            this.king = king;
        }
        if (count) {
            this.count = count;
        }
    }
}
module.exports=Card;