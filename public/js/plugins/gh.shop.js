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
    
    selectSwitch: null, //a function to call when a different menu item is selected
    
    cW:         117,       //static card width
    cH:         146,      //static card height
    pos:        [72, 197, 322, 447, 572],
    
    initialize: function(wrapper) {
        var me = this;
        $(document).ready(function() {
            
            me.wrapper = wrapper;
            
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
        $.each(me.stock, function(index) {
            var it = this;
            setTimeout(function() {
                var x = (Math.random() * 1000) - 1000;
                var y = (Math.random() * 1000) - 500;
                var card = me.canvas.image('/images/cards/p' + gh.data.color + '/' + it.image + '.png', x, y, me.cW, me.cH).attr({'opacity' : 0, scale: 2});
                
                //$(me.space).append('<div class="card-count hide rc-2 shadow cardid' + it.cardid + '" style="top:' + (index < 5 ? 314 : 478) + 'px;right:' + ((755 - me.pos[(index < 5 ? index : index - 5)]) - 108) + 'px">OWN: ' + it.userowns + '</div>');
                
                $(me.space).append('<div class="buybar hide" title="' + it.name + '<br/>(Level ' + it.level + ')<br/>Own: ' + it.userowns + '" style="top:' + (index < 5 ? 298 : 461) + 'px;left:' + (me.pos[(index < 5 ? index : index - 5)] + 10) + 'px"><div class="price">' + it.price + '</div><div id="buy' + it.cardid + '" class="buy">BUY</div></div>');
                
                $('#buy' + it.cardid).click(function() {
                    gh.audio.select.play();
                    gh.manager.loading(true);
                    gh.platform.purchase('card', it.cardid, function(response) {
                        gh.manager.loading(false);
                        if (gh.util.hasProperty(response, 'result.status')) {
                            if (response.result.status == 'settled') {
                                gh.data.deckcount++; //increase local deck count. relevant if count was zero, this opens up the deck menu item now
                            }
                        }
                    });
                });
                
                var bar = me.canvas.rect(me.pos[(index < 5 ? index : index - 5)] + 6, (index < 5 ? 296 : 459), 105, 25).attr({ 'fill': 'black', 'opacity': 0, 'stroke-width': '0' });
                
                card.animate({ rotation: 360, translation: [ me.pos[(index < 5 ? index : index - 5)] - x, (index < 5 ? 185 : 350) - y], opacity: 1, scale: 1}, 1000, '>', function() {
                    $(me.space).find('div.cardid' + it.cardid).fadeIn();
                    $(me.space).find('div.buybar').fadeIn();
                    bar.animate({ opacity: 0.7}, 500, '>');
                });
                me.cards.push(card);
                me.bars.push(bar);
            }, index * 50);
        });
        setTimeout(function() {
            $('div.buybar[title]').tooltip({
                effect: 'slide',
                position: 'bottom center',
                offset: [0, 4],
                tipClass: 'shoptip'
            });
        }, 600);
    },
    cardshide: function() {
        var me = this;
        $.each(me.bars, function(index) {
            var it = $.extend(true, {}, this);
            it.animate({opacity: 0 }, 500, '<', function() {
                it.remove();
            });
        });
        $.each(me.cards, function(index) {
            var it = $.extend(true, {}, this);
            setTimeout(function() {
                var x = (Math.random() * 755) + 50;
                var y = (Math.random() * 1000) - 200;
                it.animate({rotation: 0, translation: [ x, y ], opacity: 0, scale: 2}, 1000, '<', function() {
                    it.remove();
                });
            }, index * 50);
        });
        /*
        $(me.space).find('div.card-count').fadeOut(500, function() {
            $(me.space).find('div.card-count').remove();
        });
        */
        $(me.space).find('div.buybar').fadeOut(500, function() {
            $(me.space).find('div.buybar').remove();
        });
        $('.shoptip').remove();
        me.cards = [];
        me.bars = [];
    },
    colorsshow: function() {
        var me = this;
        $.each(me.colorstock, function(index) {
            var it = this;
            setTimeout(function() {
                var x = (Math.random() * 1000) - 1000;
                var y = (Math.random() * 1000) - 500;
                var card = me.canvas.image('/images/' + it.name + 'deck.png', x, y, 127, 156).attr({'opacity' : 0, scale: 0.3});
                
                $(me.space).append('<div class="colorbuybar hide" title="' + (it.name).capitaliseFirstLetter() + ' Deck" style="top:' + (index < 5 ? 342 : 461) + 'px;left:' + (me.pos[(index < 5 ? index : index - 5)] + 3) + 'px"><div class="price">' + it.price + '</div><div id="buycolor' + it.id + '" class="buy">BUY</div></div>');
                
                $('#buycolor' + it.id).click(function() {
                    gh.audio.select.play();
                    gh.manager.loading(true);
                    gh.platform.purchase('color', it.id, function(response) {
                        gh.manager.loading(false);
                        if (response.result.status == 'settled') {
                            //add to color array
                            if ($.inArray(it.name, gh.data.colors) == -1) {
                                gh.data.colors.push(it.name);
                            }
                            gh.manager.imagePreLoad('/images/swatches/' + it.name + 'swatch.png');
                            gh.data.color = response.result.color;
                        }
                    });
                });
                var bar = me.canvas.rect(me.pos[(index < 5 ? index : index - 5)] - 1, (index < 5 ? 340 : 459), 99, 25).attr({ 'fill': 'black', 'opacity': 0, 'stroke-width': '0' });
                
                card.animate({ rotation: 360, translation: [ (me.pos[(index < 5 ? index : index - 5)] - 18) - x, (index < 5 ? 230 : 350) - y], opacity: 1, scale: 1}, 1000, '>', function() {
                    //$(me.space).find('div.cardid' + it.cardid).fadeIn();
                    $(me.space).find('div.colorbuybar').fadeIn();
                    bar.animate({ opacity: 0.7}, 500, '>');
                });
                me.colors.push(card);
                me.colorbars.push(bar);
            }, 50 * index);
        });
        setTimeout(function() {
            $('div.colorbuybar[title]').tooltip({
                effect: 'slide',
                position: 'bottom center',
                offset: [0, 4],
                tipClass: 'shoptip'
            });
        }, 600);
    },
    colorshide: function() {
        var me = this;
        $.each(me.colorbars, function(index) {
            var it = $.extend(true, {}, this);
            it.animate({opacity: 0 }, 500, '<', function() {
                it.remove();
            });
        });
        $.each(me.colors, function(index) {
            var it = $.extend(true, {}, this);
            setTimeout(function() {
                var x = (Math.random() * 755) + 50;
                var y = (Math.random() * 1000) - 200;
                it.animate({rotation: 0, translation: [ x, y ], opacity: 0, scale: 4}, 1000, '<', function() {
                    it.remove();
                });
            }, index * 50);
        });
        $(me.space).find('div.colorbuybar').fadeOut(500, function() {
            $(me.space).find('div.colorbuybar').remove();
        });
        $('.shoptip').remove();
        me.colors = [];
        me.colorbars = [];
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
