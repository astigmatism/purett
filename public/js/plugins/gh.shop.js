gh.shop = function(wrapper) {
    this.initialize(wrapper);
};
gh.shop.prototype = {
    
    wrapper:    null,
    canvas:     null,
    bar:        null,
    ul:         null,
    space:      null,
    
    stock:      [],
    cards:      [],
    bars:       [],
    soldCards:  null,
    pendingCards: null,
    cardTimers: null,
    cardRender: 0,
    
    colorstock: [{
        id: 1,
        name:'green',
        price: 20
    },{
        id: 2,
        name:'purple',
        price: 20
    },{
        id: 3,
        name:'orange',
        price: 20
    },{
        id: 4,
        name:'black',
        price: 50
    },{
        id: 5,
        name:'white',
        price: 50
    }],
    
    colors:     [],
    colorbars:  [],
    soldColors: null,
    pendingColors: null,
    colorTimers: null,
    colorRender: 0,
    
    selectSwitch: null, //a function to call when a different menu item is selected
    
    cW:         117,       //static card width
    cH:         146,      //static card height
    pos:        [72, 197, 322, 447, 572],
    
    initialize: function(wrapper) {
        var me = this;
        $(document).ready(function() {
            
            me.wrapper = wrapper;
            me.soldCards = {};
            me.soldColors = {};
            me.pendingCards = {};
            me.pendingColors = {};
            me.cardTimers = [];
            me.colorTimers = [];
            
            $(wrapper).append('<div id="shop" class="abs"></div>');
            $(wrapper).append('<ul class="shopmenu"></ul>');
            
            me.space = '#shop';
            
            me.ul = '#content ul.shopmenu';
            
            me.canvas = Raphael("shop", 755, 562);
            
            me.bar = me.canvas.rect(31, 125, 695, 0).attr({ 'fill': 'black', 'opacity': 0, 'stroke-width': '0' });
        });
    },
    go: function(options, callback) {
        var me = this;
        me.callback = callback;
        me.stock = options.stock;
        
        
        $('#shop').show();
        me.show();
        
        //build shortcut for return to main menu
        $('#title').css('cursor','pointer').click(function() {
            $(me.ul).find('li.back').trigger('click');
        });
        
        me.cardsshow();
        me.selectSwitch = function() {
            me.cardshide();
        };
    },
    show: function() {
        var me = this;
        $('#store').show();
        
        $(me.ul).empty();
        $(me.ul).append('<li class="back">< BACK</li><li class="cards selected">CARDS</li><li class="colors">DECK COLORS</li>');
        
        $(me.ul).find('li.back').click(function() {
            gh.audio.select.play();
            me.hide(function() {
                $('#title').unbind('click').css('cursor','default');
                me.callback();
            });
        });
        $(me.ul).children().click(function() {
            gh.audio.select.play();
            if (gh.defined(me.selectSwitch, 'function')) {
                me.selectSwitch();
            }
            $(this).siblings().removeClass('selected');
            switch($(this).attr('class')) {
                case 'cards':
                    me.cardsshow();
                    me.selectSwitch = function() {
                        me.cardshide();
                    };
                    break;
                case 'colors':
                    me.colorsshow();
                    me.selectSwitch = function() {
                        me.colorshide();
                    };
                    break;
            }
            if (!$(this).hasClass('back')) {
                $(this).addClass('selected');
            }
        });
        
        me.bar.stop().attr({x:31, y:125});
        me.bar.animate({ translation: [0, -25], height: 50, opacity: 1}, 1000, '<', function() {
            me.domshow(me.ul);
        });
    },
    hide: function(callback) {
        var me = this;
        
        me.domhide(me.ul);
        me.cardshide();
        
        me.bar.stop().animate({ translation: [0, 25], height: 0, opacity: 0}, 1500, '<', function() {
            $('#shop').hide();
            callback();
        });
    },
    cardsshow: function() {
        var me = this;
        var generation = ++me.cardRender;
        $.each(me.cardTimers, function(index, timer) {
            clearTimeout(timer);
        });
        me.cardTimers = [];
        $.each(me.stock, function(index) {
            var it = this;
            if (me.soldCards[it.cardid]) {
                return true;
            }
            var timer = setTimeout(function() {
                if (generation != me.cardRender) {
                    return;
                }
                var x = (Math.random() * 1000) - 1000;
                var y = (Math.random() * 1000) - 500;
                var card = me.canvas.image('/images/cards/p' + gh.data.color + '/' + it.image + '.png', x, y, me.cW, me.cH).attr({'opacity' : 0, scale: 2});
                $(card.node).attr({'data-shop-role': 'item', 'data-shop-type': 'card', 'data-shop-id': it.cardid, 'data-shop-slot': index});
                
                //$(me.space).append('<div class="card-count hide rc-2 shadow cardid' + it.cardid + '" style="top:' + (index < 5 ? 314 : 478) + 'px;right:' + ((755 - me.pos[(index < 5 ? index : index - 5)]) - 108) + 'px">OWN: ' + it.userowns + '</div>');
                
                var button = $('<button type="button" id="buy' + it.cardid + '" class="buybar hide" data-shop-type="card" data-shop-id="' + it.cardid + '" data-shop-slot="' + index + '" data-shop-generation="' + generation + '" aria-label="Buy for ' + it.price + ' coins" title="' + it.name + '<br/>(Level ' + it.level + ')<br/>Own: ' + it.userowns + '" style="top:' + (index < 5 ? 298 : 461) + 'px;left:' + (me.pos[(index < 5 ? index : index - 5)] + 6) + 'px"><span class="buy">BUY</span><span aria-hidden="true"> &middot; </span><span class="price">' + it.price + '</span></button>');
                button.appendTo(me.space);
                if (me.pendingCards[it.cardid]) {
                    button.attr({'disabled': 'disabled', 'aria-busy': 'true'});
                }
                
                button.click(function() {
                    var buttonNode = this;
                    if ($(buttonNode).attr('disabled') || me.pendingCards[it.cardid]) {
                        return;
                    }
                    gh.audio.select.play();
                    me.pendingCards[it.cardid] = true;
                    $(buttonNode).attr({'disabled': 'disabled', 'aria-busy': 'true'});
                    gh.manager.loading(true);
                    gh.platform.purchase('card', it.cardid, function(response) {
                        gh.manager.loading(false);
                        if (gh.util.hasProperty(response, 'result.status')) {
                            if (response.result.status == 'settled') {
                                gh.data.deckcount++; //increase local deck count. relevant if count was zero, this opens up the deck menu item now
                                me.purchasecomplete('card', it.cardid, index, card, bar, buttonNode);
                                return;
                            }
                        }
                        me.purchasefailed('card', it.cardid, buttonNode);
                    });
                });
                
                var bar = me.canvas.rect(me.pos[(index < 5 ? index : index - 5)] + 6, (index < 5 ? 296 : 459), 105, 25).attr({ 'fill': 'black', 'opacity': 0, 'stroke-width': '0' });
                $(bar.node).attr({'data-shop-role': 'buybar', 'data-shop-type': 'card', 'data-shop-id': it.cardid, 'data-shop-slot': index});
                
                card.animate({ rotation: 360, translation: [ me.pos[(index < 5 ? index : index - 5)] - x, (index < 5 ? 185 : 350) - y], opacity: 1, scale: 1}, 1000, '>', function() {
                    if (generation != me.cardRender || card.removed) {
                        return;
                    }
                    $(me.space).find('div.cardid' + it.cardid).fadeIn();
                    button.fadeIn();
                    bar.animate({ opacity: 0.7}, 500, '>');
                });
                me.cards[index] = card;
                me.bars[index] = bar;
            }, index * 50);
            me.cardTimers.push(timer);
        });
        me.cardTimers.push(setTimeout(function() {
            if (generation != me.cardRender) {
                return;
            }
            $(me.space).find('button.buybar[data-shop-generation="' + generation + '"][title]').tooltip({
                effect: 'slide',
                position: 'bottom center',
                offset: [0, 4],
                tipClass: 'shoptip'
            });
        }, 600));
    },
    purchasecomplete: function(type, id, index, card, bar, button) {
        var me = this;
        var cards = (type == 'card') ? me.cards : me.colors;
        var bars = (type == 'card') ? me.bars : me.colorbars;
        var sold = (type == 'card') ? me.soldCards : me.soldColors;
        var pending = (type == 'card') ? me.pendingCards : me.pendingColors;
        var currentCard = cards[index];
        var currentBar = bars[index];
        var x = (Math.random() * 755) + 50;
        var y = (Math.random() * 1000) - 200;

        delete pending[id];
        sold[id] = true;
        if (currentCard && currentCard.node && $(currentCard.node).attr('data-shop-id') == id) {
            card = currentCard;
        }
        if (currentBar && currentBar.node && $(currentBar.node).attr('data-shop-id') == id) {
            bar = currentBar;
        }
        var purchaseButtons = $(button).add($(me.space).find('button[data-shop-type="' + type + '"][data-shop-id="' + id + '"]'));
        purchaseButtons.removeAttr('aria-busy').attr('data-shop-state', 'sold').fadeOut(200, function() {
            $(this).remove();
        });
        $('.shoptip').remove();

        if (bars[index] === bar && bar && !bar.removed && bar.node && bar.node.parentNode) {
            bars[index] = null;
            $(bar.node).attr('data-shop-state', 'sold');
            bar.stop().animate({opacity: 0}, 300, '<', function() {
                if (!bar.removed && bar.node && bar.node.parentNode) {
                    bar.remove();
                }
            });
        }

        if (cards[index] === card && card && !card.removed && card.node && card.node.parentNode) {
            cards[index] = null;
            $(card.node).attr('data-shop-state', 'purchased');
            card.stop().toFront().attr({rotation: 720});
            card.animate({rotation: 0, translation: [x, y], opacity: 0, scale: 2}, 1000, '<', function() {
                if (!card.removed && card.node && card.node.parentNode) {
                    card.remove();
                }
            });
        }
    },
    purchasefailed: function(type, id, button) {
        var pending = (type == 'card') ? this.pendingCards : this.pendingColors;
        delete pending[id];
        var purchaseButtons = $(button).add($(this.space).find('button[data-shop-type="' + type + '"][data-shop-id="' + id + '"]'));
        purchaseButtons.removeAttr('disabled').removeAttr('aria-busy');
    },
    cardshide: function() {
        var me = this;
        var bars = me.bars;
        var cards = me.cards;
        ++me.cardRender;
        $.each(me.cardTimers, function(index, timer) {
            clearTimeout(timer);
        });
        me.cardTimers = [];
        me.cards = [];
        me.bars = [];
        $.each(bars, function(index, bar) {
            if (!bar) {
                return true;
            }
            bar.stop().animate({opacity: 0 }, 500, '<', function() {
                if (!bar.removed && bar.node && bar.node.parentNode) {
                    bar.remove();
                }
            });
        });
        $.each(cards, function(index, card) {
            if (!card) {
                return true;
            }
            setTimeout(function() {
                var x = (Math.random() * 755) + 50;
                var y = (Math.random() * 1000) - 200;
                card.stop().animate({rotation: 0, translation: [ x, y ], opacity: 0, scale: 2}, 1000, '<', function() {
                    if (!card.removed && card.node && card.node.parentNode) {
                        card.remove();
                    }
                });
            }, index * 50);
        });
        /*
        $(me.space).find('div.card-count').fadeOut(500, function() {
            $(me.space).find('div.card-count').remove();
        });
        */
        $(me.space).find('button.buybar').stop(true, true).fadeOut(500, function() {
            $(this).remove();
        });
        $('.shoptip').remove();
    },
    colorsshow: function() {
        var me = this;
        var generation = ++me.colorRender;
        $.each(me.colorTimers, function(index, timer) {
            clearTimeout(timer);
        });
        me.colorTimers = [];
        $.each(me.colorstock, function(index) {
            var it = this;
            if (me.soldColors[it.id]) {
                return true;
            }
            var timer = setTimeout(function() {
                if (generation != me.colorRender) {
                    return;
                }
                var x = (Math.random() * 1000) - 1000;
                var y = (Math.random() * 1000) - 500;
                var card = me.canvas.image('/images/' + it.name + 'deck.png', x, y, 127, 156).attr({'opacity' : 0, scale: 0.3});
                $(card.node).attr({'data-shop-role': 'item', 'data-shop-type': 'color', 'data-shop-id': it.id, 'data-shop-slot': index});
                
                var button = $('<button type="button" id="buycolor' + it.id + '" class="colorbuybar hide" data-shop-type="color" data-shop-id="' + it.id + '" data-shop-slot="' + index + '" data-shop-generation="' + generation + '" aria-label="Buy for ' + it.price + ' coins" title="' + (it.name).capitaliseFirstLetter() + ' Deck" style="top:' + (index < 5 ? 342 : 461) + 'px;left:' + (me.pos[(index < 5 ? index : index - 5)] - 1) + 'px"><span class="buy">BUY</span><span aria-hidden="true"> &middot; </span><span class="price">' + it.price + '</span></button>');
                button.appendTo(me.space);
                if (me.pendingColors[it.id]) {
                    button.attr({'disabled': 'disabled', 'aria-busy': 'true'});
                }
                
                button.click(function() {
                    var buttonNode = this;
                    if ($(buttonNode).attr('disabled') || me.pendingColors[it.id]) {
                        return;
                    }
                    gh.audio.select.play();
                    me.pendingColors[it.id] = true;
                    $(buttonNode).attr({'disabled': 'disabled', 'aria-busy': 'true'});
                    gh.manager.loading(true);
                    gh.platform.purchase('color', it.id, function(response) {
                        gh.manager.loading(false);
                        if (gh.util.hasProperty(response, 'result.status') && response.result.status == 'settled') {
                            //add to color array
                            if ($.inArray(it.name, gh.data.colors) == -1) {
                                gh.data.colors.push(it.name);
                            }
                            gh.manager.imagePreLoad('/images/swatches/' + it.name + 'swatch.png');
                            gh.data.color = response.result.color;
                            me.purchasecomplete('color', it.id, index, card, bar, buttonNode);
                            return;
                        }
                        me.purchasefailed('color', it.id, buttonNode);
                    });
                });
                var bar = me.canvas.rect(me.pos[(index < 5 ? index : index - 5)] - 1, (index < 5 ? 340 : 459), 99, 25).attr({ 'fill': 'black', 'opacity': 0, 'stroke-width': '0' });
                $(bar.node).attr({'data-shop-role': 'buybar', 'data-shop-type': 'color', 'data-shop-id': it.id, 'data-shop-slot': index});
                
                card.animate({ rotation: 360, translation: [ (me.pos[(index < 5 ? index : index - 5)] - 18) - x, (index < 5 ? 230 : 350) - y], opacity: 1, scale: 1}, 1000, '>', function() {
                    if (generation != me.colorRender || card.removed) {
                        return;
                    }
                    //$(me.space).find('div.cardid' + it.cardid).fadeIn();
                    button.fadeIn();
                    bar.animate({ opacity: 0.7}, 500, '>');
                });
                me.colors[index] = card;
                me.colorbars[index] = bar;
            }, 50 * index);
            me.colorTimers.push(timer);
        });
        me.colorTimers.push(setTimeout(function() {
            if (generation != me.colorRender) {
                return;
            }
            $(me.space).find('button.colorbuybar[data-shop-generation="' + generation + '"][title]').tooltip({
                effect: 'slide',
                position: 'bottom center',
                offset: [0, 4],
                tipClass: 'shoptip'
            });
        }, 600));
    },
    colorshide: function() {
        var me = this;
        var bars = me.colorbars;
        var cards = me.colors;
        ++me.colorRender;
        $.each(me.colorTimers, function(index, timer) {
            clearTimeout(timer);
        });
        me.colorTimers = [];
        me.colors = [];
        me.colorbars = [];
        $.each(bars, function(index, bar) {
            if (!bar) {
                return true;
            }
            bar.stop().animate({opacity: 0 }, 500, '<', function() {
                if (!bar.removed && bar.node && bar.node.parentNode) {
                    bar.remove();
                }
            });
        });
        $.each(cards, function(index, card) {
            if (!card) {
                return true;
            }
            setTimeout(function() {
                var x = (Math.random() * 755) + 50;
                var y = (Math.random() * 1000) - 200;
                card.stop().animate({rotation: 0, translation: [ x, y ], opacity: 0, scale: 4}, 1000, '<', function() {
                    if (!card.removed && card.node && card.node.parentNode) {
                        card.remove();
                    }
                });
            }, index * 50);
        });
        $(me.space).find('button.colorbuybar').stop(true, true).fadeOut(500, function() {
            $(this).remove();
        });
        $('.shoptip').remove();
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
    }
};
