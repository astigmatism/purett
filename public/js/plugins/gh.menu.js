gh.menu = function(wrapper, callback) {
    this.initialize(wrapper, callback);
};
gh.menu.prototype = {
    
    wrapper:    null,
    canvas:     null,
    bar:        null,
    ul:         null,
    hand:       [],
    cW:         117,       //static card width
    cH:         146,      //static card height
    pos:        [72, 197, 322, 447, 572],
    
    initialize: function(wrapper, callback) {
        var me = this;
        $(document).ready(function() {
            
            me.wrapper = wrapper;
            
            $(wrapper).append('<div id="menu" class="abs"></div>');
            $(wrapper).append('<ul class="mainmenu"></ul>');
            $(wrapper).append('<div class="stats"></div>');
            $(wrapper).append('<div id="topplayers-wrapper"></div>');
            
            me.ul = '#content ul.mainmenu';
            me.stats = '#content div.stats';
            me.toplayers = '#topplayers-wrapper';
            me.nextrules = '#rules';
            
            me.canvas = Raphael("menu", 755, 562);
            
            me.bar = me.canvas.rect(31, 125, 695, 0).attr({ 'fill': 'black', 'opacity': 0, 'stroke-width': '0' });
            
            if (gh.defined(callback, 'function')) {
                callback();
            }
            
            me.gamesplayed = gh.data.wins + gh.data.losses + gh.data.draws;
        });
    },
    show: function(callback) {
        var me = this;
        $('#menu').show();
        me.bar.stop().attr({x:31, y:125});
        me.bar.animate({ translation: [0, -25], height: 50, opacity: 1}, 1000, '<', function() {
            callback();
        });
        
        me.updatestats();
        me.updaterules();
        
        me.handshow(gh.data.hand);
        if ((gh.data.wins + gh.data.losses) > 0) {
            me.domshow(me.stats);
        }
        if (gh.data.nextrules.length > 0 && me.gamesplayed > 0) {
            me.domshow(me.nextrules);
        }
    },
    hide: function() {
        var me = this;

        me.domhide(me.ul);
        me.domhide(me.stats);
        me.domhide(me.nextrules);

        me.bar.stop().animate({ translation: [0, 25], height: 0, opacity: 0}, 1000, '<', function() {
            $('#menu').hide();
        });
        
        me.handhide();
        
        $(me.toplayers).fadeOut(500, function() {
            $(me.toplayers).empty();
        });
    },
    main: function(callbacks) {
        var me = this;
        
        $(me.ul).empty();
        
        me.updatetopplayers();
        
        
        $(me.ul).append('<li class="play">' + (gh.data.ingame === 0 ? 'PLAY' : 'RESUME GAME') + '</li>');
        // Local accounts do not need platform-era progression gates to reach
        // the recovered tutorials or the local coin shop.
        $(me.ul).append('<li class="shop">SHOP</li><li class="tutorials">TUTORIALS</li>');
        if (gh.data.latestReplay) {
            $(me.ul).append('<li class="replay">REPLAY</li>');
        }
        if (gh.data.deckcount > 0 && !gh.data.ingame) {
            $(me.ul).append('<li class="deck">DECK</li>');
        }
        
        $.each($(me.ul).find('li'), function() {
            $(this).click(function() {
                gh.audio.select.play();
                $(this).unbind('click');
                callbacks[$(this).attr('class')]();
            });
        });
        
        if (gh.data.hand.length !== 5) {
            $('#content ul.mainmenu li.play').attr('title', 'You need five cards in-hand to play! Select DECK to build a hand from your collection.');
            $('#content ul.mainmenu li.play[title]').tooltip({
                effect: 'slide',
                position: 'bottom center',
                tipClass: 'decktip'
            });
        }
        
        me.domshow(me.ul);
        me.domshow(me.toplayers);
    },
    tutorial: function(callbacks) {
        var me = this;
        me.domhide(me.ul, function() {
            
            $(me.ul).empty();
            // Standalone installations expose all recovered public tutorials;
            // progression still controls which rules appear in normal games.
            $(me.ul).append('<li class="back">< BACK</li><li class="basics">BASICS</li><li class="same">SAME</li><li class="plus">PLUS</li><li class="elemental">ELEMENTAL</li>');
            
            
            $.each($(me.ul).find('li'), function() {
                $(this).click(function() {
                    gh.audio.select.play();
                    callbacks[$(this).attr('class')]();
                });
            });
            
            me.domshow(me.ul);
        });
    },
    handshow: function(hand) {
        var me = this;
        $.each(hand, function(index) {
            var x = (Math.random() * 1000) - 1000;
            var y = (Math.random() * 1000) - 500;
            var card = me.canvas.image('/images/cards/' + ((this.purchased == 1) ? 'p' : '') + gh.data.color + '/' + this.image + '.png', x, y, me.cW, me.cH).attr({'opacity' : 0, scale: 2});
            //me.pos[index], 175
            var angle = (Math.random() * 5) - 2.5;
            card.animate({ rotation: 720 - angle, translation: [ me.pos[index] - x, 175 - y], opacity: 1, scale: 1}, 1000, '>');
            me.hand.push(card);
        });
    },
    handhide: function() {
        var me = this;
        $.each(me.hand, function() {
            var x = (Math.random() * 1000) + 755;
            var y = (Math.random() * 1000) - 200;
            this.animate({rotation: 0, translation: [ x, y], opacity: 0, scale: 2}, 1000, '<', function() {
                this.remove();
            });
        });
        me.hand = [];
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
    updatestats: function() {
        var me = this;
        var ribbonArt = ''
            + '<svg class="record-ribbon-art" viewBox="0 0 344 60" aria-hidden="true">'
            + '<defs><linearGradient id="record-ribbon-parchment" x1="0" y1="0" x2="0" y2="1">'
            + '<stop offset="0" stop-color="#f8e9c9"></stop>'
            + '<stop offset="1" stop-color="#e1ca9f"></stop>'
            + '</linearGradient></defs>'
            + '<g opacity="0.72">'
            + '<path fill="url(#record-ribbon-parchment)" d="M0 10H49V54H0L13 32Z"></path>'
            + '<path fill="url(#record-ribbon-parchment)" d="M295 10H344L331 32L344 54H295Z"></path>'
            + '<rect fill="url(#record-ribbon-parchment)" x="30" y="0" width="284" height="46"></rect>'
            + '<path fill="#8a6038" d="M30 46H49V54Z"></path>'
            + '<path fill="#8a6038" d="M314 46H295V54Z"></path>'
            + '</g></svg>';
        var $ribbon = $('<span class="record-ribbon"></span>').append(ribbonArt);
        $ribbon.append(
            $('<span class="record-ribbon-content"></span>')
                .append('<span class="record-caption">CAREER RECORD</span>')
                .append(
                    $('<span class="record-main"></span>').text(
                        gh.data.name.toUpperCase() + '  \u00b7  ' + gh.data.wins + '\u2013' + gh.data.losses
                    )
                )
        );
        me.gamesplayed = gh.data.wins + gh.data.losses + gh.data.draws;
        $(me.stats).empty().append($ribbon);
    },
    updaterules: function() {
        var me = this;
        if (gh.data.ingame == 0) {
            $(me.nextrules).empty();
            $.each(gh.data.nextrules, function() {
                $(me.nextrules).append('<span title="' + this.description + ' ">' + (($(me.nextrules).text().length === 0) ? '' : ', ') + (this.name).toUpperCase() + '</span>');
            });
            
            $('.rulestip').remove();
            $("#rules span[title]").tooltip({
                effect: 'slide',
                position: 'bottom center',
                offset: [0, 30],
                tipClass: 'rulestip'
            });
            
            if ($(me.nextrules).text().length > 0) {
                $(me.nextrules).prepend('NEXT: ');
            }
        } else {
            $(me.nextrules).fadeOut(500, function() {
                $(me.nextrules).empty();
            });
        }
    },
    updatetopplayers: function() {
        var me = this;
        $(me.toplayers).empty();
        
        if (gh.data.leaderboard && gh.data.leaderboard.length) {
            $(me.toplayers).append('<ul></ul>');
            $.each(gh.data.leaderboard, function(index, item) {
                var average = Number(item.average_points || item.avg || 0).toFixed(2);
                var games = Number(item.games_played || item.total || 0);
                var name = String(item.display_name || 'Player');
                var initials = String(item.avatar_initials || name.charAt(0) || '?').slice(0, 2).toUpperCase();
                var $li = $('<li class="fl hide"></li>');
                $li.attr('title', item.wins + '-' + item.losses + '<br/>' + games + ' Games Played<br/>' + average + ' Points Avg.');
                $li.append($('<span class="local-avatar"></span>').text(initials));
                $li.append($('<div></div>').text((index + 1) + ': ' + name));
                $('#topplayers-wrapper ul').append($li);
                $li.tooltip({
                    effect: 'slide',
                    position: 'bottom center',
                    tipClass: 'topplayertip'
                });
                $li.fadeIn();
            });
        }
    }
};
