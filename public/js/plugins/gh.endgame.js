gh.endgame = function(wrapper) {
    this.initialize(wrapper);
};
gh.endgame.prototype = {
    
    canvas:     null,
    content:     null,
    cW:         117,       //static card width
    cH:         146,      //static card height
    pos:        [72, 197, 322, 447, 572],
    claimPending: false,
    
    intpos:     [
                    [322],
                    [259, 384],
                    [197, 322, 447],
                    [134, 259, 384, 509],
                    [72, 197, 322, 447, 572]
                ],
    
    initialize: function(wrapper) {
        var me = this;
        $(document).ready(function() {
            
            $(wrapper).append('<div id="end-game" class="abs"></div>');
            $(wrapper).append('<div class="victory"></div>');
            
            me.content  = '#content div.victory';
            me.space    = '#end-game';
            
            me.canvas = Raphael("end-game", 755, 562);
            
            me.resultbar    = me.canvas.rect(31, 281, 695, 0).attr({ 'fill': 'black', 'opacity': 0, 'stroke-width': '0' });
            me.claimbar     = me.canvas.rect(31, 125, 695, 0).attr({ 'fill': 'black', 'opacity': 0, 'stroke-width': '0' });
            
            $('#end-game').hide();
        });
    },
    go: function(options, callback) {
        var me = this;
        $('#end-game').show();
        me.callback = callback;
        switch (options.victory) {
            case 1:
                $(me.content).text('YOU WIN! ' + options.score);
                break;
            case 0:
                $(me.content).text('DRAW');
                break;
            case -1:
                $(me.content).text('YOU LOSE ' + options.score);
                break;
        }
        me.resultbar.animate({ translation: [0, -50], height: 100, opacity: 1 }, 2000, '<', function() {
            
            me.domshow(me.content);
            setTimeout(function() {
                $(me.content).fadeOut(500);
                me.resultbar.animate({ translation: [0, 50], height: 0, opacity: 0 }, 1000, '<', function() {
                
                    //conditions: won, claim, taken, given
                    
                    //take one: claim or taken/given
                    //take all: won, taken/given
                    //take direct: won, taken/given
                    //take difference: claim or taken/given
                    
                    me.claim(options, function() {
                        me.won(options, function() {
                            me.taken(options, function() {
                                me.given(options, function() {
                                    me.done();
                                });
                            });
                        });
                    });
                });
                
            }, 2000);
            
        });
    },
    done: function() {
        var me = this;
        $(me.content).hide().removeClass('claim');
        $('#end-game').hide();
        me.callback(); //all done!
    },
    claim: function(options, callback) {
        var me = this;
        me.claimPending = false;
        if (options.claim > 0) {
            
            me.barset('CLAIM ' + options.claim + ' OF YOUR OPPONENT\'S CARDS', function() {
                    
                var cards = [];
                var setClaimCardsEnabled = function(enabled) {
                    $.each(cards, function() {
                        if (this.node) {
                            $(this.node).css({
                                'cursor': enabled ? 'pointer' : 'wait'
                            });
                        }
                    });
                };
                
                $.each(options.p2h, function(index) {
                    var gamecard = this;
                    var x = (Math.random() * 1000) + 1000;
                    var y = (Math.random() * 1000) - 500;
                    var image = (this.image).replace(gh.data.color, 'red'); //since the data is coming from the endgame, of the cards are blue from being captured
                    var card = me.canvas.image('/images/cards/' + image + '.png', x, y, me.cW, me.cH).attr({'opacity' : 0, scale: 2});
                    cards.push(card);
                    $(card.node).css('cursor', 'pointer');
                    
                    var own = 0;
                    $.each(options.own, function() {
                        if (gh.util.hasProperty(this, 'gcid' + gamecard.gameCardId)) {
                            own = this['gcid' + gamecard.gameCardId];
                        }
                    });
                    $(me.space).append('<div class="card-count hide rc-2 shadow cardid' + gamecard.gameCardId + '" style="top:304px;right:' + ((755 - me.pos[index]) - 108) + 'px">OWN: ' + own + '</div>');
                    
                    var angle = (Math.random() * 5) - 2.5;
                    card.animate({ rotation: 720 - angle, translation: [ me.pos[index] - x, 175 - y], opacity: 1, scale: 1}, 1000, '>', function() {
                        $(me.space).find('div.cardid' + gamecard.gameCardId).fadeIn();
                        $(card.node).bind('click', function(event) {
                            if (me.claimPending) {
                                return false;
                            }

                            me.claimPending = true;
                            setClaimCardsEnabled(false);
                            card.attr({opacity: 0.65});

                            me.makeclaim(options.userid, options.gameid, gamecard.gameCardId, function(response) {
                                var remaining = parseInt(response && response.remaining, 10);
                                if (isNaN(remaining) || remaining < 0) {
                                    me.claimPending = false;
                                    card.attr({opacity: 1});
                                    setClaimCardsEnabled(true);
                                    gh.manager.error('The claim response was invalid.');
                                    return;
                                }

                                gh.audio.draw.play();
                                options.claim = remaining;
                                $(card.node).unbind('click').css('cursor', 'default');
                                cards = $.grep(cards, function(candidate) {
                                    return candidate !== card;
                                });

                                $(me.space).find('div.card-count.cardid' + gamecard.gameCardId).fadeOut(500, function() {
                                    $(me.space).find('div.card-count.cardid' + gamecard.gameCardId).remove();
                                });

                                if (options.claim === 0) {
                                    $(me.space).find('div.card-count').fadeOut(500, function() {
                                        $(me.space).find('div.card-count').remove();
                                    });

                                    setTimeout(function() {
                                        $.each(cards, function(index) {
                                            var it = this;
                                            setTimeout(function() {
                                                var x = (Math.random() * 1000) - 1000;
                                                var y = (Math.random() * 500);
                                                it.animate({ rotation: 0, translation: [ x, y ], opacity: 0, scale: 2}, 1000, '>', function() {
                                                    it.remove();
                                                });
                                            }, (index * 50));
                                        });
                                    }, 500);

                                    me.barclear(function() {
                                        callback();
                                    });
                                } else {
                                    $(me.content).text('CLAIM ' + options.claim + ' OF YOUR OPPONENT\'S CARDS');
                                    me.claimPending = false;
                                    setClaimCardsEnabled(true);
                                }

                                card.attr({opacity: 1});
                                card.animate({ rotation: 0, translation: [ 0, -500], opacity: 0, scale: 2}, 1000, '>', function() {
                                    card.remove();
                                });
                            }, function() {
                                me.claimPending = false;
                                card.attr({opacity: 1});
                                setClaimCardsEnabled(true);
                            });

                            return false;
                        });
                    });
                });
                
            });
        } else {
            callback();
        }
    },
    won: function(options, callback) {
        var me = this;
        if (options.won.length > 0) {
                
            var text = (options.won.length == 5) ? 'ALL' : options.won.length;
            me.barset('YOU TAKE ' + text + ' OF YOUR OPPONENT\'S CARDS', function() {
                
                $.each(options.won, function(index) {
                    var gamecard = this;
                    var x = (Math.random() * 1000) + 1000;
                    var y = (Math.random() * 1000) - 500;
                    var angle = (Math.random() * 5) - 2.5;
                    var card = me.canvas.image('/images/cards/red/' + this.image + '.png', x, y, me.cW, me.cH).attr({'opacity' : 0, scale: 2});
                    card.animate({ rotation: 720 - angle, translation: [ me.intpos[options.won.length-1][index] - x, 175 - y], opacity: 1, scale: 1}, 1000, '>', function() {
                        setTimeout(function() {
                            var x = (Math.random() * 1000) - 1000;
                            var y = (Math.random() * 500);
                            card.animate({ rotation: 0, translation: [x, y], opacity: 0, scale: 2}, 1000, '>', function() {
                                card.remove();
                            });
                        }, 1500 + (index * 50));
                    });
                });
                setTimeout(function() {
                    me.barclear(function() {
                        callback();
                    });
                }, 3000);
            });
        } else {
            callback();
        }
    },
    taken: function(options, callback) {
        var me = this;
        if (options.taken.length > 0) {
            
            var text = (options.taken.length == 5) ? 'ALL' : options.taken.length;
            me.barset('YOUR OPPONENT TAKES ' + text + ' OF YOUR CARDS', function() {
                    
                var cards = [];
                
                $.each(options.p1h, function(index) {
                    var gamecard = this;
                    var x = (Math.random() * 1000) + 1000;
                    var y = (Math.random() * 1000) - 500;
                    var image = (this.image).replace('red', gh.data.color); //since the data is coming from the endgame, of the cards are blue from being captured
                    var card = me.canvas.image('/images/cards/' + image + '.png', x, y, me.cW, me.cH).attr({'opacity' : 0, scale: 2});
                    cards.push({
                        gamecardid: gamecard.gameCardId,
                        card: card
                    });
                    var angle = (Math.random() * 5) - 2.5;
                    card.animate({ rotation: 720 - angle, translation: [ me.pos[index] - x, 175 - y], opacity: 1, scale: 1}, 1000, '>', function() {
                        
                    });
                });
                setTimeout(function() {
                    
                    var takenids = [];
                    $.each(options.taken, function() {
                        takenids.push(this.gamecardid);
                    });
                    
                    $.each(cards, function(index) {
                        var it = this;
                        
                        if ($.inArray(it.gamecardid, takenids) > -1) {
                            it.card.attr({ rotation: 0 });
                            setTimeout(function() {
                                it.card.animate({ rotation: (Math.random() * 5) - 2.5, translation: [ 0, -25] }, 700, '>', function() {
                                    gh.audio.draw.play();
                                    it.card.animate({ rotation: 720, translation: [ 0, -500], opacity: 0, scale: 2}, 1000, '>', function() {
                                        it.card.remove();
                                    });
                                });
                            }, (index * 50));
                        } else {
                            setTimeout(function() {
                                var x = (Math.random() * 1000) - 1000;
                                var y = (Math.random() * 500);
                                it.card.animate({ rotation: 0, translation: [x, y], opacity: 0, scale: 2}, 1000, '>', function() {
                                    it.card.remove();
                                });
                            }, 2200 + (index * 50));
                        }
                    });
                        
                    setTimeout(function() {
                        me.barclear(function() {
                            callback();
                        });
                    }, 2500);
                    
                }, 2000);
            });
        } else {
            callback();
        }
    },
    given: function(options, callback) {
        var me = this;
        if (options.given.length > 0) {
            
            me.barset('FREEBIES FOR HAVING TOO FEW CARDS', function() {
                $.each(options.given, function(index) {
                    var gamecard = this;
                    var x = (Math.random() * 1000) + 1000;
                    var y = (Math.random() * 1000) - 500;
                    var angle = (Math.random() * 5) - 2.5;
                    var card = me.canvas.image('/images/cards/' + gh.data.color + '/' + this.image + '.png', x, y, me.cW, me.cH).attr({'opacity' : 0, scale: 2});
                    card.animate({ rotation: 720 - angle, translation: [ me.intpos[options.given.length-1][index] - x, 175 - y], opacity: 1, scale: 1}, 1000, '>', function() {
                        setTimeout(function() {
                            var x = (Math.random() * 1000) - 1000;
                            var y = (Math.random() * 500);
                            card.animate({ rotation: 0, translation: [x, y], opacity: 0, scale: 2}, 1000, '>', function() {
                                card.remove();
                            });
                        }, 1500 + (index * 50));
                    });
                });
                setTimeout(function() {
                    me.barclear(function() {
                        callback();
                    });
                }, 3000);
            });
        } else {
            callback();
        }
    },
    barset: function(title, callback) {
        var me = this;
        me.domhide(me.content, function() {
            $(me.content).text(title).addClass('claim');
            me.claimbar.animate({ translation: [0, -25], height: 50, opacity: 1 }, 1500, '<', function() {
                me.domshow(me.content);
                callback();
            });
        });
    },
    barclear: function(callback) {
        var me = this;
        $(me.content).fadeOut();
        me.claimbar.animate({ height: 0, translation: [0, 25], opacity: 0 }, 1000, '<', function() {
            callback();
        });
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
    makeclaim: function(userid, gameid, gamecardid, callback, errorcallback) {
        $.ajax({
            url: '/index/claim',
            data: {
                'bjvqiuoqijwocinoqejojklanslkj': userid,
                'kkjdoqijwoijofijoqiwoiueioqiw': gameid,
                'iqowijdoicqkwjklcnmknbfguttgo': gamecardid
            },
            dataType: 'json',
            type: 'POST',
            success: function(response) {
                callback(response);
            },
            error: function(response, status, message) {
                if (gh.defined(errorcallback, 'function')) {
                    errorcallback();
                }
                gh.manager.error(response.responseText);
            }
        });
    }
};
