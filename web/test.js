class Test {
    constructor(){
        this.index = 0;
        this.t = undefined;
    }
    timer(){
        this.index = 1;
        this.t =setInterval(()=>{
            console.log(this.index);
            this.index++;
            if(this.index>10){
                clearInterval(this.t);
            }
        },100);
    }
    timer1(){
        setTimeout(()=>{
            clearInterval(this.t);
        },500)
    }

}
let test = new Test();
test.timer();
//test.timer1();