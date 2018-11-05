const Card = require('./../share/Card');

/**
 * 牌的值
 */
const CardValue = {
    '3': 1,
    '4': 2,
    '5': 3,
    '6': 4,
    '7': 5,
    '8': 6,
    '9': 7,
    '10': 8,
    'J': 9,
    'Q': 10,
    'K': 11,
    'A': 12,
    '2': 13
};
/**
 * 牌的花色={黑桃:spade，红桃:heart，梅花:club，方片:diamond}
 */
const CardShape = {
    'S': 1,
    'H': 2,
    'C': 3,
    'D': 4
};
/**
 * 牌的点数     J、Q、K均为10点
 */
const CardCount = {
    'A': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 10,
    'Q': 10,
    'K': 10
};

module.exports = function () {  //用于管理Card
    let that = {};
    let _cardList = [];

    //生成一副牌没有大小王，并打乱
    const createCardsNoKing = function () {
        let cardList = [];
        for (let i in CardValue) {
            for (let j in CardShape) {
                let card =new Card(CardValue[i], CardShape[j], undefined, CardCount[i]);
                card.id = cardList.length;
                cardList.push(card);
            }
        }
        //洗牌
        cardList.sort((a, b) => {
            return (Math.random() > 0.5) ? -1 : 1;
        });
        // console.log("*** carder *** createCards 洗完后的牌")
        // for (let i = 0; i < cardList.length; i++) {
        //     console.log('cardID= ' + cardList[i].id + ' value=' + cardList[i].value + ' shape=' + cardList[i].shape + ' king=' + cardList[i].king)
        // }
        return cardList;
    };

    //五醉牛分牌
    that.getWZNCards = function (startPlayerList) {
        _cardList = createCardsNoKing();
        let CardsMap = {};
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < startPlayerList.length; j++) {
                if (CardsMap.hasOwnProperty(j)) {
                    CardsMap[j].push(_cardList.pop());
                } else {
                    CardsMap[j] = [_cardList.pop()];
                }
            }
        }
        // CardsMap[0] = [
        //     {"value": 4, "shape": 2, "count": 6, "id": 1},
        //     {"value": 5, "shape": 4, "count": 7, "id": 7},
        //     {"value": 6, "shape": 3, "count": 8, "id": 22},
        //     {"value": 7, "shape": 1, "count": 9, "id": 28},
        //     {"value": 8, "shape": 4, "count": 10, "id": 31}
        // ];
        // console.log('\n分好的牌为(未修改)：' + JSON.stringify(CardsMap));
        // CardsMap[0] = [
        //     {"value": 3, "shape": 2, "count": 5, "id": 1},
        //     {"value": 3, "shape": 4, "count": 5, "id": 7},
        //     {"value": 3, "shape": 3, "count": 5, "id": 22},
        //     {"value": 3, "shape": 1, "count": 5, "id": 28},
        //     {"value": 8, "shape": 4, "count": 10, "id": 31}
        // ];
        // CardsMap[1] = [
        //     {"value": 12, "shape": 2, "count": 1, "id": 1},
        //     {"value": 13, "shape": 4, "count": 2, "id": 7},
        //     {"value": 5, "shape": 3, "count": 7, "id": 22},
        //     {"value": 10, "shape": 1, "count": 10, "id": 28},
        //     {"value": 11, "shape": 4, "count": 10, "id": 31}
        // ];
        // console.log('\n分好的牌为（修改好）：' + JSON.stringify(CardsMap));
        return CardsMap;
    };

    //---------------------------------牌型判断--------------------------------------

    /**
     * 排序牌      牌值为：A-->K     花色为：黑桃-->红桃-->梅花-->方片
     * @param cardList
     */
    const sortCardList = function (cardList) {
        cardList.sort((a, b) => {
            if (a.count === 10 && b.count === 10) {
                if (a.value > b.value) {
                    return true;
                }
                if (a.value < b.value) {
                    return false;
                }
                return a.shape - b.shape;
            }

            if (a.count > b.count) {
                return true;
            }
            if (a.count < b.count) {
                return false;
            }
            return a.shape - b.shape;
        });
        console.log('\n^^^^^^^^^^排序好的牌为：' + JSON.stringify(cardList));
        return cardList;
    };

    /**
     * 五小牛牌型的判断
     * @param cardList
     * @returns {boolean}
     */
    const isSmallBull = function (cardList) {
        let sum = 0;
        for (let i = 0; i < cardList.length; i++) {
            if (cardList[i].count < 5) {
                sum += cardList[i].count;
            } else {
                return false;
            }
        }
        if (sum < 10) {
            return true;
        }
        return false;
    };
    /**
     * 炸弹牛牌型的判断
     * @param cradList
     * @returns {boolean}
     */
    const isBombBull = function (cradList) {
        console.log('\n炸弹牛中看牌型：' + JSON.stringify(cradList));
        if (cradList[0].value === cradList[3].value) {
            return true;
        } else if (cradList[1].value === cradList[4].value) {
            return true;
        } else {
            return false;
        }
    };
    /**
     * 五花牛牌型的判断
     * @param cardList
     * @returns {boolean}
     */
    const isSpottedBull = function (cardList) {
        if (cardList[0].value > 8 && cardList[0].count === 10) {//10的value是8
            return true;
        }
        return false;
    };
    /**
     * 对子牛牌型的判断
     * 先判断有无对子：     无：false;    有：循环取出三张牌，若点数和为10的倍数，则判断剩余两张是否为对子，若都符合则返回true
     * @param cardList
     * @returns {boolean}
     */
    const isDoubleBull = function (cardList) {
        let flag = false;
        for (let i = 0; i < cardList.length - 1; i++) {
            if (cardList[i].value === cardList[i + 1].value) {
                flag = true;
            }
        }
        if (flag) {
            for (let i = 0; i < cardList.length - 2; i++) {
                for (let j = i + 1; j < cardList.length - 1; j++) {
                    for (let k = j + 1; k < cardList.length; k++) {
                        let sum = cardList[i].count + cardList[j].count + cardList[k].count;
                        if (sum % 10 === 0) {
                            let twoCard = [];
                            for (let x = 0; x < cardList.length; x++) {
                                if (x !== i && x !== j && x !== k) {
                                    twoCard.push(cardList[x]);
                                }
                            }
                            if (twoCard[0].value === twoCard[1].value) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    };
    /**
     * 普通牛牌型的判断     返回的数即为牛几
     * @param cardList
     * @returns {number}
     */
    const isWhichBull = function (cardList) {
        let residue = 0;    //余数
        for (let i = 0; i < cardList.length; i++) {
            residue += cardList[i].count;
        }
        residue %= 10;
        for (let i = 0; i < cardList.length - 1; i++) {
            for (let j = i + 1; j < cardList.length; j++) {
                if ((cardList[i].count + cardList[j].count) % 10 === residue) {
                    if (residue === 0) {
                        return 10;
                    } else {
                        return residue;
                    }
                }
            }
        }
        return 0;
    };

    /**
     * 通过 点数 判断 牛几
     * @param whichBull
     * @returns {*}
     */
    const getCardsValueByWhich = function (whichBull) {
        switch (whichBull) {
            case 0:
                return CardsValue.cowZero;
                break;
            case 1:
                return CardsValue.cowOne;
                break;
            case 2:
                return CardsValue.cowTwo;
                break;
            case 3:
                return CardsValue.cowThree;
                break;
            case 4:
                return CardsValue.cowFour;
                break;
            case 5:
                return CardsValue.cowFive;
                break;
            case 6:
                return CardsValue.cowSix;
                break;
            case 7:
                return CardsValue.cowSeven;
                break;
            case 8:
                return CardsValue.cowEight;
                break;
            case 9:
                return CardsValue.cowNine;
                break;
            case 10:
                return CardsValue.cowTen;
                break;
            default:
                return false;       //异常牌型
                break;

        }
    };

    /**
     * 获取牌型的值;      先排序再判断
     * @param cardList
     * @returns {*}
     */
    const getCardsType = function (cards, TSPX) {
        console.log('\n roomRules = ' + JSON.stringify(TSPX));
        let cardList = cards;
        sortCardList(cardList);
        if (isSmallBull(cardList) && TSPX.smallBull !== '') {
            console.log('五小牛。。。' + '\n');
            return CardsValue.smallBull;
        }
        if (isBombBull(cardList) && TSPX.bombBull !== '') {
            console.log('炸弹牛。。。' + '\n');
            return CardsValue.bombBull;
        }
        if (isSpottedBull(cardList) && TSPX.spottedBull !== '') {
            console.log('五花牛。。。' + '\n');
            return CardsValue.spottedBull;
        }
        if (isDoubleBull(cardList) && TSPX.doubleBull !== '') {
            console.log('对子牛。。。' + '\n');
            return CardsValue.doubleBull;
        }
        let whichBull = isWhichBull(cardList);
        return getCardsValueByWhich(whichBull);
    };

    /**
     *提示牌
     * @param cardList
     */
    that.getTip = function (cardList, TSPX) {
        return getCardsType(cardList, TSPX);
    };


    //-------------------------------------牌面比较-----------------------------------------

    /**
     * 牌的大小级别
     * @type {{cowZero: {name: string, value: number}, cowOne: {name: string, value: number}, cowDouble: {name: string, value: number}, cowThree: {name: string, value: number}, cowFour: {name: string, value: number}, cowFive: {name: string, value: number}, cowSix: {name: string, value: number}, cowSeven: {name: string, value: number}, cowEight: {name: string, value: number}, cowNine: {name: string, value: number}, cowTen: {name: string, value: number}, doubleBull: {name: string, value: number}, spottedBull: {name: string, value: number}, bombBull: {name: string, value: number}, smallBull: {name: string, value: number}}}
     */
    const CardsValue = {
        'cowZero': {
            name: 'CowZero',
            value: 0
        },
        'cowOne': {
            name: 'CowOne',
            value: 1
        },
        'cowTwo': {
            name: 'CowTwo',
            value: 2
        },
        'cowThree': {
            name: 'CowThree',
            value: 3
        },
        'cowFour': {
            name: 'CowFour',
            value: 4
        },
        'cowFive': {
            name: 'CowFive',
            value: 5
        },
        'cowSix': {
            name: 'CowSix',
            value: 6
        },
        'cowSeven': {
            name: 'CowSeven',
            value: 7
        },
        'cowEight': {
            name: 'CowEight',
            value: 8
        },
        'cowNine': {
            name: 'CowNine',
            value: 9
        },
        'cowTen': {
            name: 'CowTen',
            value: 10
        },
        'doubleBull': {
            name: 'DoubleBull',
            value: 11
        },
        'spottedBull': {
            name: 'SpottedBull',
            value: 12
        },
        'bombBull': {
            name: 'BombBull',
            value: 13
        },
        'smallBull': {
            name: 'SmallBull',
            value: 14
        }
    };


    /**
     * 牌大小的比较
     * @param card1
     * @param card2
     * @returns {*}
     */
    that.compareCard = function (cardList1, cardList2) {
        let card1 = cardList1;
        let card2 = cardList2;
        sortCardList(card1);
        sortCardList(card2);
        console.log('\ncard1------' + JSON.stringify(card1));
        console.log('\ncard2------' + JSON.stringify(card2));
        if (card1[4].count > card2[4].count) {
            return 1;
        }
        if (card1[4].count < card2[4].count) {
            return -1;
        }
        if (card1[4].count === card2[4].count) {
            if (card1[4].value > card2[4].value) {
                return 1;
            }
            if (card1[4].value < card2[4].value) {
                return -1;
            }
            if (card1[4].value === card2[4].value) {
                if (card1[4].shape < card2[4].shape) {
                    return 1;
                }
                if (card1[4].shape > card2[4].shape) {
                    return -1;
                }
            }
        }

    };


    return that;
};