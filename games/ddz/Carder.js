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
 * 大小王={k:小王， K:大王}
 */
const Kings = {
    'k': 14,
    'K': 15
};
module.exports = function () {  //用于管理Card
    let that = {};
    let _cardList = [];

    //生成一副牌有大小王，并打乱
    const createCardsWithKing = function () {
        let cardList = [];
        for (let i in CardValue) {
            for (let j in CardShape) {
                let card =new Card(CardValue[i], CardShape[j]);
                card.id = cardList.length;
                cardList.push(card);
            }
        }
        for (let i in Kings) {
            let card =new Card(undefined, undefined, Kings[i]);
            card.id = cardList.length;
            cardList.push(card);
        }
        //洗牌
        cardList.sort((a, b) => {
            return (Math.random() > 0.5) ? -1 : 1;
        });
        // console.log("*** carder *** createCards 洗完后的牌");
        // for (let i = 0; i < cardList.length; i++) {
        //     console.log('cardID= ' + cardList[i].id + ' value=' + cardList[i].value + ' shape=' + cardList[i].shape + ' king=' + cardList[i].king);
        // }
        return cardList;
    };
    //生成一副牌没有大小王，并打乱
    const createCardsNoKing = function () {
        let cardList = [];
        for (let i in CardValue) {
            for (let j in CardShape) {
                let card =new Card(CardValue[i], CardShape[j]);
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

    //斗地主分牌
    that.getDDZCards = function () {
        _cardList = createCardsWithKing();
        let CardsMap = {};
        for (let i = 0; i < 17; i++) {
            for (let j = 0; j < 3; j++) {
                if (CardsMap.hasOwnProperty(j)) {
                    CardsMap[j].push(_cardList.pop());
                } else {
                    CardsMap[j] = [_cardList.pop()];
                }
            }
        }

        // let anCardList = [
        //     Card(CardValue['7'], CardShape['S']),
        //     Card(CardValue['7'], CardShape['S']),
        //     Card(CardValue['7'], CardShape['S']),
        //     Card(CardValue['8'], CardShape['S']),
        //     Card(CardValue['8'], CardShape['S']),
        //     Card(CardValue['8'], CardShape['S']),
        //     Card(CardValue['9'], CardShape['S']),
        //     Card(CardValue['9'], CardShape['S']),
        //     Card(CardValue['9'], CardShape['S']),
        //     Card(CardValue['10'], CardShape['S']),
        //     Card(CardValue['10'], CardShape['S']),
        //     Card(CardValue['10'], CardShape['S']),
        //     Card(CardValue['Q'], CardShape['S']),
        //     Card(CardValue['J'], CardShape['S']),
        //     Card(CardValue['Q'], CardShape['S']),
        //     Card(CardValue['K'], CardShape['S']),
        //     Card(CardValue['J'], CardShape['S']),
        // ];
        // let otherCardList = [
        //     Card(CardValue['9'], CardShape['S']),
        //     Card(CardValue['9'], CardShape['S']),
        //     Card(CardValue['9'], CardShape['S']),
        //     Card(CardValue['10'], CardShape['S']),
        //     Card(CardValue['10'], CardShape['S']),
        //     Card(CardValue['10'], CardShape['S']),
        //     Card(CardValue['J'], CardShape['S']),
        //     Card(CardValue['J'], CardShape['S']),
        //     Card(CardValue['J'], CardShape['S']),
        //     Card(CardValue['Q'], CardShape['S']),
        //     Card(CardValue['Q'], CardShape['S']),
        //     Card(CardValue['Q'], CardShape['S']),
        //     Card(CardValue['2'], CardShape['S']),
        //     Card(CardValue['3'], CardShape['S']),
        //     Card(CardValue['4'], CardShape['S']),
        //     Card(undefined, undefined, Kings['k']),
        //     Card(undefined, undefined, Kings['K']),
        // ];
        // for (let i = 0; i < CardsMap[0].length; i++) {
        //     let id = CardsMap[0][i].id;
        //     anCardList[i].id = id;
        //     CardsMap[0][i] = anCardList[i];
        // }
        // for (let i = 0; i < CardsMap[1].length; i++) {
        //     let id = CardsMap[1][i].id;
        //     otherCardList[i].id = id;
        //     CardsMap[1][i] = otherCardList[i];
        // }
        return [CardsMap[0], CardsMap[1], CardsMap[2], _cardList];
    };

    //拼三张分牌
    that.getSJHCards = function (startPlayerList) {
        _cardList = createCardsNoKing();
        let CardsMap = {};
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < startPlayerList.length; j++) {
                if (CardsMap.hasOwnProperty(j)) {
                    CardsMap[j].push(_cardList.pop());
                } else {
                    CardsMap[j] = [_cardList.pop()];
                }
            }
        }
        return CardsMap;
    };

    //---------------------------------牌型判断--------------------------------------

    //单张牌的判断
    const isOneCard = function (cardList) {
        if (cardList.length === 1) {
            return true;
        }
        return false;
    };
    //对子牌的判断
    const isDoubleCards = function (cardList) {
        if (cardList.length === 2) {
            //不能是王，并且值相等
            if (cardList[0].value !== undefined && cardList[0].value === cardList[1].value) {
                return true;
            }
        }
        return false;
    };
    //纯三张的判断
    const isThreeCards = function (cardList) {
        if (cardList.length === 3) {
            let map = {};
            for (let i = 0, len = cardList.length; i < len; i++) {
                if (map.hasOwnProperty(cardList[i].value)) {
                    map[cardList[i].value]++;
                } else {
                    map[cardList[i].value] = 1;
                }
            }
            if (map[cardList[0].value] === 3) {
                return true;
            }
        }
        return false;
    };
    //三带一牌的判断
    const isThreeWithOneCard = function (cardList) {
        if (cardList.length === 4) {
            let map = {};
            for (let i = 0, len = cardList.length; i < len; i++) {
                if (cardList[i].value !== undefined) {
                    if (map.hasOwnProperty(cardList[i].value)) {
                        map[cardList[i].value]++;
                    } else {
                        map[cardList[i].value] = 1;
                    }
                }
            }

            for (let i in map) {
                if (map[i] === 3) {
                    return true;
                }
            }
        }
        return false;
    };
    //三带二牌的判断
    const isThreeWithTwoCard = function (cardList) {
        if (cardList.length === 5) {
            let map = {};
            for (let i = 0, len = cardList.length; i < len; i++) {
                if (cardList[i].value !== undefined) {
                    if (map.hasOwnProperty(cardList[i].value)) {
                        map[cardList[i].value]++;
                    } else {
                        map[cardList[i].value] = 1;
                    }
                } else {
                    return false;
                }
            }

            let count = 0;
            let flag = false;
            for (let i in map) {
                count++;
                if (map[i] === 3) {
                    flag = true;
                }
            }
            if (count === 2 && flag) {
                return true;
            }
        }
        return false;
    };
    //炸弹的判断；包括王炸和4张炸
    const isBoomCard = function (cardList) {
        if (isKingBoom(cardList)) {
            console.log('王炸。。。');
            return true;
        }
        if (isFourBoom(cardList)) {
            console.log('四张炸。。。');
            return true;
        }
        return false;
    };
    const isKingBoom = function (cardList) {
        if (cardList.length === 2 && cardList[0].king !== undefined && cardList[1].king !== undefined) {
            return true;
        }
        return false;
    };
    const isFourBoom = function (cardList) {
        if (cardList.length === 4) {
            let map = {};
            for (let i = 0; i < cardList.length; i++) {
                if (map.hasOwnProperty(cardList[i].value)) {
                    map[cardList[i].value]++;
                } else {
                    map[cardList[i].value] = 1;
                }
            }
            if (map[cardList[0].value] === 4) {
                return true;
            }
        }
        return false;
    };
    //四带二牌的判断
    const isFourCardWithTwoCard = function (cardList) {
        if (cardList.length === 6 || cardList.length === 8) {
            let map = {};
            for (let i = 0; i < cardList.length; i++) {
                let key = undefined;
                if (cardList[i].value === undefined) {
                    key = cardList[i].king;
                } else {
                    key = cardList[i].value;
                }
                if (map.hasOwnProperty(key)) {
                    map[key]++;
                } else {
                    map[key] = 1;
                }
            }
            let hasFourCard = false;
            let OntCount = 0;
            let TwoCount = 0;
            for (let i in map) {
                if (map[i] === 4) {
                    hasFourCard = true;
                }
                if (map[i] === 1) {
                    OntCount++;
                }
                if (map[i] === 2) {
                    TwoCount++;
                }
            }
            if (hasFourCard) {
                if (OntCount === 2 && TwoCount === 0) {
                    return true;
                }
                if (OntCount === 0 && TwoCount === 2) {
                    return true;
                }
                if (OntCount === 0 && TwoCount === 1) {
                    return true;
                }
            }
        }
        return false;
    };
    //纯飞机
    const isPlaneCard = function (cardList) {
        if (cardList.length >= 6 && cardList.length % 3 === 0) {
            let map = {};
            for (let i = 0, len = cardList.length; i < len; i++) {
                if (cardList[i].king !== undefined || cardList[i].value === 13) {//如果有王或者2直接返回false；
                    return false;
                }
                if (map.hasOwnProperty(cardList[i].value)) {
                    map[cardList[i].value]++;
                } else {
                    map[cardList[i].value] = 1;
                }
            }
            let keys = Object.keys(map);
            if (keys.length >= 2) {
                for (let i in map) {
                    if (map[i] !== 3) {
                        return false;
                    }
                }
                for (let i = 0; i < keys.length - 1; i++) {
                    if (Math.abs(Number(keys[i]) - Number(keys[i + 1])) !== 1) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    };
    //飞机带一张牌的判断
    const isPlaneWithOneCard = function (cardList) {
        if (cardList.length >= 8 && cardList.length % 4 === 0) {
            let map = {};
            for (let i = 0; i < cardList.length; i++) {
                let key = undefined;
                if (cardList[i].value === undefined) {
                    key = cardList[i].king;
                } else {
                    key = cardList[i].value;
                }
                if (map.hasOwnProperty(key)) {
                    map[key]++;
                } else {
                    map[key] = 1;
                }
            }
            // console.log('飞机带单张：map=' + JSON.stringify(map)+ '\n');
            let keys = Object.keys(map);
            // console.log('飞机带单张：keys=' + JSON.stringify(keys)+ '\n');
            if (keys.length >= 3) {
                let OneCount = 0;
                let TwoCount = 0;
                let threeList = [];
                for (let i in map) {
                    if (map[i] > 3) {
                        return false;
                    }
                    if (map[i] === 3) {
                        if (i === 13) {
                            return false;
                        }
                        threeList.push(i);
                    }
                    if (map[i] === 2) {
                        TwoCount++;
                    }
                    if (map[i] === 1) {
                        OneCount++;
                    }
                }
                if (threeList.length !== (TwoCount * 2 + OneCount)) {
                    // console.log('飞机带单张：threeList.length=' + threeList.length + '; TwoCount=' + TwoCount + '; OneCount=' + OneCount+ '\n');
                    return false;
                }
                threeList.sort((a, b) => {
                    return Number(a) - Number(b);
                });
                for (let i = 0; i < threeList.length - 1; i++) {
                    if (Math.abs(Number(threeList[i]) - Number(threeList[i + 1])) !== 1) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    };
    //飞机带两张牌的判断
    const isPlaneWithTwoCard = function (cardList) {
        if (cardList.length >= 10 && cardList.length % 5 === 0) {
            let map = {};
            for (let i = 0; i < cardList.length; i++) {
                let key = undefined;
                if (cardList[i].value === undefined) {
                    return false;
                } else {
                    key = cardList[i].value;
                }
                if (map.hasOwnProperty(key)) {
                    map[key]++;
                } else {
                    map[key] = 1;
                }
            }
            // console.log('飞机带一对：map=' + JSON.stringify(map)+ '\n');
            let keys = Object.keys(map);
            // console.log('飞机带一对：keys=' + JSON.stringify(keys)+ '\n');
            if (keys.length >= 4) {//飞机带两单张
                let TwoCount = 0;   //用于单牌的数量计数
                let threeList = [];
                for (let i in map) {
                    if (map[i] > 3) {
                        return false;
                    }
                    if (map[i] === 3) {
                        if (i === 13) {
                            return false;
                        }
                        threeList.push(i);
                    }
                    if (map[i] === 2) {
                        TwoCount++;
                    }
                }
                // console.log('飞机带一对：threeList=' + JSON.stringify(threeList)+ '\n');
                if (TwoCount !== threeList.length) {
                    return false;
                }
                for (let i = 0; i < threeList.length - 1; i++) {
                    if (Math.abs(Number(threeList[i]) - Number(threeList[i + 1])) !== 1) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    };
    //顺子牌的判断
    const isStraightCard = function (cardList) {
        if (cardList.length >= 5 && cardList.length <= 12) {//顺子的长度在5-12之间
            let map = {};
            for (let i = 0; i < cardList.length; i++) {
                let key = undefined;
                if (cardList[i].value !== undefined) {//如果含有大小王和2的话，就直接返回false
                    if (cardList[i].value === 13) {
                        return false;
                    }
                    key = cardList[i].value
                } else {
                    return false;
                }
                if (map.hasOwnProperty(key)) {
                    map[key]++;
                } else {
                    map[key] = 1;
                }
            }
            // console.log('顺子：map=' + JSON.stringify(map)+ '\n');
            let keys = Object.keys(map);
            // console.log('顺子：keys=' + JSON.stringify(keys)+ '\n');
            if (cardList.length !== keys.length) {
                // console.log('cardList.length !== keys.length'+ '\n');
                return false;
            }
            keys.sort((a, b) => {
                return Number(a) - Number(b);
            });
            for (let i = 0; i < keys.length - 1; i++) {
                if (Math.abs(Number(keys[i]) - Number(keys[i + 1])) !== 1) {
                    // console.log('顺子：Math.abs(Number(keys[]) - Number(keys[i + 1])) = ' + Math.abs(Number(keys[1]) - Number(keys[i + 1]))+ '\n')
                    return false;
                }
            }
            return true;
        }
        return false;
    };
    //连对牌的判断
    const isDoubleStraightCard = function (cardList) {
        if (cardList.length >= 6 && cardList.length % 2 === 0) {
            let map = {};
            for (let i = 0; i < cardList.length; i++) {
                let key = undefined;
                if (cardList[i].value !== undefined) {//如果含有大小王和2的话，就直接返回false
                    if (cardList[i].value === 13) {
                        return false;
                    }
                    key = cardList[i].value
                } else {
                    return false;
                }
                if (map.hasOwnProperty(key)) {
                    map[key]++;
                } else {
                    map[key] = 1;
                }
            }
            // console.log('连对：map=' + JSON.stringify(map)+ '\n');
            for (let i in map) {
                if (map[i] !== 2) {
                    return false;
                }
            }

            let keys = Object.keys(map);
            // console.log('连对：keys=' + JSON.stringify(keys)+ '\n');
            keys.sort((a, b) => {
                return Number(a) - Number(b);
            });
            for (let i = 0; i < keys.length - 1; i++) {
                if (Math.abs(Number(keys[i]) - Number(keys[i + 1])) !== 1) {
                    return false;
                }
            }
            return true;
        }
        return false;
    };


    //获取牌型的值，炸弹为2，其他都是1；
    const getCardsValue = function (cardList) {
        if (isOneCard(cardList)) {
            console.log('单张。。。' + '\n');
            return CardsValue.one;
        }
        if (isDoubleCards(cardList)) {
            console.log('对子。。。' + '\n');
            return CardsValue.double;
        }
        if (isThreeCards(cardList)) {
            console.log('三张不带。。。' + '\n');
            return CardsValue.three;
        }
        if (isBoomCard(cardList)) {
            console.log('炸弹。。。' + '\n');
            return CardsValue.boom;
        }
        if (isThreeWithOneCard(cardList)) {
            console.log('三带一。。。' + '\n');
            return CardsValue.threeWithOne;
        }
        if (isThreeWithTwoCard(cardList)) {
            console.log('三带二。。。' + '\n');
            return CardsValue.threeWithTwo;
        }
        if (isPlaneCard(cardList)) {
            console.log('飞机不带。。。' + '\n')
            return CardsValue.plane;
        }
        if (isPlaneWithOneCard(cardList)) {
            console.log('飞机带一张。。。' + '\n')
            return CardsValue.planeWithOne;
        }
        if (isPlaneWithTwoCard(cardList)) {
            console.log('飞机带一对。。。' + '\n');
            return CardsValue.planeWithTwo;
        }
        if (isStraightCard(cardList)) {
            console.log('顺子。。。' + '\n');
            return CardsValue.straight;
        }
        if (isDoubleStraightCard(cardList)) {
            console.log('连对。。。' + '\n');
            return CardsValue.doubleStraight;
        }
        if (isFourCardWithTwoCard(cardList)) {
            console.log('四带二。。。' + '\n')
            return CardsValue.fourCardWithTwo;
        }
        return false;
    };

    //牌型正确与否的判断
    that.isCanPushCards = getCardsValue;

    //-------------------------------------牌面比较-----------------------------------------
    //牌的级别
    const CardsValue = {
        'one': {
            name: 'One',
            value: 1
        },
        'double': {
            name: 'Double',
            value: 1
        },
        'three': {
            name: 'Three',
            value: 1
        },
        'boom': {
            name: 'Boom',
            value: 2
        },
        'threeWithOne': {
            name: 'ThreeWithOne',
            value: 1
        },
        'threeWithTwo': {
            name: 'ThreeWithTwo',
            value: 1
        },
        'plane': {
            name: 'Plane',
            value: 1
        },
        'planeWithOne': {
            name: 'PlaneWithOne',
            value: 1
        },
        'planeWithTwo': {
            name: 'PlaneWithTwo',
            value: 1
        },
        'straight': {
            name: 'Straight',
            value: 1
        },
        'doubleStraight': {
            name: 'DoubleStraight',
            value: 1
        },
        'fourCardWithTwo': {
            name: 'FourCardWithTwo',
            value: 1
        }
    };
    //获取牌的类型
    that.getCardsStyle = function (cardList) {
        return getCardsValue(cardList);
    };

    //获取单张牌的值
    const getOneCardValue = function (card) {
        let value = 0;
        if (card.value === undefined) {
            value = card.king;
        } else {
            value = card.value;
        }
        return value;
    };
    //一张牌大小的比较
    that.compareOne = function (card1, card2) {
        let value1 = getOneCardValue(card1[0]);
        let value2 = getOneCardValue(card2[0]);
        if (value1 > value2) {
            return true;
        }
        return '你的牌太小了！';
    };
    //对子牌大小的比较
    that.compareDouble = that.compareOne;
    //三张牌大小的比较
    that.compareThree = that.compareOne;
    //炸弹大小的比较
    that.compareBoom = function (card1, card2) {
        if (card1.length === 4 && card2.length === 4) {
            return that.compareOne(card1, card2);
        } else {
            if (card1.length < card2.length) {
                return true;
            }
        }
        return false;
    };
    //获取三张牌的列表
    const getThreeCardValue = function (card) {
        let map = {};
        let list = [];
        for (let i = 0; i < card.length; i++) {
            if (map.hasOwnProperty(card[i].value)) {
                map[card[i].value].push(card[i]);
            } else {
                map[card[i].value] = [card[i]];
            }
        }

        for (let i in map) {
            if (map[i].length === 3) {
                list.push(map[i]);
            }
        }
        // console.log('*** carder *** getThreeCardValue list=' + JSON.stringify(list)+ '\n');
        return list;
    };
    //三带一牌大小的比较
    that.compareThreeWithOne = function (card1, card2) {
        let list1 = getThreeCardValue(card1);
        let list2 = getThreeCardValue(card2);
        return that.compareThree(list1[0], list2[0]);
    };
    //三带二牌大小的比较
    that.compareThreeWithTwo = that.compareThreeWithOne;
    //四带二牌的比较
    that.compareFourCardWithTwo = function (card1, card2) {
        if (card1.length === card2.length) {
            let map1 = {};
            let map2 = {};
            let list1 = [];
            let list2 = [];
            for (let i = 0; i < card1.length; i++) {
                if (map1.hasOwnProperty(card1[i].value)) {
                    map1[card1[i].value].push(card1[i]);
                } else {
                    map1[card1[i].value] = [card1[i]];
                }
            }
            for (let i in map1) {
                if (map1[i].length === 4) {
                    list1 = map1[i];
                }
            }
            for (let i = 0; i < card2.length; i++) {
                if (map2.hasOwnProperty(card2[i].value)) {
                    map2[card2[i].value].push(card2[i]);
                } else {
                    map2[card2[i].value] = [card2[i]];
                }
            }
            for (let i in map2) {
                if (map2[i].length === 4) {
                    list2 = map2[i];
                }
            }
            return that.compareOne(list1, list2);

        } else {
            return '你的牌型不符！';
        }
    };
    //飞机牌大小的比较
    that.comparePlane = function (card1, card2) {
        if (card1.length === card2.length) {
            let list1 = getThreeCardValue(card1);
            let list2 = getThreeCardValue(card2);
            let minThreeCard1 = [];
            let minThreeCard2 = [];
            let maxNum = 99;
            for (let i = 0; i < list1.length; i++) {
                if (Number(list1[i][0].value) < maxNum) {
                    minThreeCard1 = list1[i];
                }
            }
            maxNum = 99;
            for (let i = 0; i < list2.length; i++) {
                if (Number(list2[i][0].value) < maxNum) {
                    minThreeCard2 = list2[i];
                }
            }
            return that.compareThree(minThreeCard1, minThreeCard2);
        } else {
            return '你的牌型不符！';
        }

    };
    //飞机带一牌大小的比较
    that.comparePlaneWithOne = that.comparePlane;
    //飞机带二牌大小的比较
    that.comparePlaneWithTwo = that.comparePlane;
    //顺子牌大小的比较
    that.compareStraight = function (card1, card2) {
        if (card1.length === card2.length) {
            let minNum1 = 99;
            let minNum2 = 99;
            for (let i = 0; i < card1.length; i++) {
                if (card1[i].value < minNum1) {
                    minNum1 = card1[i].value;
                }
            }
            for (let i = 0; i < card2.length; i++) {
                if (card2[i].value < minNum2) {
                    minNum2 = card2[i].value;
                }
            }
            if (minNum1 > minNum2) {
                return true;
            } else {
                return '你的牌太小了！';
            }
        } else {
            return '你的牌型不符!';
        }
    };
    //对子牌大小的比较
    that.compareDoubleStraight = function (card1, card2) {
        if (card1.length === card2.length) {
            let map1 = {};
            let map2 = {};
            let list1 = [];
            let list2 = [];
            for (let i = 0; i < card1.length; i++) {
                if (map1.hasOwnProperty(card1[i].value)) {

                } else {
                    map1[card1[i].value] = 1;
                    list1.push(card1[i]);
                }
            }
            for (let i = 0; i < card2.length; i++) {
                if (map2.hasOwnProperty(card2[i].value)) {

                } else {
                    map2[card2[i].value] = 1;
                    list2.push(card2[i]);
                }
            }

            return that.compareStraight(list1, list2);
        } else {
            return '你的牌型不符！';
        }
    };


    //牌大小的比较
    that.compareCard = function (card1, card2) {
        let card1Value = getCardsValue(card1);
        let card2Value = getCardsValue(card2);
        if (card1Value.value > card2Value.value) {
            return true;
        } else if (card1Value.value === card2Value.value) {
            if (card1Value.name === card2Value.name) {
                let str = 'compare' + card1Value.name;
                console.log('比牌的方法名：str = ' + str + '\n');
                let method = that[str];
                let result = method(card1, card2);
                if (result === true) {
                    return true;
                } else {
                    return result;
                }
            } else {
                return '你的牌型不符！';
            }
        }
        return '你的牌太小了！';

    };


    //---------------------------------提示牌----------------------------------

    //获取比start牌大的牌的列表
    const getCardListWithStart = function (start, cards) {
        cards.sort((a, b) => {
            return a.value - b.value;
        });
        let list = [];
        for (let i = 0; i < cards.length; i++) {
            let key = undefined;
            if (cards[i].value === undefined) {
                key = cards[i].king;
            } else {
                key = cards[i].value;
            }
            if (key > start) {
                list.push(cards[i]);
            }
        }

        let map = {};
        for (let i = 0; i < list.length; i++) {
            let key = undefined;
            if (list[i].value === undefined) {
                key = list[i].king;
            } else {
                key = list[i].value;
            }

            if (map.hasOwnProperty(key)) {

            } else {
                map[key] = [list[i]];
            }
        }
        return map;
    };
    //从cards中选出重复num次的牌count份以上
    const getRepeatCardList = function (num, cards) {
        let map = {};
        for (let i = 0; i < cards.length; i++) {
            let key = undefined;
            if (cards[i].value === undefined) {
                key = cards[i].king;
            } else {
                key = cards[i].value;
            }
            if (map.hasOwnProperty(key)) {
                if (map[key].length < num) {
                    map[key].push(cards[i]);
                }
            } else {
                map[key] = [cards[i]];
            }
        }
        let list = [];
        for (let i in map) {
            if (map[i].length === num) {
                let l = [];
                for (let j = 0; j < num; j++) {
                    l.push(map[i][j]);
                }
                list.push(l);
            }
        }
        // console.log('** carder ** getRepeatCardList list =' + JSON.stringify(list));
        return list;
    };
    //获取王炸，有则返回王炸，没有返回false
    const getKingBoom = function (cards) {
        let list = [];
        for (let i = 0; i < cards.length; i++) {
            if (cards[i].king !== undefined) {
                list.push(cards[i]);
            }
        }
        if (list.length === 2) {
            return list;
        } else {
            return false;
        }
    };
    //获取四张炸，有则返回王四张炸，没有返回false
    const getFourBoom = function (cards) {
        let list = getRepeatCardList(4, cards);
        if (list.length === 0) {
            return false;
        }
        return list;
    };


    //获取重复num次的牌的value
    const getRepeatCardValue = function (num, cards) {
        let map = {};
        for (let i = 0; i < cards.length; i++) {
            if (map.hasOwnProperty(cards[i].value)) {
                map[cards[i].value].push(cards[i]);
            } else {
                map[cards[i].value] = [cards[i]];
            }
        }
        for (let i in map) {
            if (map[i].length === num) {
                return Number(i);
            }
        }
    };
    //获取三带几的牌的列表
    const getThreeWithNumCardList = function (num, card1, card2) {
        let value1 = getRepeatCardValue(3, card1);
        let list = getRepeatCardList(3, card2);
        let cardList = [];
        for (let i = 0; i < list.length; i++) {
            if (list[i][0].value > value1) {
                cardList.push(list[i]);
            }
        }
        let numCardList = getRepeatCardList(num, card2); //num为要带的牌的数量
        numCardList.sort((a, b) => {
            return Number(a[0].value) - Number(b[0].value);
        });
        console.log('** carder ** getThreeWithNumCardList numCardList.sort=' + JSON.stringify(numCardList) + '\n');
        for (let i = 0; i < cardList.length; i++) {
            for (let j = 0; j < numCardList.length; j++) {
                if (cardList[i][0].value !== numCardList[j][0].value) {
                    for (let k = 0; k < numCardList[j].length; k++) {
                        cardList[i].push(numCardList[j][k]);
                    }
                    break;
                }
            }
        }
        console.log('** carder ** getThreeWithNumCardList cardList=' + JSON.stringify(cardList));
        let fourBoom = getFourBoom(card2);
        if (fourBoom !== false) {
            for (let i = 0; i < fourBoom.length; i++) {
                cardList.push(fourBoom[i]);
            }
        }
        let kingBoom = getKingBoom(card2);
        if (kingBoom !== false) {
            cardList.push(kingBoom);
        }
        if (cardList.length !== 0) {
            return cardList;
        } else {
            return false;
        }
    };
    //获取飞机的起始值
    const getPlaneMinValue = function (cards) {
        let map = {};
        for (let i = 0; i < cards.length; i++) {
            if (map.hasOwnProperty(cards[i].value)) {
                map[cards[i].value].push(cards[i]);
            } else {
                map[cards[i].value] = [cards[i]];
            }
        }

        let minValue = 888;
        for (let i in map) {
            if (map[i].length === 3) {
                if (Number(i) < minValue) {
                    minValue = Number(i);
                }
            }
        }

        return minValue;
    };
    //获取飞机的三张个数
    const getPlaneCountNum = function (cards) {
        let map = {};
        for (let i = 0; i < cards.length; i++) {
            if (map.hasOwnProperty(cards[i].value)) {
                map[cards[i].value].push(cards[i]);
            } else {
                map[cards[i].value] = [cards[i]];
            }
        }
        let countNum = 0;
        for (let i in map) {
            if (map[i].length === 3) {
                countNum++;
            }
        }
        return countNum;
    };
    //获取起始值大于startNum的countNum个的飞机
    const getPlaneWithStart = function (startNum, countNum, cards) {
        let list = getRepeatCardList(3, cards);     //1.取出牌中的所有三张牌
        for (let i = 0; i < list.length; i++) {
            if (list[i][0].value === 13) {
                list.splice(i, 1);
            }
        }
        // console.log('** carder ** getPlaneWithStart list=' + JSON.stringify(list)+ '\n');
        if (list.length < countNum) {       //2.如果手中的三张牌没比飞机多，返回空
            return [];
        }
        list.sort((a, b) => {       //3.将手中的三张牌进行排序
            return Number(a[0].value) - Number(b[0].value);
        });
        // console.log('** carder ** getPlaneWithStart list.sort=' + JSON.stringify(list)+ '\n');
        let tempCardList = [];      //4.取出符合长度的飞机
        for (let i = 0; i < list.length - countNum + 1; i++) {
            let count = 0;
            let map = {};
            let tempList = [];
            for (let j = 0; j < countNum - 1; j++) {
                if (Math.abs(Number(list[i + j][0].value) - Number(list[i + j + 1][0].value)) === 1) {
                    count++;
                    if (map.hasOwnProperty(list[i + j][0].value)) {

                    } else {
                        map[list[i + j][0].value] = list[i + j];
                    }
                    if (map.hasOwnProperty(list[i + j + 1][0].value)) {

                    } else {
                        map[list[i + j + 1][0].value] = list[i + j + 1];
                    }
                }
            }
            // console.log('** carder ** getPlaneWithStart map=' + JSON.stringify(map)+ '\n');
            if (count + 1 === countNum) {
                for (let x in map) {
                    for (let y = 0; y < map[x].length; y++) {
                        tempList.push(map[x][y]);
                    }
                }
                tempCardList.push(tempList);
                // console.log('** carder ** getPlaneWithStart tempList=' + JSON.stringify(tempList)+ '\n');
                // console.log('** carder ** getPlaneWithStart tempCardList=' + JSON.stringify(tempCardList)+ '\n');
            }
        }

        let cardList = [];      //5.取出大于前手的飞机
        for (let i = 0; i < tempCardList.length; i++) {
            let minPalneValue = getPlaneMinValue(tempCardList[i]);
            if (minPalneValue > startNum) {
                cardList.push(tempCardList[i]);
            }
        }
        return cardList;
    };
    //飞机带的牌
    const getPlaneTakeCardList = function (countNum, cards, takeNum) {
        let map = {};
        for (let i = 0; i < cards.length; i++) {
            let key = undefined;
            if (cards[i].value !== undefined) {
                key = cards[i].value;
            } else {
                key = cards[i].king;
            }
            if (map.hasOwnProperty(key)) {
                if (map[key].length < takeNum) {
                    map[key].push(cards[i]);
                }
            } else {
                map[key] = [cards[i]];
            }
        }
        console.log('** carder ** getPlaneTakeCardList map=' + JSON.stringify(map) + '\n');

        let takeCardList = [];
        for (let i in map) {
            if (map[i].length === 1 && takeNum === 1) {
                takeCardList.push(map[i][0]);
            }
            if (map[i].length === 2 && takeNum === 2) {
                takeCardList.push(map[i][0]);
                takeCardList.push(map[i][1]);
            }
        }
        console.log('** carder ** getPlaneTakeCardList takeCardList=' + JSON.stringify(takeCardList) + '\n');

        if (takeCardList.length < countNum * takeNum) {
            return [];
        }
        return takeCardList;
    };
    //获取顺子中的最小牌的值
    const getStraightMinNum = function (cards) {
        let minNum = 99;
        for (let i = 0; i < cards.length; i++) {
            if (cards[i].value < minNum) {
                minNum = cards[i].value;
            }
        }
        return minNum;
    };
    //取出长度为length的所有顺子
    const getStraightCardList = function (length, cards) {
        let map = {};
        let list = [];
        for (let i = 0; i < cards.length; i++) {
            if (cards[i].value !== undefined && cards[i].value !== 13) {
                if (!map.hasOwnProperty(cards[i].value)) {
                    map[cards[i].value] = true;
                    list.push(cards[i])
                }
            }

        }
        list.sort((a, b) => {
            return a.value - b.value;
        });
        console.log('** carder ** getStraightCardList list.sort=' + JSON.stringify(list) + '\n');

        let cardList = [];
        for (let i = 0; i < list.length - length + 1; i++) {
            let tempList = [];
            for (let j = i; j < i + length; j++) {
                tempList.push(list[j]);
            }
            cardList.push(tempList);
        }
        console.log('** carder ** getStraightCardList cardList=' + JSON.stringify(cardList) + '\n');

        let endList = [];
        for (let i = 0; i < cardList.length; i++) {
            let flag = true;
            for (let j = 0; j < cardList[i].length - 1; j++) {
                if (Math.abs(cardList[i][j].value - cardList[i][j + 1].value) !== 1) {
                    flag = false;
                }
            }
            if (flag) {
                endList.push(cardList[i]);
            }
        }
        return endList;
    };
    //获取连对中最小的牌的值
    const getDoubleStraightMinNum = function (cards) {
        cards.sort((a, b) => {
            return a.value - b.value;
        });
        return cards[0].value;
    };
    //获取四带二要带的牌
    const getFourCardTakeCards = function (takeNum, cards) {
        let map = {};
        for (let i = 0; i < cards.length; i++) {
            let key = undefined;
            if (cards[i].king === undefined) {
                key = cards[i].value;
            } else {
                key = cards[i].king;
            }
            if (map.hasOwnProperty(key)) {
                map[key].push(cards[i]);
            } else {
                map[key] = [cards[i]];
            }
        }
        let list = [];
        if (takeNum === 2) {
            for (let i in map) {
                if (map[i].length >= 1 && map[i].length < 4) {
                    list.push(map[i][0]);
                }
            }
        } else {
            for (let i in map) {
                if (map[i].length >= 2 && map[i].length < 4) {
                    list.push(map[i][0]);
                    list.push(map[i][1]);
                }
            }
        }
        console.log('** carder ** getFourCardTakeCards list=' + JSON.stringify(list) + '\n');
        return list;
    };

    //单张牌的提示
    that.tipOne = function (card1, card2) {
        let startKey = undefined;
        if (card1[0].value === undefined) {
            startKey = card1[0].king;
        } else {
            startKey = card1[0].value;
        }
        let map = getCardListWithStart(startKey, card2);

        let cardList = [];
        for (let i in map) {
            cardList.push(map[i]);
        }

        let fourBoom = getFourBoom(card2);
        if (fourBoom !== false) {
            for (let i = 0; i < fourBoom.length; i++) {
                cardList.push(fourBoom[i]);
            }
        }
        let kingBoom = getKingBoom(card2);
        if (kingBoom !== false) {
            cardList.push(kingBoom);
        }
        // console.log('*** carder *** tipOne list=' + JSON.stringify(cardList) + '\n');
        if (cardList.length !== 0) {
            return cardList;
        } else {
            return false;
        }

    };
    //对子牌的提示
    that.tipDouble = function (card1, card2) {
        let list = getRepeatCardList(2, card2);
        let cardList = [];
        for (let i = 0; i < list.length; i++) {
            if (list[i][0].value > card1[0].value) {
                cardList.push(list[i]);
            }
        }

        let fourBoom = getFourBoom(card2);
        if (fourBoom !== false) {
            for (let i = 0; i < fourBoom.length; i++) {
                cardList.push(fourBoom[i]);
            }
        }
        let kingBoom = getKingBoom(card2);
        if (kingBoom !== false) {
            cardList.push(kingBoom);
        }
        console.log('*** carder *** tipDouble cardList=' + JSON.stringify(cardList) + '\n');
        if (cardList.length !== 0) {
            return cardList;
        } else {
            return false;
        }
    };
    //三张牌的提示
    that.tipThree = function (card1, card2) {
        let list = getRepeatCardList(3, card2);
        let cardList = [];
        for (let i = 0; i < list.length; i++) {
            if (list[i][0].value > card1[0].value) {
                cardList.push(list[i]);
            }
        }

        let fourBoom = getFourBoom(card2);
        if (fourBoom !== false) {
            for (let i = 0; i < fourBoom.length; i++) {
                cardList.push(fourBoom[i]);
            }
        }
        let kingBoom = getKingBoom(card2);
        if (kingBoom !== false) {
            cardList.push(kingBoom);
        }
        console.log('*** carder *** tipDouble cardList=' + JSON.stringify(cardList) + '\n');
        if (cardList.length !== 0) {
            return cardList;
        } else {
            return false;
        }
    };
    //炸弹牌的提示
    that.tipBoom = function (card1, card2) {
        let cardList = [];
        if (card1.length === 2) {
            return false;
        } else {
            let list = getRepeatCardList(4, card2);
            for (let i = 0; i < list.length; i++) {
                if (list[i][0].value > card1[0].value) {
                    cardList.push(list[i]);
                }
            }
            let result = getKingBoom(card2);
            if (result !== false) {
                cardList.push(result);
            }
        }
        if (cardList.length !== 0) {
            return cardList;
        } else {
            return false;
        }
    };
    //三带一牌的提示
    that.tipThreeWithOne = function (card1, card2) {
        return getThreeWithNumCardList(1, card1, card2);
    };
    //三带二牌的提示
    that.tipThreeWithTwo = function (card1, card2) {
        return getThreeWithNumCardList(2, card1, card2);
    };
    //纯飞机牌的提示
    that.tipPlane = function (card1, card2) {
        let startNum = getPlaneMinValue(card1);
        let countNum = getPlaneCountNum(card1);
        console.log('** carder ** tipPlane startNum=' + startNum + '; countNum=' + countNum + '\n');
        let cardList = getPlaneWithStart(startNum, countNum, card2);

        let fourBoom = getFourBoom(card2);
        if (fourBoom !== false) {
            for (let i = 0; i < fourBoom.length; i++) {
                cardList.push(fourBoom[i]);
            }
        }
        let kingBoom = getKingBoom(card2);
        if (kingBoom !== false) {
            cardList.push(kingBoom);
        }
        console.log('*** carder *** tipPlane cardList=' + JSON.stringify(cardList) + '\n');
        if (cardList.length !== 0) {
            return cardList;
        } else {
            return false;
        }
    };
    //飞机带一牌的提示
    that.tipPlaneWithOne = function (card1, card2) {
        let startNum = getPlaneMinValue(card1);
        let countNum = getPlaneCountNum(card1);
        console.log('** carder ** tipPlaneWithOne startNum=' + startNum + '; countNum=' + countNum + '\n');
        let tempCardList = getPlaneWithStart(startNum, countNum, card2);
        console.log('** carder ** tipPlaneWithOne tempCardList=' + JSON.stringify(tempCardList) + '\n');
        let cardList = [];
        if (tempCardList.length !== 0) {
            let takeCardList = getPlaneTakeCardList(countNum, card2, 1);
            if (takeCardList.length !== 0) {
                for (let i = 0; i < tempCardList.length; i++) {
                    let count = 0;
                    for (let j = 0; j < takeCardList.length; j++) {
                        let flag = true;
                        for (let k = 0; k < tempCardList[i].length / 3; k++) {
                            if (takeCardList[j].value === tempCardList[i][k * 3].value) {
                                flag = false;
                                break;
                            }
                        }
                        if (flag) {
                            count++;
                            tempCardList[i].push(takeCardList[j]);
                            if (count === countNum) {
                                cardList.push(tempCardList[i]);
                                break;
                            }
                        }
                    }
                }
            }
            console.log('*** carder *** tipPlaneWithOne before cardList=' + JSON.stringify(cardList) + '\n');
        }

        let fourBoom = getFourBoom(card2);
        if (fourBoom !== false) {
            for (let i = 0; i < fourBoom.length; i++) {
                cardList.push(fourBoom[i]);
            }
        }
        let kingBoom = getKingBoom(card2);
        if (kingBoom !== false) {
            cardList.push(kingBoom);
        }
        console.log('*** carder *** tipPlaneWithOne cardList=' + JSON.stringify(cardList));
        if (cardList.length !== 0) {
            return cardList;
        } else {
            return false;
        }
    };
    //飞机带对子牌的提示
    that.tipPlaneWithTwo = function (card1, card2) {
        let startNum = getPlaneMinValue(card1);
        let countNum = getPlaneCountNum(card1);
        console.log('** carder ** tipPlaneWithTwo startNum=' + startNum + '; countNum=' + countNum + '\n');
        let tempCardList = getPlaneWithStart(startNum, countNum, card2);
        console.log('** carder ** tipPlaneWithTwo tempCardList=' + JSON.stringify(tempCardList) + '\n');
        let cardList = [];
        if (tempCardList.length !== 0) {
            let takeCardList = getPlaneTakeCardList(countNum, card2, 2);
            if (takeCardList.length !== 0) {
                for (let i = 0; i < tempCardList.length; i++) {
                    let count = 0;
                    for (let j = 0; j < takeCardList.length / 2; j++) {
                        let flag = true;
                        for (let k = 0; k < tempCardList[i].length / 3; k++) {
                            if (takeCardList[j * 2].value === tempCardList[i][k * 3].value) {
                                flag = false;
                                break;
                            }
                        }
                        if (flag) {
                            count++;
                            tempCardList[i].push(takeCardList[j * 2]);
                            tempCardList[i].push(takeCardList[j * 2 + 1]);
                            if (count === countNum) {
                                cardList.push(tempCardList[i]);
                                break;
                            }
                        }
                    }
                }
            }
            console.log('*** carder *** tipPlaneWithTwo before cardList=' + JSON.stringify(cardList) + '\n');
        }

        let fourBoom = getFourBoom(card2);
        if (fourBoom !== false) {
            for (let i = 0; i < fourBoom.length; i++) {
                cardList.push(fourBoom[i]);
            }
        }
        let kingBoom = getKingBoom(card2);
        if (kingBoom !== false) {
            cardList.push(kingBoom);
        }
        console.log('*** carder *** tipPlaneWithTwo cardList=' + JSON.stringify(cardList));
        if (cardList.length !== 0) {
            return cardList;
        } else {
            return false;
        }
    };
    //顺子牌的提示
    that.tipStraight = function (card1, card2) {
        let minNum1 = getStraightMinNum(card1);
        console.log('** carder ** tipStraight minNum1=' + JSON.stringify(minNum1) + '\n');
        let list = getStraightCardList(card1.length, card2);
        console.log('** carder ** tipStraight list=' + JSON.stringify(list) + '\n');

        let cardList = [];
        for (let i = 0; i < list.length; i++) {
            let minNum2 = getStraightMinNum(list[i]);
            if (minNum2 > minNum1) {
                cardList.push(list[i]);
            }
        }
        let fourBoom = getFourBoom(card2);
        if (fourBoom !== false) {
            for (let i = 0; i < fourBoom.length; i++) {
                cardList.push(fourBoom[i]);
            }
        }
        let kingBoom = getKingBoom(card2);
        if (kingBoom !== false) {
            cardList.push(kingBoom);
        }
        console.log('*** carder *** tipStraight cardList=' + JSON.stringify(cardList) + '\n');
        if (cardList.length !== 0) {
            return cardList;
        } else {
            return false;
        }
    };
    //连对牌的提示
    that.tipDoubleStraight = function (card1, card2) {
        let minNum1 = getDoubleStraightMinNum(card1);
        console.log('** carder ** tipDoubleStraight minNum1=' + minNum1 + '\n');

        let map = {};
        for (let i = 0; i < card2.length; i++) {
            let key = undefined;
            if (card2[i].king === undefined) {
                key = card2[i].value;
            } else {
                key = card2[i].king;
            }
            if (map.hasOwnProperty(key)) {
                map[key].push(card2[i]);
            } else {
                map[key] = [card2[i]];
            }
        }

        let list = [];
        for (let i in map) {
            if (map[i].length >= 2 && i !== '13') {//把2排除掉
                let l = [];
                for (let j = 0; j < 2; j++) {
                    l.push(map[i][j]);
                }
                list.push(l);
            }
        }
        list.sort((a, b) => {
            return a[0].value - b[0].value;
        });
        console.log('** carder ** tipDoubleStraight list.sort=' + JSON.stringify(list) + '\n');

        let groupList = [];
        let length = card1.length / 2;
        for (let i = 0; i < (list.length - length + 1); i++) {
            let l = [];
            for (let j = i; j < (i + length); j++) {
                l.push(list[j]);
            }
            groupList.push(l);
        }
        console.log('** carder ** tipDoubleStraight groupList=' + JSON.stringify(groupList) + '\n');

        let cardList = [];
        for (let i = 0; i < groupList.length; i++) {
            let group = groupList[i];
            let flag = true;
            for (let j = 0; j < (group.length - 1); j++) {
                if (Math.abs(group[j][0].value - group[j + 1][0].value) !== 1) {
                    flag = false;
                }
            }
            if (flag) {
                let endList = [];
                for (let j = 0; j < group.length; j++) {
                    endList.push(group[j][0]);
                    endList.push(group[j][1]);
                }
                let minNum2 = getDoubleStraightMinNum(endList)
                if (minNum2 > minNum1) {
                    cardList.push(endList);
                }
            }
        }
        let fourBoom = getFourBoom(card2);
        if (fourBoom !== false) {
            for (let i = 0; i < fourBoom.length; i++) {
                cardList.push(fourBoom[i]);
            }
        }
        let kingBoom = getKingBoom(card2);
        if (kingBoom !== false) {
            cardList.push(kingBoom);
        }
        console.log('*** carder *** tipDoubleStraight cardList=' + JSON.stringify(cardList) + '\n');
        if (cardList.length !== 0) {
            return cardList;
        } else {
            return false;
        }
    };
    // 四带二牌的提示
    that.tipFourCardWithTwo = function (card1, card2) {
        let value1 = getRepeatCardValue(4, card1);
        console.log('** carder ** tipFourCardWithTwo value1=' + value1 + '\n');
        let takeNum = card1.length - 4;
        let cardList = [];
        let takeCardList = getFourCardTakeCards(takeNum, card2);
        if (takeCardList.length >= 2) {
            let map = {};
            for (let i = 0; i < card2.length; i++) {
                let key = undefined;
                if (card2[i].king === undefined) {
                    key = card2[i].value;
                } else {
                    key = card2[i].king;
                }
                if (map.hasOwnProperty(key)) {
                    map[key].push(card2[i]);
                } else {
                    map[key] = [card2[i]];
                }
            }

            let tempCardList = [];
            for (let i in map) {
                if (map[i].length === 4) {
                    tempCardList.push(map[i]);
                }
            }
            for (let i = 0; i < tempCardList.length; i++) {
                let value2 = getRepeatCardValue(4, tempCardList[i]);
                if (value2 > value1) {
                    cardList.push(tempCardList[i]);
                }
            }
            console.log('** carder ** tipFourCardWithTwo cardList=' + JSON.stringify(cardList));

            if (takeNum === 2) {
                for (let i = 0; i < cardList.length; i++) {
                    cardList[i].push(takeCardList[0]);
                    cardList[i].push(takeCardList[1]);
                }
            } else {
                for (let i = 0; i < cardList.length; i++) {
                    cardList[i].push(takeCardList[0]);
                    cardList[i].push(takeCardList[1]);
                    cardList[i].push(takeCardList[2]);
                    cardList[i].push(takeCardList[3]);
                }
            }
            console.log('** carder ** tipFourCardWithTwo cardListTakeCard=' + JSON.stringify(cardList));
        }

        let fourBoom = getFourBoom(card2);
        if (fourBoom !== false) {
            for (let i = 0; i < fourBoom.length; i++) {
                cardList.push(fourBoom[i]);
            }
        }
        let kingBoom = getKingBoom(card2);
        if (kingBoom !== false) {
            cardList.push(kingBoom);
        }
        // console.log('*** carder *** tipFourCardWithTwo cardList=' + JSON.stringify(cardList) + '\n');
        if (cardList.length !== 0) {
            return cardList;
        } else {
            return false;
        }
    };

    //提示牌
    that.getTipCardsList = function (card1, card2) {
        if (card1.length === 0) {  //todo 如果是你出牌的话，提示的牌为单张，以后改进
            let list = [];
            let isCanAllPush = that.isCanPushCards(card2);
            if (isCanAllPush !== false) {
                list.push(card2);
            } else {
                let map = {};
                for (let i = 0, len = card2.length; i < len; i++) {
                    let key = undefined;
                    if (card2[i].value !== undefined) {
                        key = card2[i].value;
                    } else {
                        key = card2[i].king;
                    }
                    if (map.hasOwnProperty(key)) {
                        map[key].push(card2[i]);
                    } else {
                        map[key] = [card2[i]];
                    }
                }

                let keys = Object.keys(map);
                keys.sort((a, b) => {
                    return Number(a) - Number(b);
                });
                console.log("提示key"+keys);
                for (let i = 0, len = keys.length; i < len; i++) {
                    list.push(map[keys[i]]);
                }
            }
            return list;
        } else {
            let cardsValue = getCardsValue(card1);
            let name = cardsValue.name;
            let str = 'tip' + name;
            console.log('** carder ** getTipCardsList str=' + str + '\n');
            let method = that[str];
            return method(card1, card2);
        }
    };

    return that;
};