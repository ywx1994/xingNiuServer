const Card = require('./../share/Card');
const CardValue = {
    "2": 1,
    "3": 2,
    "4": 3,
    "5": 4,
    "6": 5,
    "7": 6,
    "8": 7,
    "9": 8,
    "10": 9,
    "11": 10,
    "12": 11,
    "13": 12,
    "A": 13
};
const CardShape = {
    "S": 1,
    "H": 2,
    "C": 3,
    "D": 4
};
module.exports = function () {
    let that = {};
    that.getCards = function () {
        let cardList = [];
        // let card1 = new Card(1,1);
        // card1.id = 1;
        // cardList.push(card1);
        // let card2 = new Card(2,1);
        // card1.id = 2;
        // cardList.push(card2);
        // let card3 = new Card(6,1);
        // card1.id = 3;
        // cardList.push(card3);
        // let card4 = new Card(1,2);
        // card1.id = 4;
        // cardList.push(card4);
        // let card5 = new Card(2,2);
        // card1.id = 5;
        // cardList.push(card5);
        // let card6 = new Card(6,2);
        // card1.id = 6;
        // cardList.push(card6);
        for (let i in CardValue) {
            for (let j in CardShape) {
                let card = new Card(CardValue[i], CardShape[j]);
                card.id = cardList.length;
                cardList.push(card);
            }
        }
        console.log(JSON.stringify(cardList));
        cardList.sort((a, b) => {
            return (Math.random() > 0.5) ? -1 : 1;
        });
        return cardList;
    };
    const CardsValue = {
        'baoZi': {
            name: 'BaoZi',
            value: 6
        },
        'shunJin': {
            name: 'ShunJin',
            value: 5
        },
        'jinHua': {
            name: 'JinHua',
            value: 4
        },
        'shunZi': {
            name: 'ShunZi',
            value: 3
        },
        'duiZi': {
            name: 'DuiZi',
            value: 2
        },
        'sanPai': {
            name: 'SanPai',
            value: 1
        },
        'special': {
            name: 'Special',
            value: 0
        }
    };
    const isBaoZi = function (cardList) {
        let flag = true;
        for (let i = 0; i < cardList.length - 1; i++) {
            if (cardList[i].value !== cardList[i + 1].value) {
                flag = false;
            }
        }
        return flag;
    };
    const isShunJin = function (cardList) {
        return isJinHua(cardList) && isShunZi(cardList);
    };
    const isJinHua = function (cardList) {
        let flag = true;
        for (let i = 0; i < cardList.length - 1; i++) {
            if (cardList[i].shape !== cardList[i + 1].shape) {
                flag = false;
            }
        }
        return flag;
    };
    const isShunZi = function (cardList) {
        let flag = true;
        for (let i = 0; i < cardList.length - 1; i++) {
            if (Number(cardList[i].value) - 1 !== Number(cardList[i + 1].value)) {
                flag = false;
            }
        }
        return flag;
    };
    const isDuiZi = function (cardList) {
        let flag = false;
        for (let i = 0; i < cardList.length - 1; i++) {
            if (cardList[i].value === cardList[i + 1].value) {
                flag = true;
            }
        }
        return flag;
    };
    const isA23 = function (cardList) {
        if (cardList[0].value === 13 && cardList[1].value === 2 && cardList[2].value === 1){
            return true;
        }
    };
    const isAAA= function (cardList) {
        if (cardList[0].value === 13 && cardList[1].value === 13 && cardList[2].value === 13){
            return true;
        }
    };
    const isSpecial = function (cardList) {
        if (cardList[0].value === 4 && cardList[1].value === 2 && cardList[2].value === 1) {
            return true;
        }
    };
    const getCardsValue = function (cardList,A23) {
        if (isBaoZi(cardList)) {
            console.log('豹子');
            return CardsValue.baoZi;
        }
        if (isA23(cardList)) {
            if (A23 !== 1) {
                if (isJinHua(cardList)) {
                    return CardsValue.shunJin;
                }else {
                    return CardsValue.shunZi;
                }
            }else {
                if (isJinHua(cardList)) {
                    return CardsValue.jinHua;
                }else {
                    return CardsValue.sanPai;
                }
            }
        }
        if (isShunJin(cardList)) {
            console.log('顺金');
            return CardsValue.shunJin;
        }
        if (isJinHua(cardList)) {
            console.log('金花');
            return CardsValue.jinHua;
        }
        if (isShunZi(cardList)) {
            console.log('顺子');
            return CardsValue.shunZi;
        }
        if (isDuiZi(cardList)) {
            console.log('对子');
            return CardsValue.duiZi;
        }
        if (isSpecial(cardList)) {
            console.log('235');
            return CardsValue.special;
        }
        console.log('散牌');
        return CardsValue.sanPai;
    };
    that.getPlayerCardsValue = function (cardList,A23) {
        return getCardsValue(cardList,A23);
    };
    that.compare = function (cards1, cards2, SDYJ, XTPXKZS, A23, S235GreaterThanAAA) {
        let value1 = getCardsValue(cards1, A23);
        let value2 = getCardsValue(cards2, A23);
        if (value1.value === 6 && value2.value === 0) {
            if (S235GreaterThanAAA) {
                return !isAAA(cards1);
            }else {
                return false;
            }
        } else if (value1.value === 0 && value2.value === 6) {
            if (S235GreaterThanAAA) {
                return isAAA(cards2);
            }else {
                return true;
            }
        } else if (value1.value === 4 && value2.value === 3) {
            return !SDYJ;
        }else if (value1.value === 3 && value2.value === 4) {
            return SDYJ;
        }
        else if (value1.value > value2.value) {
            return true;
        } else if (value1.value < value2.value) {
            return false;
        } else if (value1.value === value2.value) {
            return that['compare' + value1.name](cards1, cards2,A23,XTPXKZS);
        }
    };
    that.compareBaoZi = function (cardList1, cardList2,A23,XTPXKZS) {
        return cardList1[0].value > cardList2[0].value;
    };
    that.compareShunJin = function (cardList1, cardList2,A23,XTPXKZS) {
        let value1 = 0;
        let value2 = 0;
        if (isA23(cardList1)) {
            if (A23 === 2){
                value1 = 1;
            }else{
                value1 = 14;
            }
        } else {
            value1 = cardList1[0].value;
        }
        if (isA23(cardList2)) {
            if (A23 === 2){
                value2 = 1;
            }else{
                value2 = 14;
            }
        } else {
            value2 = cardList2[0].value;
        }
        if (value1 > value2) {
            return true;
        }else if (value1 < value2) {
            return false;
        }else if (XTPXKZS) {
            return false;
        }else {
            return cardList1[0].shape < cardList2[0].shape;
        }
    };
    that.compareJinHua = function (cardList1, cardList2,A23,XTPXKZS) {
        if (cardList1[0].value !== cardList2[0].value) {
            return cardList1[0].value > cardList2[0].value;
        } else if (cardList1[1].value !== cardList2[1].value) {
            return cardList1[1].value > cardList2[1].value;
        } else if (cardList1[1].value !== cardList2[1].value) {
            return cardList1[2].value > cardList2[2].value;
        }else if (XTPXKZS) {
            return false;
        }else {
            return cardList1[0].shape < cardList2[0].shape;
        }
    };
    that.compareShunZi = that.compareShunJin;
    that.compareDuiZi = function (cardList1, cardList2,A23,XTPXKZS) {
        let map1 = {};
        let map2 = {};
        let valueOfSingle1 = 0;
        let valueOfDouble1 = 0;
        let valueOfSingle2 = 0;
        let valueOfDouble2 = 0;
        for (let i = 0; i < cardList1.length; i++) {
            if (map1.hasOwnProperty(cardList1[i].value)) {
                map1[cardList1[i].value]++;
            } else {
                map1[cardList1[i].value] = 1;
            }
        }
        for (let i = 0; i < cardList2.length; i++) {
            if (map2.hasOwnProperty(cardList2[i].value)) {
                map2[cardList2[i].value]++;
            } else {
                map2[cardList2[i].value] = 1;
            }
        }
        for (let j in map1) {
            if (map1[j] === 2) {
                valueOfDouble1 = Number(j);
            } else if (map1[j] === 1) {
                valueOfSingle1 = Number(j);
            }
        }
        for (let j in map2) {
            if (map2[j] === 2) {
                valueOfDouble2 = Number(j);
            } else if (map2[j] === 1) {
                valueOfSingle2 = Number(j);
            }
        }
        if (valueOfDouble1 !== valueOfDouble2) {
            return valueOfDouble1 > valueOfDouble2;
        } else if (valueOfSingle1 !== valueOfSingle2) {
            return valueOfSingle1 > valueOfSingle2;
        }else if (XTPXKZS) {
            return false;
        }else {
            for (let i = 0; i < cardList1.length; i++) {
                if (cardList1[i].value === valueOfSingle1) {
                    return cardList1[i].shape < cardList2[i].shape;
                }
            }
        }
    };
    that.compareSanPai = that.compareJinHua;
    that.compareSpecial = function (cardList1, cardList2,A23,XTPXKZS) {
        if (XTPXKZS) {
            return false;
        }else {
            return cardList1[0].shape < cardList2[0].shape;
        }
    };
    return that;
};