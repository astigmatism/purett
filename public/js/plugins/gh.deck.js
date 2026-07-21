gh.deck = function(wrapper) {
    this.initialize(wrapper);
};
gh.deck.prototype = {
    
    canvas:     null,
    content:     null,
    cW:         117,       //static card width
    cH:         146,      //static card height
    handpos:    [72, 197, 322, 447, 572],
    
    hand:   [],
    deck:   [],
    
    allcards: [],
    allpurchased: [],
    
    sortedDeck: [],
    sortedPurchased: [],
    sortedHand: [],
    
    
    handobjs: [],
    deckobjs: [],
    
    goingtodeck: [], ///an animation flag
    deckremoveonrefresh: [],
    
    goingtohand: [],
    handremoveonrefresh: [],
    
    selected: 0, //the currently selected level menu
    menu: 'main',
    
    callback: null,
    madechange: false,
    
    initialize: function(wrapper) {
        var me = this;
        $(document).ready(function() {
            
            $(wrapper).append('<div id="deck" class="abs hide"></div>');
            $(wrapper).append('<ul class="deckmenu"></ul>');
            
            me.ul = '#content ul.deckmenu';
            me.space = '#deck';
            
            me.canvas = Raphael("deck", 755, 562);
            
            me.bar = me.canvas.rect(31, 239, 695, 0).attr({ 'fill': 'black', 'opacity': 0, 'stroke-width': '0' });
        });
    },
    go: function(options, callback) {
        var me = this;
        me.callback = callback;
        
        me.hand = options.hand;
        me.deck = options.deck;
        
        me.handobjs = [];
        me.deckobjs = [];
        me.goingtodeck = [];
        me.deckremoveonrefresh = [];
        me.goingtohand = [];
        me.handremoveonrefresh = [];
        
        var sort = function (a, b) {
            return a.cardid - b.cardid;
        };
        options.deck.sort(sort);
        
        //first get count of cards for each level. we need to know how many spaces to set up for deck
        var allcards = $.merge([], me.hand);
        allcards = $.merge(allcards, me.deck);
        
        me.allcards = me.buildComplex(allcards, false); //returns an array with counts for all levels and card ids for all cards
        me.sortedDeck = me.buildComplex(options.deck, false);
        me.sortedHand = me.buildComplexHand(options.hand);
        
        me.allpurchased = me.buildComplex(allcards, true); //returns an array with counts for all levels and card ids for all cards
        me.sortedPurchased = me.buildComplex(options.deck, true);
        
        highestLevel = me.getHighestLevel(me.sortedDeck, me.allcards);
        
        $('#deck').show();
        
        me.handshow(me.sortedHand);
        
        setTimeout(function() {
            me.deckshow(highestLevel, me.sortedDeck, me.allcards);
            me.selected = highestLevel;
        }, 300);
            
        me.bar.stop().animate({ translation: [0, -25], height: 50, opacity: 1}, 1000, '<', function() {
            me.menushow(highestLevel, me.allcards, true);
        });
    },
    buildComplex: function(deck, purchased) {
        var result = [[], [], [], [], [], [], [], [], [], []];
        $.each(deck, function() {
            var card = this;
            if (card.purchased == (purchased ? '1' : '0')) {
                var lvlindex = parseInt(card.level, 10) - 1;
                var found = -1;
                $.each(result[lvlindex], function(index) {
                    if (this.cardid == card.cardid) {
                        found = index;
                    }
                });
                if (found > -1) {
                    result[lvlindex][found].count++;
                } else {
                    //not found, add it
                    result[lvlindex].push({
                        cardid: card.cardid,
                        image: card.image,
                        count: 1,
                        level: card.level,
                        purchased: (purchased ? '1' : '0')
                    });
                }
            }
        });
        return result;
    },
    addComplex: function(card, array) {
        var lvlindex = parseInt(card.level, 10) - 1;
        var found = -1;
        $.each(array[lvlindex], function(index) {
            if (this.cardid == card.cardid) {
                found = index;
            }
        });
        if (found > -1) {
            array[lvlindex][found].count++;
        } else {
            //not found, add it
            array[lvlindex].push({
                cardid: card.cardid,
                image: card.image,
                count: 1,
                level: card.level,
                purchased: card.purchased
            });
        }
    },
    buildComplexHand: function(hand) {
        var result = [{}, {}, {}, {}, {}];
        $.each(hand, function(index) {
            result[index] = {
                cardid: this.cardid,
                image: this.image,
                level: (this.level),
                purchased: (this.purchased)
            };
        });
        return result;
    },
    domshow: function(el) {
        var me = this;
        $(el).css('z-index', '15');
        $(el).fadeIn();
    },
    domhide: function(el, callback) {
        var me = this;
        $(el).fadeOut(function() {
            $(el).css('z-index', '0');
            if (gh.defined(callback, 'function')) {
                callback();
            }
        });
    },
    menushow: function(highestLevel, allcards, main) {
        var me = this;
        $(me.ul).empty();
        $(me.ul).append('<li class="back">< BACK</li>');
        
        //build menu according level count
        var i = 9;
        for(i; i != -1; i--) {
            if (allcards[i].length > 0) {
                $(me.ul).append('<li class="lvl ' + (highestLevel === i + 1 ? 'selected' : '') + '">' + (i + 1) + '</li>');
            }
        }
        //add purchase menu option
        var purchasecount = 0;
        $.each(me.allpurchased, function() {
            purchasecount += (this).length;
        });
        if (purchasecount > 0 && main) {
            $(me.ul).append('<li class="own">PURCHASED ></li>');
        }
        
        $(me.ul).find('li.lvl').click(function() {
            gh.audio.select.play();
            var lvl = parseInt($(this).text(), 10);
            
            $(me.ul).find('li.lvl').removeClass('selected');
            $(this).addClass('selected');
            
            me.selected = lvl;
            
            me.breakmoving();
            
            me.deckhide();
            
            if (main) {
                me.deckshow(lvl, me.sortedDeck, me.allcards);
            } else {
                me.deckshow(lvl, me.sortedPurchased, me.allpurchased);
            }
            
        });
        $(me.ul).find('li.back').click(function() {
            gh.audio.select.play();
            me.breakmoving();
            
            if (main) {
            
                $.each(me.handremoveonrefresh, function() {
                    this.remove();
                });
                me.handhide();
                me.deckhide();
                
                me.menuhide(function() {
                    if (me.madechange) {
                        me.saveHand(function(newhand) {
                            me.madechange = false;
                            me.callback(newhand);
                        });
                    } else {
                        me.callback();
                    }
                });
                me.deckhide();
                me.handhide();
                
            } else {
                
                //from own to main -- its like a reverse own function
                me.domhide(me.ul, function() {
                    highestLevel = me.getHighestLevel(me.sortedDeck, me.allcards);
                        
                    me.menushow(highestLevel, me.allcards, true);
                    me.deckshow(highestLevel, me.sortedDeck, me.allcards);
                    me.selected = highestLevel;
                    me.menu = 'main';
                });
                me.deckhide();
            }
        });
        
        $(me.ul).find('li.own').click(function() {
            gh.audio.select.play();
            me.breakmoving();
            me.domhide(me.ul, function() {
                highestLevel = me.getHighestLevel(me.sortedPurchased, me.allpurchased);
            
                me.menushow(highestLevel, me.allpurchased, false);
                me.deckshow(highestLevel, me.sortedPurchased, me.allpurchased);
                me.selected = highestLevel;
                me.menu = 'own';
            });
            me.deckhide();
        });
        me.domshow(me.ul);
    },
    getHighestLevel: function(deck, alldeck) {
        var highestLevel = 0;
        $.each(deck, function(index) {
            if (this.length > 0) {
                highestLevel = index + 1;
            }
        });
        //if no highest level cards found, set selected to highest level without cards
        if (highestLevel == 0) {
            $.each(alldeck, function(index) {
                if (this.length > 0) {
                    highestLevel = index + 1;
                }
            });
        }
        return highestLevel;
    },
    menuhide: function(callback) {
        var me = this;
        me.domhide(me.ul);
        
        me.bar.stop().animate({ translation: [0, 25], height: 0, opacity: 0}, 1000, '<', function() {
            $('#deck').hide();
            callback();
        });
    },
    breakmoving: function() {
        var me = this;
        //handle those still animating between deck and hand:
        $.each(me.deckremoveonrefresh, function() {
            var x = (Math.random() * 755) + 50;
            var y = (Math.random() * 1000) - 200;
            this.stop().animate({rotation: 0, translation: [ x, y], opacity: 0, scale: 2}, 500, '<', function() {
                this.remove();
            });
        });
        me.deckremoveonrefresh = [];
        goingtodeck = [];
    },
    handshow: function(hand) {
        var me = this;
        $.each(hand, function(index) {
            if (gh.util.hasProperty(this, 'cardid')) {
                var it = this;
                setTimeout(function() {
                    var y = (Math.random() * 1000) - 500;
                    var card = me.canvas.image('/images/cards/' + ((it.purchased == 1) ? 'p' : '') + gh.data.color + '/' + it.image + '.png', 0, y, me.cW, me.cH).attr({'opacity' : 0, 'scale': 2});
                    card.animate({ rotation: 720, translation: [ me.handpos[index], 50 - y], opacity: 1, scale: 1}, 1000, '>');
                    me.handevent(card, it, index);
                    me.handobjs.push(card);
                }, index * 10);
            }
        });
    },
    handevent: function(card, it, handindex) {
        var me = this;
        $(card.node).css('cursor', 'pointer');
        $(card.node).bind('click', function(event) {
            gh.audio.draw.play();
            
            var deck = me.sortedDeck;
            var alldeck = me.allcards;
            
            if (it.purchased == 1) {
                deck = me.sortedPurchased;
                alldeck = me.allpurchased;
            }
            
            $(card.node).unbind('click');
            me.madechange = true;
            
            var refreshdeck = false;
            
            //is current level selected?
            var menu = (it.purchased == 1) ? 'own' : 'main';
            if ((it.level == me.selected) && (me.menu == menu)) {
                
                //figure out where to animate to: either blank or existing
                var dropIndex = -1;
                var lvlindex = parseInt(it.level, 10) - 1;
                $.each(deck[lvlindex], function(index) {
                    if (this.cardid == it.cardid) {
                        dropIndex = index + 1; //+1 cuz when we use this value for deckpos we have to skip over scale
                    }
                });
                //if the cardid was not found in the deck it means it will be added onto the end
                if (dropIndex == -1) {
                    dropIndex = deck[lvlindex].length + 1;
                }
                var deckpos = me.deckpos(alldeck[lvlindex].length);
                var animateto = deckpos[dropIndex];
                
                var newcard = card.clone();
                card.remove();
                
                me.goingtodeck.push(newcard.id);
                me.deckremoveonrefresh.push(newcard);
                
                //adjust layers
                newcard.toFront().attr({rotation: 0});
                if (!gh.defined(animateto[2])) { //if our drop spot is on the top row, move all bottom row cards to top
                    $.each(me.deckobjs, function(index) {
                        if (this.row == 1) {
                            this.card.toFront();
                        }
                    });
                }
                
                newcard.animate({ x: animateto[0], y: animateto[1], scale: 1}, 800, '>', function() {
                    
                    var onComplete = function() {
                        me.goingtodeck = $.grep(me.goingtodeck, function(value) {
                              return value != newcard.id;
                        });
                        if (me.goingtodeck.length == 0) {
                            me.deckrefresh(deck, alldeck);
                            
                            $.each(me.deckremoveonrefresh, function() {
                                this.remove();
                            });
                            me.deckremoveonrefresh = [];
                        }
                    };
                    
                    if (deckpos[0] !== 1) {
                        newcard.animate({ scale: deckpos[0]}, 500, '<', function() {
                            onComplete();
                        });
                    } else {
                        onComplete();
                    }
                    
                });
                rotation = (((newcard.attr('x') - animateto[0]) + 322) / 8.38) - 45;
                newcard.animate({rotation: rotation}, 400, '>', function() {
                    newcard.animate({rotation: 0}, 400, '>');
                });
                
            } else {
                //currently level not showing
                //greater than current level, throw left, otherwise throw right
                var x = 0;
                if ((it.purchased == 1 && me.menu == 'own') || (it.purchased == 0 && me.menu == 'main')) {
                    x = (it.level < me.selected) ? 900 : -900;
                } else if (it.purchased == 1 && me.menu == 'main') {
                    x = 900;
                } else {
                    x = -900;
                }
                var y = (Math.random() * 400) + 100;
                card.attr({rotation: 0});
                card.toFront().animate({ rotation: 0, translation: [ x, y ], scale: 2}, 1000, '>', function() {
                    card.remove();
                });
            }
            
            //add to deck structure
            me.addComplex(it, deck);
            
            //remove from hand structure 
            me.sortedHand[handindex] = {};
            
        });
    },
    handrefresh: function(hand) {
        var me = this;
        //rerender the currently showing level
        $.each(me.handobjs, function() {
            this.remove();
        });
        me.handobjs = [];
        
        $.each(hand, function(index) {
            if (gh.util.hasProperty(this, 'cardid')) {
                var it = this;
                var card = me.canvas.image('/images/cards/' + ((it.purchased == 1) ? 'p' : '') + gh.data.color + '/' + it.image + '.png', me.handpos[index], 50, me.cW, me.cH).attr({rotation: 720});
                me.handevent(card, it, index);
                me.handobjs.push(card);
            }
        });
    },
    handhide: function() {
        var me = this;
        $.each(me.handobjs, function() {
            var it = $.extend(true, {}, this);
            var x = (Math.random() * 755) + 50;
            var y = (Math.random() * 1000) - 200;
            it.animate({rotation: 0, translation: [ x, y ], opacity: 0, scale: 2}, 1000, '<', function() {
                it.remove();
            });
        });
        me.handobjs = [];
    },
    deckshow: function(level, deck, alldeck) {
        var me = this;
        
        var lvldeck = deck[level - 1]; 
        var deckpos = me.deckpos(alldeck[level -1].length); //first array element returned is scale
        
        $.each(lvldeck, function(index) {
            if (this.count > 0) { //yes, it is possible for the count to be zero, trust me
                var it = this;
                setTimeout(function() {
                    var x = (Math.random() * 1000) - 1000;
                    var y = (Math.random() * 1000) - 500;
                    var card = me.canvas.image('/images/cards/' + ((it.purchased == 1) ? 'p' : '') + gh.data.color + '/' + it.image + '.png', x, y, me.cW, me.cH).attr({'opacity' : 0, 'scale': 2});
                    var angle = (Math.random() * 3) - 1.5;
                    
                    var top = deckpos[index + 1][1];
                    var left = deckpos[index + 1][0];
                    var row = gh.defined(deckpos[index + 1][2]) ? deckpos[index + 1][2] : 0;
                    
                    if (it.count > 1) {
                        $(me.space).append('<div class="card-count hide rc-2 shadow cardid' + it.cardid + '" style="top:' + (top + 9) + 'px;right:' + ((755 - left) - 108) + 'px">' + it.count + '</div>');
                    }
                    
                    card.animate({ rotation: 720, translation: [ left - x, top - y], opacity: 1, scale: deckpos[0]}, 1000, '>', function() {
                        $(me.space).find('div.cardid' + it.cardid).fadeIn();
                    });
                    me.deckevent(card, it, deckpos[0], deck, alldeck);
                    me.deckobjs.push({
                        row: row,
                        card: card
                    });
                }, index * 10);
            }
        });
    },
    deckrefresh: function(deck, alldeck) {
        var me = this;
        //rerender the currently showing level
        $.each(me.deckobjs, function() {
            this.card.remove();
        });
        me.deckobjs = [];
        $(me.space).find('div.card-count').remove();
        
        var lvldeck = deck[me.selected - 1];
        var deckpos = me.deckpos(alldeck[me.selected -1].length); //first array element returned is scale
        
        $.each(lvldeck, function(index) {
            if (this.count > 0) { //yes, it is possible for the count to be zero, trust me
                var top = deckpos[index + 1][1];
                var left = deckpos[index + 1][0];
                var row = gh.defined(deckpos[index + 1][2]) ? deckpos[index + 1][2] : 0;
                var card = me.canvas.image('/images/cards/' + gh.data.color + '/' + this.image + '.png', left, top, me.cW, me.cH).attr({rotation: 720, scale: deckpos[0]});
                if (this.count > 1) {
                    $(me.space).append('<div class="card-count rc-2 shadow cardid' + this.cardid + '" style="top:' + (top + 9) + 'px;right:' + ((755 - left) - 108) + 'px">' + this.count + '</div>');
                }
                me.deckevent(card, this, deckpos[0], deck, alldeck);
                me.deckobjs.push({
                    row: row,
                    card: card
                });
            }
        });
    },
    deckevent: function(card, it, scale, deck, alldeck) {
        var me = this;
        $(card.node).css('cursor', 'pointer');
        $(card.node).bind('click', function(event) {
            
            
            //look for open space in hand
            var dropIndex = -1;
            $.each(me.sortedHand, function(index) {
                if (!gh.util.hasProperty(this, 'cardid')) {
                    dropIndex = index;
                    return false;
                }
            });
            if (dropIndex > -1) {
                gh.audio.draw.play();
                $(card.node).unbind('click');
                me.madechange = true;
                //found a place to put it
                
                scale = (scale == 1) ? 1 : 1.1;
                
                var newcard = card.clone();
                
                me.goingtohand.push(newcard.id);
                me.handremoveonrefresh.push(newcard);
                
                //if only one card, move it
                newcard.toFront().attr({rotation: 0});
                newcard.animate({x:  me.handpos[dropIndex], y: 50, scale: scale}, 800, '>', function() {
                    
                    me.goingtohand = $.grep(me.goingtohand, function(value) {
                          return value != newcard.id;
                    });
                    if (me.goingtohand.length == 0) {
                        me.handrefresh(me.sortedHand);
                        $.each(me.handremoveonrefresh, function() {
                            this.remove();
                        });
                        me.handremoveonrefresh = [];
                    }
                });
                rotation = (((me.handpos[dropIndex] - newcard.attr('x')) + 322) / 8.38) - 45;
                newcard.animate({rotation: rotation}, 400, '>', function() {
                    newcard.animate({rotation: 0}, 400, '>');
                });
                
                var refresh = false;
                if (it.count == 1) {
                    card.remove();
                } else {
                    refresh = true; //if count was greater than 1, we need a refresh on those badges
                }
                
                //for updating the sortedDeck, simple down the count
                $.each(deck[parseInt(it.level, 10) - 1], function() {
                    if (this.cardid == it.cardid) {
                        this.count--;
                    }
                });
                //build sortedhand
                me.sortedHand[dropIndex] = it;
                
                if (refresh) {
                    me.deckrefresh(deck, alldeck);
                }
                
            }
        });
    },
    deckhide: function() {
        var me = this;
        $(me.space).find('div.card-count').fadeOut(500, function() {
            $(this).remove();
        });
        $.each(me.deckobjs, function(index) {
            var it = $.extend(true, {}, this);
            var x = (Math.random() * 755) + 50;
            var y = (Math.random() * 1000) - 200;
            it.card.animate({rotation: 0, translation: [ x, y], opacity: 0, scale: 2}, 1000, '<', function() {
                it.card.remove();
            });
        });
        me.deckobjs = [];
    },
    deckpos: function(count) {
        //returns the position array for deck cards based on the number present (from all cards since we can drop from hand to deck)
        
        //one row: y = 320
        //two rows: y = 274 and 366
        
        switch (count) {
            case 1:
                return [[1],[322, 320]];
            case 2:
                return [[1], [384, 320], [259, 320]];  //2, 1
            case 3:
                return [[1], [322, 320], [197, 320], [447,320]];  //2, 1, 3
            case 4:
                return [[1], [384, 320], [259, 320], [509, 320], [134, 320]];  //4, 2, 1, 3
            case 5:
                return [[1], [322, 320], [197, 320], [447,320], [72, 320], [572, 320]];  //4, 2, 1, 3, 5
            case 6:
                return [[0.9],[374, 320], [265, 320], [483, 320], [156, 320], [592, 320], [47, 320]]; // 6, 4, 2, 1, 3, 5
            case 7:
                return [[0.9],[374, 274], [265, 274], [483, 274], [156, 274],     [322, 366, 1], [213, 366, 1], [431, 366, 1]];
                //4, 2, 1, 3
                // 6, 5, 7
            case 8:
                return [[0.9],[374, 274], [265, 274], [483, 274], [156, 274],     [374, 366, 1], [265, 366, 1], [483, 366, 1], [156, 366, 1]];
                //4, 2, 1, 3
                //8, 6, 5, 7
            case 9:
                return [[0.9],[374, 274], [265, 274], [483, 274], [156, 274],     [431, 366, 1], [213, 366, 1], [104, 366, 1], [322, 366, 1], [540,366, 1]];
                // 4, 2, 1, 3
                //8, 6, 5, 7, 9
            case 10:
                return [[0.9],[374, 274], [265, 274], [483, 274], [156, 274], [592, 320], [47, 320],     [374, 366, 1], [265, 366, 1], [483, 366, 1], [156, 366, 1]];
                //6, 4, 2, 1, 3, 5
                //  10, 8, 7, 9
            default:
                return [[0.9],[374, 274], [265, 274], [483, 274], [156, 274], [592, 274], [47, 274],     [431, 366, 1], [213, 366, 1], [104, 366, 1], [322, 366, 1], [540,366, 1]];
                // 6, 4, 2, 1, 3, 5
                // 10, 8, 7, 9, 11
        }
    },
    saveHand: function(callback) {
        var me = this;
        var cardids = [];
        $.each(me.sortedHand, function() {
            if (gh.util.hasProperty(this, 'cardid')) {
                cardids.push(this.cardid);
            }
        });
        $.ajax({
            url: '/index/set-hand',
            type: 'POST',
            dataType: 'json',
            data: {
                'oiuqwoiuoioasiuodijoqoqiwpj': gh.util.arrayToString(cardids, ',')
            },
            success: function(response) {
                callback(response);
            },
            error: function() {
                gh.manager.error();
            }
        });
    }

};