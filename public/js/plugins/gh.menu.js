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
    showLeaderboard: false,
    graphics:   null,
    graphicsMode: 'legacy',
    modernHandReady: false,
    visible:    false,
    currentHandCards: [],
    
    initialize: function(wrapper, callback) {
        var me = this;
        $(document).ready(function() {
            
            me.wrapper = wrapper;
            me.hand = [];
            me.currentHandCards = [];
            
            $(wrapper).append('<div id="menu" class="abs"></div>');
            $(wrapper).append('<ul class="mainmenu"></ul>');
            $(wrapper).append('<div class="stats"></div>');
            $(wrapper).append('<div id="topplayers-wrapper" class="hide" aria-hidden="true"></div>');
            
            me.ul = '#content ul.mainmenu';
            me.stats = '#content div.stats';
            me.toplayers = '#topplayers-wrapper';
            me.nextrules = '#rules';
            
            me.canvas = Raphael("menu", 755, 562);
            $('#menu').append('<div id="modernLobbyHand" aria-hidden="true"></div>');
            
            me.bar = me.canvas.rect(31, 125, 695, 0).attr({ 'fill': 'black', 'opacity': 0, 'stroke-width': '0' });
            
            if (gh.defined(callback, 'function')) {
                callback();
            }
            
            me.gamesplayed = gh.data.wins + gh.data.losses + gh.data.draws;
        });
    },
    show: function(callback) {
        var me = this;
        me.visible = true;
        $('#menu').show();
        me.bar.stop().attr({x:31, y:125});
        me.bar.animate({ translation: [0, -25], height: 50, opacity: 1}, 1000, '<', function() {
            callback();
        });
        
        me.updatestats();
        me.updaterules();
        
        me.handshow(gh.data.hand);
        me.domshow(me.stats);
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
            me.visible = false;
            me.setModernHandReady(false);
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
        if (me.showLeaderboard) {
            $(me.toplayers).removeClass('hide').attr('aria-hidden', 'false');
            me.domshow(me.toplayers);
        } else {
            $(me.toplayers).addClass('hide').attr('aria-hidden', 'true').hide();
        }
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
        var cards = [];

        $.each(hand || [], function(index) {
            if (index >= me.pos.length) {
                return false;
            }
            var x = (Math.random() * 1000) - 1000;
            var y = (Math.random() * 1000) - 500;
            var cardInfo = me.describeHandCard(this, index);
            var card = me.canvas.image(cardInfo.textureUrl, x, y, me.cW, me.cH).attr({'opacity' : 0, scale: 2});
            var existingClass = card.node.getAttribute('class') || '';
            card.node.setAttribute('class', (existingClass + ' legacy-menu-hand-card').replace(/^\s+|\s+$/g, ''));
            card.node.setAttribute('data-menu-hand-index', index);
            card.node.setAttribute('aria-hidden', 'false');
            // Center the hand between the fixed control bar and career ribbon.
            var angle = (Math.random() * 5) - 2.5;
            card.animate({ rotation: 720 - angle, translation: [ me.pos[index] - x, 203 - y], opacity: 1, scale: 1}, 1000, '>');
            me.hand.push(card);
            cards.push(cardInfo);
        });

        me.currentHandCards = cards;
        me.setModernHandReady(false);
        if (me.graphics) {
            me.graphics.showLobbyHand(cards);
        }
    },
    handhide: function() {
        var me = this;
        if (me.graphics) {
            me.graphics.hideLobbyHand();
        }
        $.each(me.hand, function() {
            var x = (Math.random() * 1000) + 755;
            var y = (Math.random() * 1000) - 200;
            this.animate({rotation: 0, translation: [ x, y], opacity: 0, scale: 2}, 1000, '<', function() {
                this.remove();
            });
        });
        me.hand = [];
        me.currentHandCards = [];
    },
    describeHandCard: function(card, index) {
        return {
            index: index,
            userCardId: card.usercardid,
            cardId: card.cardid,
            textureUrl: '/images/cards/' + ((card.purchased == 1) ? 'p' : '') + gh.data.color + '/' + card.image + '.png',
            x: this.pos[index],
            y: 203,
            width: this.cW,
            height: this.cH
        };
    },
    setGraphicsCoordinator: function(graphics) {
        this.graphics = graphics;
        if (this.visible) {
            graphics.showLobbyHand(this.currentHandCards);
        }
    },
    setGraphicsMode: function(mode) {
        this.graphicsMode = mode === 'modern' ? 'modern' : 'legacy';
        if (this.graphicsMode !== 'modern') {
            this.setModernHandReady(false);
        }
        $('#menu').attr('data-graphics-mode', this.graphicsMode);
    },
    setModernHandReady: function(ready) {
        var useModernHand = ready === true && this.graphicsMode === 'modern' && this.visible;
        this.modernHandReady = useModernHand;
        $('#menu').toggleClass('graphics-modern-hand', useModernHand);
        $('#modernLobbyHand').attr('aria-hidden', useModernHand ? 'false' : 'true');
        $.each(this.hand, function() {
            if (this.node) {
                this.node.setAttribute('aria-hidden', useModernHand ? 'true' : 'false');
            }
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
    updatestats: function() {
        var me = this;
        var career = gh.data.careerStats || {};
        var gamesPlayed = Number(career.games_played);
        var recordedGames = Number(career.recorded_games);
        var totalCards = Number(career.total_cards);
        var cardsOwned = Number(career.cards_owned);
        var uniqueCards = Number(career.unique_cards);
        var purchasedCards = Number(career.purchased_cards);
        var duplicateCards = Number(career.duplicate_cards);
        var pointsAverage = Number(career.points_average);
        var bestScore = Number(career.best_score);
        var winRate = Number(career.win_rate);
        var currentWinStreak = Number(career.current_win_streak);
        var draws = Number(career.draws);
        var recentForm = $.isArray(career.recent_form) ? career.recent_form : [];
        var resultNames = {W: 'Win', L: 'Loss', D: 'Draw'};
        var makeMetricRow = function(label, value) {
            return $('<div class="career-stat-row"></div>')
                .append($('<dt></dt>').text(label))
                .append($('<dd></dd>').text(value));
        };
        var makeCollectionMetric = function(label, value, description, iconClass) {
            var percent = (totalCards > 0) ? Math.max(0, Math.min(100, (value / totalCards) * 100)) : 0;
            var $metric = $('<div class="career-collection-metric"></div>');
            $metric.append(
                $('<div class="career-collection-label"></div>')
                    .append($('<span></span>').text(label))
                    .append($('<span aria-hidden="true"></span>').addClass('career-collection-icon ' + iconClass))
            );
            $metric.append(
                $('<div class="career-collection-value"></div>')
                    .append($('<strong></strong>').text(value))
                    .append($('<span></span>').text(' / ' + totalCards))
            );
            $metric.append(
                $('<div class="career-collection-progress" role="progressbar"></div>')
                    .attr({
                        'aria-label': label,
                        'aria-valuemin': 0,
                        'aria-valuemax': totalCards,
                        'aria-valuenow': value
                    })
                    .append($('<span></span>').css('width', percent + '%'))
            );
            $metric.append($('<div class="career-collection-description"></div>').text(description));
            return $metric;
        };

        gamesPlayed = isNaN(gamesPlayed) ? gh.data.wins + gh.data.losses + gh.data.draws : gamesPlayed;
        recordedGames = isNaN(recordedGames) ? 0 : recordedGames;
        totalCards = isNaN(totalCards) ? 0 : totalCards;
        cardsOwned = isNaN(cardsOwned) ? 0 : cardsOwned;
        uniqueCards = isNaN(uniqueCards) ? 0 : uniqueCards;
        purchasedCards = isNaN(purchasedCards) ? 0 : purchasedCards;
        duplicateCards = isNaN(duplicateCards) ? Math.max(0, cardsOwned - uniqueCards) : duplicateCards;
        pointsAverage = isNaN(pointsAverage) ? 0 : pointsAverage;
        bestScore = isNaN(bestScore) ? 0 : bestScore;
        winRate = isNaN(winRate) ? 0 : winRate;
        currentWinStreak = isNaN(currentWinStreak) ? 0 : currentWinStreak;
        draws = isNaN(draws) ? Number(gh.data.draws || 0) : draws;

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
        var $ribbon = $('<span class="record-ribbon" tabindex="0"></span>')
            .attr({
                'aria-describedby': 'career-stats-popover',
                'aria-label': 'Career record details'
            })
            .append(ribbonArt);
        $ribbon.append(
            $('<span class="record-ribbon-content"></span>')
                .append('<span class="record-caption">CAREER RECORD</span>')
                .append(
                    $('<span class="record-main"></span>').text(
                        gh.data.name.toUpperCase() + '  \u00b7  ' + gh.data.wins + '\u2013' + gh.data.losses
                    )
                )
        );

        var $panel = $('<div id="career-stats-popover" class="career-stats-tip" role="tooltip"></div>');
        $panel.append('<div class="career-panel-title"><span class="career-title-icon cards" aria-hidden="true"></span>CARD COLLECTION</div>');

        var $collection = $('<div class="career-collection-grid"></div>');
        $collection.append(makeCollectionMetric(
            'Purchased Cards',
            purchasedCards,
            'Distinct designs acquired from the shop',
            'purchased'
        ));
        $collection.append(makeCollectionMetric(
            'Unique Cards',
            uniqueCards,
            totalCards > 0 ? Math.round((uniqueCards / totalCards) * 100) + '% of the complete catalog' : 'No catalog cards available',
            'unique'
        ));
        $panel.append($collection);

        var $ownership = $('<div class="career-ownership-summary"></div>');
        $ownership.append('<span class="career-copy-icon" aria-hidden="true"></span>');
        $ownership.append($('<span></span>').append($('<strong></strong>').text(cardsOwned)).append(' cards owned'));
        $ownership.append('<span class="career-summary-divider" aria-hidden="true">\u00b7</span>');
        $ownership.append($('<span></span>').append($('<strong></strong>').text(duplicateCards)).append(' duplicates'));
        $panel.append($ownership);

        $panel.append('<div class="career-panel-title performance"><span class="career-title-icon trophy" aria-hidden="true"></span>CAREER PERFORMANCE</div>');
        var $performance = $('<div class="career-performance-grid"></div>');
        var $leftMetrics = $('<dl></dl>');
        var $rightMetrics = $('<dl></dl>');
        $leftMetrics.append(makeMetricRow('Games Played', gamesPlayed));
        $leftMetrics.append(makeMetricRow('Win Rate', gamesPlayed > 0 ? winRate.toFixed(1).replace(/\.0$/, '') + '%' : '\u2014'));
        $leftMetrics.append(makeMetricRow('Draws', draws));
        $rightMetrics.append(makeMetricRow('Points Avg.', recordedGames > 0 ? pointsAverage.toFixed(2) : '\u2014'));
        $rightMetrics.append(makeMetricRow('Best Score', recordedGames > 0 ? bestScore : '\u2014'));
        $rightMetrics.append(makeMetricRow('Current Win Streak', currentWinStreak));
        $performance.append($leftMetrics).append($rightMetrics);
        $panel.append($performance);

        var $form = $('<div class="career-recent-form"></div>');
        $form.append('<span class="career-form-label">Recent Form</span>');
        var $formResults = $('<span class="career-form-results"></span>');
        if (recentForm.length) {
            $.each(recentForm, function() {
                var result = String(this).toUpperCase();
                if (!resultNames[result]) {
                    return;
                }
                $formResults.append(
                    $('<span></span>')
                        .addClass('career-form-result result-' + result.toLowerCase())
                        .attr('aria-label', resultNames[result])
                        .text(result)
                );
            });
        } else {
            $formResults.append('<span class="career-form-empty">No games yet</span>');
        }
        $form.append($formResults);
        $form.append('<span class="career-form-period">Last 5</span>');
        $panel.append($form);

        $('#career-stats-popover').remove();
        $('body').append($panel);
        me.gamesplayed = gamesPlayed;
        $(me.stats).empty().append($ribbon);

        $ribbon.tooltip({
            effect: 'slide',
            position: 'top center',
            offset: [-14, 0],
            tip: '#career-stats-popover',
            tipClass: 'career-stats-tip'
        });
        var careerTooltip = $ribbon.data('tooltip');
        $ribbon.bind('focus', function() {
            careerTooltip.show();
        }).bind('blur', function() {
            careerTooltip.hide();
        });
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
