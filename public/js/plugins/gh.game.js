gh.game = function(wrapper, ruleswrapper) {
    this.initialize(wrapper, ruleswrapper);
};
gh.game.prototype = {
    initialize: function(wrapper, ruleswrapper) {
        var me = this;
        $(wrapper).append('<div id="game-wrapper" class="abs hide"><div id="board"><div id="svgBoard"></div><div id="svgRules"></div><div class="overlay"></div></div></div>');
        this.ruleswrapper  = ruleswrapper;
    },
    build: function(gameData, gameovercallback, earlyexit, options) {
        var me = this;
        
        //required: 
        //gameData: a server response with all necessary data for this object
        //callback: the function to call on game over
        
        
        this.gameData = gameData;       //in case we need the seed data later
        
        $('#svgBoard').empty();
        $('#svgRules').empty(); //this was added later as a canvas to show to the rule name above the game board ("same" et al)
        
        this.gameoverCallback = gameovercallback; //the function to call when the game is complete
        this.earlyexit = earlyexit; //the function to call to return to the main menu while playing the game
        
        //build shortcut for return to main menu
        $('#title').click(function() {
            if ($(this).hasClass('enabled')) {
                $(this).removeClass('enabled');
                me.earlyexit();
            }
        }).addClass('enabled');
        
        this.gameid =   gameData.oiuwqnlaskjodwksjdlappw;
        this.canvas =   null;
        this.them   =   gameData.ppqoowoieoiqpoipieoicojqpojow; //holds information about computer's turn, false on player's turn
        
        this.isreplay = false;
        this.gameover = false; //set to true when there are no more plays
        
        this.cW = 117;       //static card width
        this.cH = 146;      //static card height
        this.eW = 30;       //static board element width
        this.eH = 30;       //static board element height
    
        //review 
        this.underReview = false; //is set to true when player is reviewing history
        this.reviewSpeed = 750; //the delay (in ms) between player turns when revewing
    
        //player information
        this.myColor = gh.data.color;
        this.opponentColor = 'red';
        
        this.isMyTurn = false;      //when true, cards are playable
        this.dragging = null;       //a flag which will contain the player object deck array item of the currently dragging card
        this.isDroppable = false;   //a card can only be droppable once picked up. This flag prevents immature dropping
        this.grapbpoint = null;
    
        this.rules = [];           //will store a rule object if rule if active for this game
    
        //places where there are cards:
        this.p1h = []; //player one hand. the object contains the properties: gamecardId, image, card (svg ref), x, y (current positions)
        this.p2h = []; //player two hand same properties as above
        this.pb = []; //play board
        this.p1 = gameData.bdjiauhjhduqijshckjhaii;
        this.p2 = '1';
    
        //places where there are other canvas objects
        this.scores = [];
        this.turnMarker = null;
        this.inSuddenDeath = gameData.ysjhkauhwjkahjhsjkhdkjh;
    
        //board positions:
        this.pbp = [];
        this.p1p = [];
        this.p2p = [];
        this.fp = [];
        
        this.buildCanvas();
        this.buildPositions();
        
        //seed client data from server
        this.buildClientData(gameData);
        
        //render client
        this.renderClient(gameData);
        
        //handle pregame dialogs
        this.dialogManager(gameData.uwlksjdflkjieknflknklsdkfnkfn, 0, function() {
            
            //handle optional parameters
            if (gh.defined(options)) {
                
                //replay
                if (gh.util.hasProperty(options, 'replay')) {
                    me.isreplay = true;
                    me.isMyTurn = true; //spoof
                    me.reviewGame();
                    return;
                }
                
                //jump to claim phase
                if (gh.util.hasProperty(options, 'claim')) {
                    me.onGameover(gameData);
                    return;
                }
            }
            
            //start game! check if them object has turn data, if not them you start
            me.activatePlayerTurn((me.them == false) ? true : false, []);
        });
    },
    buildCanvas: function() {
        var me = this;
        
        this.canvas = Raphael("svgBoard", 693, 500);
        this.rulecanvas = Raphael("svgRules", 693, 500);
        
        //these events are attached to the svg canvas. both relate to dragging player cards.
        //intentionally old-skool - didn't jive with jquery
        document.getElementById('svgBoard').onmousemove = function(event) { 
            if (me.dragging) {
                me.drag(me, event);
            }
        };
        document.getElementById('svgBoard').onclick = function(event) { 
            if (me.isDroppable) {
                me.drop(me.dragging, null, me, event);
            }
        };
        this.grapbpoint = {x: 0, y: 0};
    },
    buildPositions: function() {
        this.pbp = [
            { x: 229.5, y: 104 }, //center
            { x: 172, y: 35 }, //1
            { x: 289, y: 35 }, //2
            { x: 406, y: 35 }, //3
            { x: 172, y: 181 }, //4
            { x: 289, y: 181 }, //5
            { x: 406, y: 181 }, //6
            { x: 172, y: 327 }, //7
            { x: 289, y: 327 }, //8
            { x: 406, y: 327 } //9
        ];
        this.p1p = [
            { x: 0, y: 0 },
            { x: 28, y: 18 }, //1
            { x: 28, y: 73 }, //2
            { x: 28, y: 128 }, //3
            { x: 28, y: 183 }, //4
            { x: 28, y: 238 } //5
        ];
        this.p2p = [
            { x: 0, y: 0 },
            { x: 550, y: 18 }, //1
            { x: 550, y: 73 }, //2
            { x: 550, y: 128 }, //3
            { x: 550, y: 183 }, //4
            { x: 550, y: 238 } //5
        ];
        this.fp = [ //font positions (x, y: for the number, a:b for the "+" / "-"
        //{ x: 229.5, y: 104 }), //center
            { x: 223, y: 117, a: 203, b: 117 }, //1
            { x: 338, y: 117, a: 320, b: 117 }, //2
            { x: 457, y: 117, a: 438, b: 117 }, //3
            { x: 223, y: 263, a: 203, b: 263 }, //4
            { x: 338, y: 263, a: 320, b: 263 }, //5
            { x: 457, y: 263, a: 438, b: 263 }, //6
            { x: 223, y: 409, a: 203, b: 409 }, //7
            { x: 338, y: 409, a: 320, b: 409 }, //8
            { x: 457, y: 409, a: 438, b: 409 } //9
        ];
    },
    buildClientData: function(gameData) {
        var me = this;
        //colors
        this.myColor = gameData.mnsjkaiwbcbakjwifh;
        this.opponentColor = gameData.yqofhqoiwhfcoqhfcohq;
        
        //build rules
        this.buildRules(gameData.sdflkjweoirukjsdlvkjsdlouw);
        
        //this function builds client data from a server data response);
        this.buildPlayerOneHand(gameData.mnzbxcnbmncbzmxnbcmnbzxmnb);
        this.buildPlayerTwoHand(gameData.kjhsadjhkaskjhdkjhasjhdasd);
        this.buildPlayBoard(gameData.uyeiqowiutoiqyweiuyqwoiyro);

        //build scores
        this.scores.push({
            score: gameData.lkjasdoiuqwekjadsflkjmnbxcvkhj,
            oldScore: null,
            coming: null,
            going: null,
            x: 87,
            y: 445
        });
        this.scores.push({
            score: gameData.asdlkjqweoiuwervbirwaljdsbvlkjbl,
            oldScore: null,
            coming: null,
            going: null,
            x: 568,
            y: 445
        });
        
        //build turn marker
        this.buildTurnMarker();
    },
    renderClient: function(gameData) {
        //if elemental game, render elements on board and preload sfx
        if (this.rules[6]) {
            gh.audio.forceLoad(gh.audio.elementMatch);
            gh.audio.forceLoad(gh.audio.elementFail);
            this.drawBoardElements();
        }
        this.drawBoardDrops();
        this.drawPlayerOneHand();
        this.drawPlayerTwoHand();
        this.drawPlayerScores();
        this.imagePreLoad('/images/cards/cardBack.png');
    },
    buildRules: function(rules) {
        var me = this;
        me.ruleswrapper.empty();
        me.rules = [];
        var rulesById = {};
        var rulesorder = [0, 9, 10, 11, 12, 8, 2, 3, 4, 5, 6, 7];
        $.each(rules || [], function(index, item) {
            if (item && gh.defined(item.poiqwepoir)) {
                rulesById[parseInt(item.poiqwepoir, 10)] = item;
            }
        });
        $.each(rulesorder, function(index, ruleId){
            var item = rulesById[ruleId];
            if (item) {
                me.rules[ruleId] = {
                    'name': item.fjklasdjklasfj, 
                    'desc': item.cbnmzxcbnmz
                };
                //preload rule images
                if (ruleId === 2 || ruleId === 3 || ruleId === 4 || ruleId === 8) {
                    me.imagePreLoad('/images/rules/' + ruleId + '.png');
                }
                //update dom
                if ($(me.ruleswrapper).text().length !== 0) {
                    me.ruleswrapper.append(document.createTextNode(', '));
                }
                $('<span></span>').attr('title', item.cbnmzxcbnmz).text((item.fjklasdjklasfj).toUpperCase()).appendTo(me.ruleswrapper);
            }
        });
        if (me.ruleswrapper.text().length > 0) {
            me.ruleswrapper.prepend('RULES: ');
        }
        $('.rulestip').remove();
        $("#rules span[title]").tooltip({
            effect: 'slide',
            position: 'bottom center',
            offset: [0, 30],
            tipClass: 'rulestip'
        });
        me.ruleswrapper.fadeIn();
    },
    buildPlayerOneHand: function(data) {
        var me = this;
        $.each(data, function(index, item) {
            me.p1h.push({ 
                gameCardId: item.jjkaooijslakjdiwjkalsjkkk, 
                image: item.lkjasdojwlkajsdkjdpakjkjs, 
                card: null,
                owner: item.ffjklaksjidlkmjaiwnnmnalk,          //in the case of sudden death, the opponents cards can be in this hand
                usercardid: item.yoiasdknqowkjndlansihjwsd,
                purchased: item.yyqweiuydhiiwoqijkwlkkjww,
                x: 0, 
                y: 0 
            });
            //pre load inverse of players cards (red) since all are shown (opponents are preloaded on reveal)
            var preloadPath = ('/images/cards/' + item.lkjasdojwlkajsdkjdpakjkjs + '.png').replace(gh.data.color, 'red');
            me.imagePreLoad(preloadPath);
        });
    },
    buildPlayerTwoHand: function(data) {
        var me = this;
        $.each(data, function(index, item) {
            me.p2h.push({ 
                gameCardId: item.jjkaooijslakjdiwjkalsjkkk,
                image: item.lkjasdojwlkajsdkjdpakjkjs,
                usercardid: item.yoiasdknqowkjndlansihjwsd,
                card: null,
                owner: item.ffjklaksjidlkmjaiwnnmnalk, //sometimes the user's id (on sudden death)
                purchased: 0,
                x: 0,
                y: 0 
            });
            if (!gh.defined(me.rules[0])) { //if the closed rule is not defined, this an an open game and we can preload the inverse (blue)
                var preloadPath = ('/images/cards/' + item.lkjasdojwlkajsdkjdpakjkjs + '.png').replace('red', gh.data.color);
                me.imagePreLoad(preloadPath);
            }
        });
    },
    buildPlayBoard: function(data) {
        var me = this;
        //data.pb will ALWAYS contain the nine index for play board.
        $.each(data, function(index, item) {
            //if there is a game card id for this position
            if (item.jjkaooijslakjdiwjkalsjkkk) {
                /*
                Play Board object contains these properties:
                
                gameCardId: int, the game card id of the card placed here. -1 if no card
                image: string, the url to the card's image, null if no card
                captured: string, the userid for who has captured the card. by default, has the owner's id
                card: object, the raphael object js ref to the card object, null if no card
                rect: object, the raphael object js ref to the onmouseover rect droppable, null if not a playable area
                elementId: int, if an elemental game, the elementId of the elemtn placed on the board in this position, -1 if no element
                element: object, the raphael object js ref to the element image object, null if no element
                bonus: int, the bonus modifier on the card in this position if element on this board position 
                bonusObject: the object that gets rendered on the play board
                
                */
                me.pb.push({
                    gameCardId: item.jjkaooijslakjdiwjkalsjkkk,
                    image: item.lkjasdojwlkajsdkjdpakjkjs,
                    captured: item.llkjasdoiuqwoiquweiiwiuie,
                    owner: item.ffjklaksjidlkmjaiwnnmnalk,
                    purchased: item.yyqweiuydhiiwoqijkwlkkjww,
                    usercardid: item.yoiasdknqowkjndlansihjwsd,
                    card: null,
                    rect: null,
                    elementId: item.elkasdaoiooiaoiiasokdplkl,
                    element: null,
                    bonus: item.huuskajhskduuuhasduhuusss,
                    bonusObject: null,
                    x: 0,
                    y: 0
                });
            }
            //no game card, playable area for this index
            else {
                me.pb.push({
                    gameCardId: 0,
                    image: null,
                    captured: null,
                    owner: null,
                    usercardid: null,
                    card: null,
                    rect: null,
                    elementId: item.elkasdaoiooiaoiiasokdplkl,
                    element: null,
                    bonus: 0,
                    bonusObject: null,
                    x: 0,
                    y: 0
                });
            }
        });
    },
    drawBoardElements: function() {
        var me = this;
        $.each(me.pb, function(position, item) {
            //if an element was defined for this index draw it… even if a card has been placed
            if (item.elementId > -1) {
                me.pb[position].element = me.canvas.image('/images/cardElements/g' + item.elementId + '.png', (me.pbp[position + 1].x) + (me.cW / 2) - (me.eW / 2), (me.pbp[position + 1].y) + (me.cH / 2) - (me.eH / 2), me.eW, me.eH);
                me.animateBoardElement(me.pb[position].element, parseInt(item.elementId, 10));
            }
        });
    },
    animateBoardElement: function(item, elementId) {
        var me = this;
        switch (elementId) {
            case 7: //light
            case 2: //ice
            case 3: //wind
                //spin:
                item.animate({ rotation: 3600 }, 60000, function() {
                    item.animate({ rotation: 0 }, 60000, function() {
                        me.animateBoardElement(item, elementId);
                    });
                });
                break;
            case 6: //water
            case 4: //poison
            case 0: //lightening
                //grow and shrink
                item.animate({ scale: 1.2 }, 500, function() {
                    item.animate({ scale: 1 }, 500, function() {
                        me.animateBoardElement(item, elementId);
                    });
                });
                break;
            case 1: //earth
            case 5: //fire
                //shake
                item.animate({ translation: [0, -3] }, 300, function() {
                    item.animate({ translation: [0, 3] }, 300, function() {
                        me.animateBoardElement(item, elementId);
                    });
                });
                break;
        }
    },
    drawBoardDrops: function() {
        var me = this;
        $.each(me.pb, function(index, item) {
            //if a game card was defined for this index, draw italics
            if (item.gameCardId > 0) {
                item.card = me.canvas.image('/images/cards/' + item.image + '.png', me.pbp[index + 1].x, me.pbp[index + 1].y, me.cW, me.cH).toBack();
                
                //if an elemental bonus has been added to this card, show it
                if (me.pb[index].bonus != 0) {
                    me.drawBonusModifier(index);
                }
            
            } else {
                //otherwise build a rectangular, droppable, playing area
                item.rect = me.canvas.rect(me.pbp[index + 1].x, me.pbp[index + 1].y, me.cW, me.cH, 10).attr({ 'fill': 'black', 'opacity': '0', 'stroke-width': '0' });
                $(item.rect.node).mouseover(function(event) {
                    if (me.dragging) {
                        item.rect.attr({ 'opacity': '0.3' });
                    }
                });
                $(item.rect.node).mouseout(function(event) {
                    if (me.dragging) {
                        item.rect.attr({ 'opacity': '0' });
                    }
                });
                $(item.rect.node).click(function(event) {
                    if (me.dragging) {
                        me.drop(me.dragging, item, me, event, index);
                    }
                });
            }
            item.x = me.pbp[index + 1].x;
            item.y = me.pbp[index + 1].y;
        });
    },
    drawBonusModifier: function(index) {
        var me = this;
        var bonus = Math.abs(parseInt(me.pb[index].bonus, 10));
        me.pb[index].bonusObject = [
            me.canvas.print(me.fp[index].a, me.fp[index].b, (parseInt(me.pb[index].bonus, 10) > 0) ? "+" : "-", me.canvas.getFont("edison"), 80).attr({ 'fill': '#ffffff', 'stroke': '#300d08', 'stroke-width': '1' }).toFront(),
            me.canvas.print(me.fp[index].x, me.fp[index].y, bonus, me.canvas.getFont("plugnickel"), 40).attr({ 'fill': '#ffffff', 'stroke': '#300d08', 'stroke-width': '1' }).toFront()
        ];
    },
    drawPlayerOneHand: function(option) {
        //this function is called to render the player one hand (cards not in play)
        var me = this;
        //loop through the player one deck object array
        $.each(this.p1h, function(index, item) {
            //some options on how we want to draw the hand
            switch(option) {
                case 'order':
                    item.card.toFront(); //toFront assures that cards dropped in a non-playable area return in the proper order
                    break;
                default:
                    //if a card has already been defined for this index, we're calling this function after an array change (card was played)
                    if (item.card !== null) {
                        //reanimate the remaning cards
                        item.card.animate({ x: me.p1p[index + 1].x, y: me.p1p[index + 1].y }, 300 + (index * 100), ">");
                    } else {
                        //initial call to this function creates and renders the card
                        item.card = me.canvas.image('/images/cards/' + item.image + '.png', me.p1p[index + 1].x, me.p1p[index + 1].y, me.cW, me.cH);
                        $(item.card.node).css('cursor', ' url(/images/open.cur), move');
                        me.playerOneCardClick(item);
                    }
                    break;
            }
            //save origin position of this card to the deck object array
            item.x = me.p1p[index + 1].x;
            item.y = me.p1p[index + 1].y;
        });
    },
    playerOneCardClick: function(item) {
        var me = this;
        $(item.card.node).unbind('click'); //remove any events already attached
        if (!me.isreplay) {
            $(item.card.node).bind('click', function(event) {
                gh.audio.draw.play();
                me.grab(item, me, event);
            });
        }
    },
    drawPlayerTwoHand: function(option) {
        var me = this;
        //loop through the player two deck object array
        $.each(this.p2h, function(index, item) {
            switch(option) {
                case 'order':
                    item.card.toFront(); //toFront assures that cards dropped in a non-playable area return in the proper order
                    break;
                default:
                    if (item.card !== null) {
                        item.card.animate({ x: me.p2p[index + 1].x, y: me.p1p[index + 1].y }, 300 + (index * 100), ">").toFront(); //toFront assures that cards dropped in a non-playable area return in the proper order
                    } else {
                        item.card = me.canvas.image('/images/cards/' + item.image + '.png', me.p2p[index + 1].x, me.p2p[index + 1].y, me.cW, me.cH);
                    }
                    break;
            }
            item.x = me.p2p[index + 1].x;
            item.y = me.p2p[index + 1].y;
        });
    },
    drawPlayerScores: function() {
        var me = this;
        $.each(me.scores, function(index, item) {
            //if no score, draw it
            if (item.coming === null) {
                item.coming = me.canvas.print(item.x, item.y, item.score, me.canvas.getFont("orotund"), 80);
                //if recent score change, animate it
                if (item.oldScore !== null) {
                    //var r = (item.oldScore > item.score) ? 90 : -90;
                    item.coming.attr({ fill: '#300d08', opacity: 0, scale: 0.3 });
                    item.coming.animate({ opacity: 1, scale: 0.275, rotation: 0 }, 300, ">");
                } else {
                    item.coming.attr({ fill: '#300d08', opacity: 1, scale: 0.275 });
                }
            }
        });
    },
    buildTurnMarker: function() {
        var me = this;
        var src = ['/images/dime-heads.png', '/images/dime-tails.png'];
        me.turnMarker = me.canvas.image(src[(me.isMyTurn) ? 0 : 1], 327, 420, 41, 41).toFront();
    },
    drawTurnMarker: function(myTurn, callback) {
        //renders the turn marker. mtTurn is true when the user's turn is active. callback is function to fire when animation is complete
        var me = this;
        //images to use
        var xpos = (myTurn) ? 33 : 621;
        //begin animation to other side
        //me.turnMarker.attr('rotation', 0); //I commented this out because I dont see why its necessary
        me.turnMarker.animate({ x: xpos, y: 420, width: 41 }, 400, "<>", function() {
            if (gh.defined(callback, 'function')) {
                callback();
            }
            //residule rotation, rotates negatively on user's side
            var rot = (Math.floor(Math.random() * 180) * ((myTurn) ? -1 : 1));
            me.turnMarker.animate({ rotation: rot }, 2000, ">");
        }).toFront();
    },
    drawRule: function (rule, holdLength, callback) {
        var me = this;
        var hold = (gh.defined(holdLength) ? holdLength : 200);
        $('#svgRules').show();
        var msg = me.rulecanvas.image('/images/rules/' + rule + '.png', me.pbp[0].x + me.cW - (600 / 2), me.pbp[0].y + me.cH - (146 / 2), 600, 146).attr({ scale: 3, opacity: 0, rotation: 0 });
        gh.audio.rule.play();
        msg.animate({ opacity: 1, scale: 1, rotation: 0 }, 300, ">", function() {
            setTimeout(function() { //hold for read
                msg.animate({ opacity: 0, scale: 0.3, rotation: -360 }, 500, ">", function() {
                    msg.remove();       //raphael remove also removes from dom
                    if (gh.defined(callback, 'function')) {
                        callback();
                    }
                });
            }, hold);
        });
    },
    activatePlayerTurn: function(bool, gameoverdetails) {
        
        //this function is called when the other player's turn is complete. 
        //the gameoverdetails object is passed in from the server when the game over condition is met, it is an empty array otherwise
        //it contains details about claims/takes but should not be used to determine game over on the client side
        //we still rely on the client's "endCondition" function to determine end of game since it handles rules like sudden death
        
        var me = this;
        me.endCondition(function(gameover) {
            if (!gameover) {
                me.isMyTurn = bool;
                me.drawTurnMarker(me.isMyTurn, function() {
                    //it is now player's turn:
                    if (bool) {
                        
                        $('#svgRules').hide(); //because rules are drawn quickly (combo's) only hide the rule canvas when necessary, like here
                        
                        me.enableBoard(true);
                        
                    }
                    //the player's turn as ended:
                    else {
                        me.enableBoard(false); //disable immediately
                        //initiate opponet's turn. small delay to avoid appearance of opponent "rushing" moveBy
                        setTimeout(function() { me.getOpponentMove(); }, 1500);
                    }
                });
            } else {
                me.onGameover(gameoverdetails);
            }
        });
    },
    updateScores: function(scores) {
        var me = this;
        $.each(scores, function(index, newScore) {
            if (newScore != me.scores[index].score) {
                me.scores[index].oldScore = me.scores[index].score;
                me.scores[index].score = newScore;
                me.scores[index].going = me.scores[index].coming;
                me.scores[index].coming = null;

                //var r = (me.scores[index].oldScore > newScore) ? 90 : -90;
                me.scores[index].going.animate({ opacity: 0, scale: 0.2 }, 300, ">", function() {
                    me.scores[index].going.remove();
                    me.scores[index].going = null;
                });
            }
        });
        me.drawPlayerScores();
    },
    getOpponentMove: function() {
        var me = this;
        
        //we no longer "get" opponent move since there's no reason for the app to be so chatty.
        //instead, we already got the computer's move and stored it on the response from the user's turn.
        //if the game started with a computer's move, we stored that up from too..
        
        var response = me.them;
        
        //pre load reveal
        if (response.z) {
            me.imagePreLoad('/images/cards/' + response.z + '.png');
        }
        
        //postplay function
        response.postplay = function(callback) {
            me.dialogManager(response.dialog, 1, callback);
        };
        
        //handle pre-play dialogs
        me.dialogManager(response.dialog, 0, function() {
            me.opponentTeasePlay(Math.floor(Math.random() * me.p2h.length), 0, response);
        });
    },
    opponentTeasePlay: function(count, ctr, x) {
        var me = this;
        //base case - play
        if (count == ctr) {
            setTimeout(function() {
                me.opponentPlay(x, function() {
                    //postplay function
                    x.postplay(function() {
                        //activate player's turn
                        me.activatePlayerTurn(true, x.gameover);
                    });
                });
            }, 500);
        } else {
            var index = Math.floor(Math.random() * me.p2h.length);
            var rotationoffset = Math.random() * 5;
            me.p2h[index].card.animate({ x: me.p2h[index].x - 20, rotation: rotationoffset }, 300, ">", function() {
                setTimeout(function() {
                    me.p2h[index].card.animate({ x: me.p2h[index].x, rotation: 0 }, 300, ">", function() {
                        setTimeout(function() {
                            me.drawPlayerTwoHand('order'); //reposition cards
                            me.opponentTeasePlay(count, ctr + 1, x);
                        }, 500);
                    });
                }, (Math.floor(Math.random() * 10) * 50) + 1500);
            });
        }
    },
    opponentPlay: function(x, callback) {
        var me = this;
        var item;
        var playIndex = parseInt(x.y, 10);
        //retrieve client card
        $.each(me.p2h, function(index, that) { 
            if (that.gameCardId == x.x) {
                item = that; 
            }
        });
        
        //draw card from opponet's deck
        gh.audio.draw.play();
        item.card.toFront();
        item.card.animate({ x: me.pbp[0].x, y: me.pbp[0].y, scale: 2 }, 300, ">", function() {
            
            var y = function(x, item, playIndex) {
                setTimeout(function() { //hold
                    //adding +1 to index for board positions since we use 0 there
                    item.card.animate({ scale: 1, x: me.pbp[playIndex + 1].x, y: me.pbp[playIndex + 1].y, rotation: 720 }, 300, "<>", function() {
                        setTimeout(function(){
                            item.card.attr({ rotation: 0 }).toFront();
                            
                            //move card to playBoard
                            me.pb[playIndex].card = item.card;
                            me.pb[playIndex].gameCardId = item.gameCardId;
                            me.pb[playIndex].captured = me.p2;
                            me.pb[playIndex].owner = item.owner;
                            me.pb[playIndex].image = item.image;
                            
                            //show modifier if elemental game and position has element
                            if (me.rules[6]) {
                                var bonus = parseInt(x.eb, 10);
                                if (bonus != 0) {
                                    me.pb[playIndex].bonus = parseInt(x.eb, 10);
                                    me.pb[playIndex].element.toFront();
                                    me.drawBonusModifier(playIndex);
                                    if (bonus > 0) {
                                        gh.audio.elementMatch.play();
                                    } else {
                                        gh.audio.elementFail.play();
                                    }
                                }
                            }
                            
                            //erase from player deck
                            me.p2h.splice($.inArray(item, me.p2h), 1);
                            
                            //redraw player two hand
                            me.drawPlayerTwoHand();
                            
                            //flip any captured surrounding cards
                            me.parseCapturePlacements(x.captures, 0, me.p2, function() {
                                
                                //update scores when finished
                                me.updateScores([x.p1s, x.p2s]);
                                
                                //by removing the rect on the playing area we remove the ability to make another play in this area
                                //it may not be there if it was used with a flash
                                if (me.pb[playIndex].rect) {
                                    me.pb[playIndex].rect.remove();
                                    me.pb[playIndex].rect = null;
                                }
                                
                                //fire callback
                                callback();
                            });
                        }, 20);
                    });
                }, 600);
            };
            //if a closed game and the image is showing its back
            if (me.rules[0] != null && item.card.attr('src') == '/images/cards/cardBack.png') {
                var z = item.card.getBBox().y;
                item.card.animate({ height: 0, y: z + ((me.cH * 2) / 2) }, 300 / 2, ">", function() {
                    //reveal card
                    item.card.attr({ 'src': '/images/cards/' + x.z + '.png'});
                    item.image = x.z;
                    item.card.animate({ height: me.cH * 2, y: z }, 300 / 2, ">", function() {
                        y(x, item, playIndex);
                    });
                });
            } else {
                //if an open game, continue
                y(x, item, playIndex);
            }

        });
    },
    parseCapturePlacements: function(placements, index, userid, callback)
    {
        var me = this;
        //parse over capture placements. is only > 1 with combos since a player can only place one card per turn
        if (index == placements.length) {
            //base case, we've handled all placements
            callback();
        } else {
            //handle rules
            me.parseCaptureRules(placements[index], 0, userid, function() {
                //when done with this placement's rules, try next placement
                me.parseCapturePlacements(placements, index + 1, userid, callback);
            });
        }
    },
    parseCaptureRules: function(rules, index, userid, callback) {
        var me = this;
        //parse over each rule in effect for this placement
        if (index == rules.length) {
            //base case, we've covered all rules for this placement
            callback();
        } else {
            //handle flips
            me.parseCaptureFlips(rules[index], userid, function() {
                //when done, try next rule
                me.parseCaptureRules(rules, index + 1, userid, callback);
            });
        }
    },
    parseCaptureFlips: function(capture, userid, callback) {
        var me = this;
        //logic begins here where we consider if a flip was performed
        if (capture.flips.length > 0) {
            //first bring all flips to surface (in order to avoid interferance with message
            //also assign capture value here
            $.each(capture.flips, function(index, item) {
                me.pb[item.p].card.toFront();
                me.pb[item.p].captured = userid;
            });
            // if a rule with a message (2: same, 3: plus, 4: combo, 5: same wall)
            if (parseInt(capture.rule, 10) > 1 && parseInt(capture.rule, 10) < 6) {
                
                if (capture.flash.length > 0) {
                    $.each(capture.flash, function(index, flashIndex) {
                        me.pb[flashIndex].rect = me.canvas.rect(me.pb[flashIndex].x, me.pb[flashIndex].y, me.cW, me.cH, 10).attr({ 'fill': 'white', 'opacity': '0', 'stroke-width': '0' });
                        me.pb[flashIndex].rect.animate({ opacity: 0.7 }, 200, "<", function() {
                            me.pb[flashIndex].rect.animate({ opacity: 0 }, 200, ">", function() {
                                
                                me.pb[flashIndex].rect.remove();
                                me.pb[flashIndex].rect = null;
                                
                                //on last flash, handle flips
                                if (index == capture.flash.length - 1) {
                                    me.drawCapture(capture.flips, callback);
                                }
                                
                            });
                        });
                    });
                } else {
                    //if there are no flashes, go straight to flipping (as with combos)
                    me.drawCapture(capture.flips, callback);
                }
                
                //animate rule
                me.drawRule(capture.rule);
                
            } else {
                //if there are no flashes (probably the basic rule)
                me.drawCapture(capture.flips, callback);
            }
        } else {
            //there were no flips to perform
            callback();
        }
    },
    drawCapture: function(flips, callback) {
        var me = this;
        
        //play capture sound
        gh.audio.capture.play();
        
        $.each(flips, function(index, item) {
                
            //p: game board position
            //t: transition type
            //i: image path
            
            var speed = 250;
            var it = me.pb[item.p];
            var optionsA;
            var optionsB;
            it.card.toFront();
            it.card.animate({ scale: 1.15 }, 150, ">", function() {
                var y = it.card.getBBox().y;
                var x = it.card.getBBox().x;
                if (item.t == 1) {
                    //flip card top to bottom
                    optionsA = {
                        height: 0,
                        y: it.y + ((me.cH * 1.15) / 2)
                    };
                    optionsB = {
                        height: me.cH * 1.15,
                        y: y
                    };
                } else {
                    //flipp card left ro right
                    optionsA = {
                        width: 0,
                        x: it.x + ((me.cW * 1.15) / 2)
                    };
                    optionsB = {
                        width: me.cW * 1.15,
                        x: x
                    };
                }
                it.card.animate(optionsA, speed / 4, function() {
                    setTimeout(function() {
                        it.card.attr({ 'src': '/images/cards/cardBack.png' });
                        it.card.animate(optionsB, speed / 4, function() {
                            setTimeout(function() {
                                it.card.animate(optionsA, speed / 4, function() {
                                    //change card color during flipping
                                    it.card.attr({ 'src': '/images/cards/' + item.i + '.png' });
                                    it.card.animate(optionsB, speed / 4, function() {
                                        setTimeout(function() {
                                            it.card.animate({ scale: 1 }, "<", speed, function() {
                                                
                                                //if there was a bonus modifier on this position, redraw it
                                                if (me.rules[6]) {
                                                    var bonus = parseInt(it.bonus, 10);
                                                    if (bonus != 0 && gh.defined(it.bonusObject)) {
                                                        it.element.toFront();
                                                        it.bonusObject[0].toFront();
                                                        it.bonusObject[1].toFront();
                                                    }
                                                }
                                                //tricky business! The last card flip will call the callback
                                                if (index + 1 == flips.length) {
                                                    callback();
                                                }
                                            });
                                        }, 20);
                                    });
                                });
                            }, 20);
                        });
                    }, 20);
                });
            });
        });
    },
    enableBoard: function(enableBoard) {
        var me = this;
        if (enableBoard) {
            $.each(me.pb, function(index, item) {
                //turn on droppable actions
                if (item.rect) {
                    item.rect.node.setAttributeNS(null, 'pointer-events', 'all');
                }
            });
        } else {
            $.each(me.pb, function(index, item) {
                //turn off droppable actions
                if (item.rect) {
                    item.rect.node.setAttributeNS(null, 'pointer-events', 'none');
                }
            });
        }
    },
    getPointerPosition: function(event) {
        var position = {x: event.clientX, y: event.clientY};
        var svg = this.canvas && this.canvas.canvas;

        if (!svg || !svg.createSVGPoint || !svg.getScreenCTM) {
            return position;
        }

        var screenMatrix = svg.getScreenCTM();
        if (!screenMatrix || !screenMatrix.inverse) {
            return position;
        }

        try {
            var point = svg.createSVGPoint();
            point.x = event.clientX;
            point.y = event.clientY;
            point = point.matrixTransform(screenMatrix.inverse());
            return {x: point.x, y: point.y};
        } catch (error) {
            // Preserve the historical unscaled behavior if SVG matrix APIs
            // are unavailable or fail in an older browser.
            return position;
        }
    },
    drag: function(me, event) {
        //if a card has been picked up
        if (me.dragging) {
            // CSS scaling changes viewport pixels without changing the SVG's
            // coordinate system. Translate by the pointer delta expressed in
            // SVG coordinates so the lifted card stays under the mouse.
            var pointerPosition = me.getPointerPosition(event);
            me.dragging.card.translate(pointerPosition.x - me.grapbpoint.x, pointerPosition.y - me.grapbpoint.y);
            me.grapbpoint = pointerPosition;
        }
    },
    drop: function(item, dropItem, me, event, position) {
        //an extra check to be sure something is being dragged
        if (me.dragging && me.isDroppable) {
            
            //reset the dragging flags
            me.dragging = null;
            me.isDroppable = false;
            
            //if dropItem is null, it means that the card was dropped in a non-playable area on the canvas
            // also fails when it is not player's turn. player can indeed modify this setting locally.. but we
            //redraw the board when the next player plays.
            if (dropItem && me.isMyTurn) {
                //the card was dropped on a playable area

                // Close the local turn immediately.  Waiting until all human
                // move animations finish leaves a window where a fast second
                // click can submit another card while the AI response is
                // still being rendered.  The server token rejects that race,
                // but the client must also serialize the visual turn.
                me.isMyTurn = false;
                me.enableBoard(false);
                
                var loading = {remove:function(){}}; //create spoof object in case of race condition
                
                var rotationoffset = (Math.random() * 4) - 2;
                item.card.animate({ x: dropItem.x, y: dropItem.y, scale: 1, rotation: rotationoffset }, 300, function() {
                    item.card.toBack();
                    
                    //draw loading icon while ajaxing
                    if (gh.util.isset(loading)) {
                        loading = me.canvas.image('/images/loading.gif', me.pbp[position + 1].x + 50, me.pbp[position + 1].y + 68, 16, 11);
                    }
                });
                
                //register play with server
                $.ajax({
                    url: '/index/me',
                    type: 'POST',
                    dataType: 'JSON',
                    data: {
                        lllkjasdijwlkjlkajiisijlajsdiuiuwi: me.gameid,
                        yasidhnqwkjnsljdansflcknaslksjdlan: item.gameCardId,
                        woaijsdlkjqwpoijdlksjalwjdjkaclskd: position,
                        toiueniowineoimowekorurioieqppwodo: me.gameData.iiiooioooiooioioiiiiioioioooi //client key
                    },
                    success: function(data) {
                        
                        //response includes information about this player's turn result AS WELL AS the computer's next move
                        var response = data.ppqoowoieoiqpoipieoicojqpojuu; //keep "response" because it was the old name
                        
                        //store the computer's turn for processing later
                        me.them = data.ppqoowoieoiqpoipieoicojqpojow;
                        
                        //set new key
                        me.gameData.iiiooioooiooioioiiiiioioioooi = data.player; //player is simply a determine keyword
                        
                        //remove loading icon
                        loading.remove();
                        loading = null;
                        
                        //by removing the rect on the playing area we remove the ability to make another play in this area
                        dropItem.rect.remove();
                        dropItem.rect = null;
                        
                        //bring card up front, if a rotation as been applied, it overlaps existing cards
                        item.card.toFront();
                        
                        //x: json, item: obj from the player's hand, and callback
                        me.dropResult(response, item, function() {
                            //end their turn locally
                            
                            //handle postplay dialogs here
                            me.dialogManager(response.dialog, 1, function() {
                                me.activatePlayerTurn(false, response.gameover);
                            });
                        });
                    },
                    error: function(response, status, message) {
                        if (loading) {
                            loading.remove();
                            loading = null;
                        }
                        me.drawPlayerOneHand('order');
                        me.isMyTurn = true;
                        me.enableBoard(true);
                        gh.manager.error(response.responseText);
                    }
                });
            } else {
                //card was dropped in a non playable area of the canvas, return to deck
                me.drawPlayerOneHand('order'); //reposition cards (draws tofront from top to bottom)
                item.card.node.setAttributeNS(null, 'pointer-events', 'none'); //disable card while returning to deck
                
                rotationoffset = (Math.random() * 4) - 2;
                item.card.animate({ x: item.x, y: item.y, rotation: 360 + rotationoffset, scale: 1 }, 300, ">", function() {
                    setTimeout(function() { //obviously this shouldn't be necessary, but I was having difficulty reseting the rotation after the ani!
                        item.card.attr({ rotation: rotationoffset });
                    }, 20);
                    item.card.node.setAttributeNS(null, 'pointer-events', 'all'); //return draggable properties
                });
            }
        }
    },
    dropResult: function(json, item, callback) {
        //this function is fired as a result of the player dropping a card and a server request (or game review) json data set is returned
        var me = this;
        var position = parseInt(json.y, 10);
        
        //move this card to the playboard
        me.pb[position].card = item.card;
        me.pb[position].gameCardId = item.gameCardId;
        me.pb[position].image = item.image;
        me.pb[position].captured = me.p1;
        me.pb[position].owner = item.owner;
        
        //show modifier is elemental game and position has element
        if (me.rules[6]) {
            var bonus = parseInt(json.eb, 10);
            if (bonus != 0) {
                me.pb[position].bonus = parseInt(json.eb, 10);
                me.pb[position].element.toFront();
                me.drawBonusModifier(position);
                if (bonus > 0) {
                    gh.audio.elementMatch.play();
                } else {
                    gh.audio.elementFail.play();
                }
            }
        }
        
        //remove array item for this card object from the player deck
        me.p1h.splice($.inArray(item, me.p1h), 1);
        
        //redraw player one hand moves remaining cards up)
        me.drawPlayerOneHand();
        
        
        me.parseCapturePlacements(json.captures, 0, me.p1, function() {
        
            //update scores
            me.updateScores([json.p1s, json.p2s]);
        
            //fire callback
            callback();
        });
    },
    grab: function(item, me, event) {
        if (!me.dragging) {
            //grab
            item.card.toFront();
            item.card.node.setAttributeNS(null, 'pointer-events', 'none');
            me.grapbpoint = me.getPointerPosition(event);
            me.dragging = item;
            var rotationoffset = (Math.random() * 4) - 2;
            item.card.animate({ scale: 1.075, rotation: rotationoffset }, 300, function() {
                //since this card has been picked up, it can now be dropped
                me.isDroppable = true;
                //this is set after the animation in order to prevent the canvas.onclick (drop event) from firing the same time the card is lifted.
            });
        }
    },
    endCondition: function(callback) {
        //call takes 1 bool param: true gameover, false nope!
        var me = this;
        //check for any open places on the playboard
        var end = true;
        $.each(me.pb, function(index, item) {
            if (item.gameCardId === 0) {
                end = false;
            }
        });
        
        //if sudden death enabled and tied, game restarts with captured cards
        if (me.rules[8] && end && me.scores[0].score == 5) {
            //sudden death!
            me.suddenDeath(function() {
                callback(false);
            });
        } else {
            callback(end);
        }
    },
    onGameover: function(gameoverdetails) {
        //two entry points into tis function: from this game object, and from the manager when the user refreshed during the claim card phase (game is over but not yet finished)
        var me = this;
        
        me.gameover = true;
        me.enableHand(false);
        me.enableBoard(false);
        //call the game over callback. this hands the control back to the manager. pass with it the victory condition and other data
        
        //bail now for games under review (tutorials)
        if (me.isreplay) {
            me.onFinish();
            return;
        }
        
        var victory = (me.scores[0].score > 5) ? 1 : (me.scores[0].score == 5) ? 0 : -1;
        
        //reassemble hands for claim/take:
        var p1h = [], p2h = [], allcards = $.merge($.merge(me.p1h, me.p2h), me.pb); //merge all game cards into a single array. owner's cards can be anywhere, even in the other's hand (with sudden death)
        $.each(allcards, function() {
            if (this.owner == 1) {
                p2h.push(this);
            } else {
                p1h.push(this);
            }
        });
        
        //if gameoverdetails object is not present, they are from seed data
        if (!gh.util.hasProperty(gameoverdetails, 'claim')) {
           gameoverdetails.claim = me.gameData.ewoicujonadsincoqinokcnvbzkak;
        }
        if (!gh.util.hasProperty(gameoverdetails, 'nextrules')) {
            gameoverdetails.nextrules = me.gameData.bqpdkjaoskcjqekndckmaslkneihn;
        }
        if (!gh.util.hasProperty(gameoverdetails, 'hand')) {
            gameoverdetails.hand = me.gameData.oiqwpojcoqeijckjlkwjepficojpk;
        }
        if (!gh.util.hasProperty(gameoverdetails, 'deckcount')) {
            gameoverdetails.deckcount = me.gameData.uioqoiiidiioqoiwudioiuqwiowiq;
        }
        if (!gh.util.hasProperty(gameoverdetails, 'own')) {
            gameoverdetails.own = me.gameData.nbzxcvmnzbxmncvshjashkdjhkakk;
        }
        
        //if game over details contains there proerties, override the ones already set
        if (gh.util.hasProperty(gameoverdetails, 'p2h')) {
            me.p2h = [];
            me.buildPlayerTwoHand(gameoverdetails.p2h);
            p2h = me.p2h; //for closed games we take p2h from the server
        }
        
        var details = {
            victory:    victory,
            score:      me.scores[0].score + '-' + me.scores[1].score,
            claim:      gameoverdetails.claim,
            taken:      gameoverdetails.taken || [],
            won:        gameoverdetails.won || [],
            given:      gameoverdetails.given || [], //these are not needed on claim refresh, so pass empty array when they are undef
            userid:     me.p1,
            gameid:     me.gameid,
            p1h:        p1h,
            p2h:        p2h,
            newhand:    gameoverdetails.hand,
            deckcount:  gameoverdetails.deckcount,
            nextrules:  gameoverdetails.nextrules,
            own:        gameoverdetails.own,
            coinsAwarded: gameoverdetails.coinsAwarded,
            coins:      gameoverdetails.coins
        };
        
        //console.log(details);
        
        me.onFinish(details);
    },
    onFinish: function(details) {
        var me = this;
        
        //clear rules
        me.ruleswrapper.fadeOut();
        
        //reenable options if for some reason they were disabled (tutorials, dialogs)
        $('#contextmenu li').addClass('enabled');
        
        //cancel early exit shortcut
        $('#title').unbind('click').css('cursor','default');
        
        me.gameoverCallback(details);
    },
    suddenDeath: function(callback) {
        var me = this;

        //keep the hand inert until every card has returned and its stacking order is final
        me.enableHand(false);
        
        //simple structure for looping over players
        var p = [
            {'userid': me.p1, 'hand': me.p1h, 'position': me.p1p},
            {'userid': me.p2, 'hand': me.p2h, 'position': me.p2p}
        ];
        //loop through players
        $.each(p, function(playerIndex, player){
            //loop over playboard
            $.each(me.pb, function(index, item) {
                if (Number(item.captured) === Number(p[playerIndex].userid)) {
                    var positionIndex = p[playerIndex].hand.length + 1;
                    //player's captured cards
                    p[playerIndex].hand.push({ 
                        gameCardId: item.gameCardId,
                        image: item.image,
                        card: item.card,
                        owner: item.owner,
                        x: 0,
                        y: 0
                    });
                    var newItem = p[playerIndex].hand[p[playerIndex].hand.length-1];
                    
                    //restore drag and drop to player's cards
                    if (p[playerIndex].userid === me.p1) {
                        $(newItem.card.node).css('cursor', ' url(/images/open.cur), move');
                        me.playerOneCardClick(newItem);
                        newItem.card.node.setAttributeNS(null, 'pointer-events', 'none');
                    }
                    newItem.card.toFront();
                    
                    newItem.x = p[playerIndex].position[positionIndex].x;
                    newItem.y = p[playerIndex].position[positionIndex].y;
                }
            });
        });
        
        //show sudden death
        me.drawRule(8, 2000, function() {
            //animations and captures can change SVG paint order, so finish with the
            //same canonical top-to-bottom ordering used by normal hand returns
            me.drawPlayerOneHand('order');
            me.drawPlayerTwoHand('order');
            me.enableHand(true);
            callback(); //callback to end condition called here, when rule disappears
        });
        
        //animate cards
        var resetBoard = function() {
            $.each(p, function(playerIndex, player) {
                $.each(p[playerIndex].hand, function(index, item) {
                    //animate return to deck
                    item.card.animate({ x: item.x, y: item.y, rotation: 360 }, 200 + (index * 100), ">", function() {
                        setTimeout(function() { //obviously this shouldn't be necessary, but I was having difficulty reseting the rotation after the ani!
                            item.card.attr({ rotation: 0 });
                        }, 20);
                    });
                });
            });
        };
        setTimeout(resetBoard, 1000); //stagger animations
        
        //clear the playboard
        $.each(me.pb, function(index, item){
            me.pb[index].gameCardId = 0;
            me.pb[index].image = null;
            me.pb[index].card = null;
            if (me.pb[index].bonusObject) {
                me.pb[index].bonusObject[0].remove();
                me.pb[index].bonusObject[1].remove();
            }
            me.pb[index].bonusObject = null;
        });
        me.drawBoardDrops(); //redraws drops
        me.inSuddenDeath = true;
    },
    enableHand: function(enableHand) {
        var me = this;
        if (enableHand) {
            $.each(me.p1h, function(index, item) {
                if (item.card) {
                    item.card.node.setAttributeNS(null, 'pointer-events', 'all');
                }
            });
        } else {
            $.each(me.p1h, function(index, item) {
                if (item.card) {
                    item.card.node.setAttributeNS(null, 'pointer-events', 'none');
                }
            });
        }
    },
    imagePreLoad: function(path) {
        //once a card has been revealed, a preload in its opponent deck color will reduce load time
        var me = this;
        var x = new Image(me.cW, me.cH);
        x.src = path;
    },
    dialogManager: function(dialog, index, callback) {
        //entry point for dialog object (dialog), index is the index to check
        var me = this;
        if (gh.defined(dialog[index])) {
            if (dialog[index].length > 0) {
                    
                    setTimeout(function() {
                        //disable exit opprotunity
                        $('#title').removeClass('enabled');
                        $('#contextmenu li').removeClass('enabled');
                        
                        me.dialogStart(dialog[index], 0, function() {
                            
                            //if game not under review, reenable menu options
                            if (!me.underReview) {
                                $('#title').addClass('enabled');
                                $('#contextmenu li').addClass('enabled');
                            }
                            
                            callback();
                        });
                    }, 300);
            } else {
                callback();
            }
        } else {
            callback();
        }
    },
    dialogStart: function(dialogs, index, callback) {
        var me = this;
        $('#board div.overlay').fadeTo(500, 0.3, function() {
            me.dialog(dialogs, index, function() {
                $('#board div.overlay').fadeOut(500, function() {
                    callback();
                });
            });
        });
    },
    dialog: function(dialogs, index, callback) {
        var me = this;
        if (index == dialogs.length) {
            callback();
        } else {
            var dialog = new gh.dialog('dialog' + index, dialogs[index], function(item) {
                if (gh.defined(item.link)) {
                    //a link property is seen as an exit since we no longer hard link across the site
                    me.gameover = true;
                    
                    $('#board div.overlay').fadeOut(500, function() {
                        me.onFinish();
                    });
                } else if (gh.defined(item.direction)) {
                    //direction indicates continuance
                    me.dialog(dialogs, index + (item.direction), callback);
                } else {
                    //end tutorial
                    callback();
                }
            });
        }
    },
    reviewGame: function() {
        //review game suspends current play under history animations are complete
        var me = this;
        
        //if not already under review and it is currently the player's turn
        if (!me.underReview && (me.isMyTurn || me.gameover)) {
            
            //set global toggle
            me.underReview = true;
            me.enableBoard(false);
            me.enableHand(false);
            
            //disable exit opprotunity
            $('#title').removeClass('enabled');
            $('#contextmenu li').removeClass('enabled');
            
            if (!me.isreplay) {
                gh.manager.loading(true);
            }
            
            $.ajax ({
                url: '/index/review-data?gameid=' + me.gameid,
                type: 'POST',
                dataType: 'JSON',
                success: function(response) {
                    
                    if (!me.isreplay) {
                        gh.manager.loading(false);
                    }
                    
                    //if there is a history (line 1 is game setup)
                    if (response.length > 1) {
                        
                        var setup = response[0];
                        
                        
                        //set review speed
                        me.reviewSpeed = setup.eeoiquokjsnlfoiqjslk || me.reviewSpeed;
                        
                        //loop over playboard
                        $.each(me.pb, function(index, item) {
                            
                            //step through the cards known to be player one's and find them on the canvas
                            $.each(setup.mnzbxcnbmncbzmxnbcmnbzxmnb, function(index2, item2) {
                                //if the gamecardid of the card on playboard matches that of one of player one's cards
                                if (item2.jjkaooijslakjdiwjkalsjkkk == item.gameCardId) {
                                    //remove these cards from their place on the game board and put them back into the player's hand
                                    var positionIndex = me.p1h.length + 1; //the index at which this card will be placed
                                    var card = item.card; //handle for the card obj
                                    me.p1h.push({
                                        gameCardId: item.gameCardId, 
                                        image: item.image,
                                        owner: item.owner, 
                                        card: item.card, 
                                        x: me.p1p[positionIndex].x, 
                                        y: me.p1p[positionIndex].y 
                                    }); //add back to the player hand
                                    card.attr({ 'src': '/images/cards/' + item2.lkjasdojwlkajsdkjdpakjkjs + '.png' }); //change color back to original
                                    card.animate({ x: me.p1p[positionIndex].x, y: me.p1p[positionIndex].y, rotation: 360 }, 200 + (index * 100), ">", function() {
                                        setTimeout(function() {
                                            card.attr({ rotation: 0 });
                                        }, 20);
                                    }).toFront(); //toFront assures that cards dropped in a non-playable area return in the proper order
                                }
                            });
                            
                            //step through the cards known to me player two's and put them back into the player's hand
                            $.each(setup.kjhsadjhkaskjhdkjhasjhdasd, function(index2, item2) {
                                //if the gamecardid of the card on playboard matches that of one of player two's cards
                                if (item2.jjkaooijslakjdiwjkalsjkkk == item.gameCardId) {
                                    //remove these cards from their place on the game board and put them back into the player's hand
                                    var positionIndex = me.p2h.length + 1; //the index at which this card will be placed
                                    var card = item.card; //handle for the card obj
                                    me.p2h.push({
                                        gameCardId: item.gameCardId,
                                        image: item.image, 
                                        owner: item.owner,
                                        card: item.card, 
                                        x: me.p2p[positionIndex].x, 
                                        y: me.p2p[positionIndex].y 
                                    }); //add back to the player hand
                                    card.attr({ 'src': '/images/cards/' + item2.lkjasdojwlkajsdkjdpakjkjs + '.png' }); //change color back to original
                                    card.animate({ x: me.p2p[positionIndex].x, y: me.p2p[positionIndex].y, rotation: 360 }, 200 + (index * 100), ">", function() {
                                        setTimeout(function() {
                                            card.attr({ rotation: 0 });
                                        }, 20);
                                    }).toFront(); //toFront assures that cards dropped in a non-playable area return in the proper order
                                }
                            });
                            //the card HAD to be one of the player's cards, so clear the playboard of this card.
                            me.pb[index].gameCardId = 0;
                            me.pb[index].image = null;
                            me.pb[index].card = null;
                            if (me.pb[index].bonusObject) {
                                me.pb[index].bonusObject[0].remove();
                                me.pb[index].bonusObject[1].remove();
                            }
                            me.pb[index].bonusObject = null;
                        });
                        
                        //reset the score
                        setTimeout(function() {
                            me.updateScores([5, 5]);
                        }, 1500);
                        
                        //structures for replay:
                        var replay = function(historyIndex) {
                             //on initial load, can't pass params with delay
                            if (!historyIndex) {
                                historyIndex = 1;
                            }
                            //base case, for when all the histry steps are complete
                            if (historyIndex == response.length) {
                                
                                me.underReview = false;
                                //if not a gameover, this review was conducted on player's turn. reenable the board and hand
                                if (!me.gameover) {
                                    me.enableHand(true);
                                }
                                
                                $('#title').addClass('enabled');
                                $('#contextmenu li').addClass('enabled');
                                
                                me.activatePlayerTurn(me.isMyTurn); //resume game (handles if game over already;
                                
                            } else {
                                var item = response[historyIndex];
                                var turn;
                                
                                //if this is my own play
                                if (item.u != 1) {
                                    turn = function() {
                                        me.drawTurnMarker(true, function() {
                                            var obj = null; //handle for obj in player's hand
                                            $.each(me.p1h, function(index2, item2) {
                                                if (item2.gameCardId == item.x) {
                                                    obj = item2;
                                                }
                                            });
                                            if (obj) {
                                                //move this card manually since the player would normally
                                                gh.audio.draw.play();
                                                obj.card.toFront();
                                                obj.card.animate({ x: me.pbp[0].x, y: me.pbp[0].y, scale: 2 }, 300, ">", function() {
                                                    setTimeout(function() {
                                                        obj.card.animate({ scale: 1, x: me.pbp[parseInt(item.y, 10) + 1].x, y: me.pbp[parseInt(item.y, 10) + 1].y, rotation: 720 }, 300, "<>", function() {
                                                            setTimeout (function() {
                                                                obj.card.attr({ rotation: 0 }).toBack();
                                                                //result that fires with response from server. the 'true' param indicates 'is for review'
                                                                me.dropResult(item, obj, function() {
                                                                    setTimeout(function() {
                                                                        postPlay(item, function() {
                                                                            replay(historyIndex + 1);
                                                                        });
                                                                    }, me.reviewSpeed);
                                                                });
                                                            }, 20);
                                                        });
                                                    }, 600);
                                                });
                                            }
                                        });
                                    };
                                } else {
                                    turn = function() {
                                        me.drawTurnMarker(false, function() {
                                            me.opponentPlay(item, function() {
                                                setTimeout(function() {
                                                    postPlay(item, function() {
                                                        replay(historyIndex + 1);
                                                    });
                                                }, me.reviewSpeed);
                                            });
                                        });
                                    };
                                }
                                
                                //handle pre-play dialogs
                                me.dialogManager(item.dialog, 0, turn);
                            }
                        };
                        //handle post-play dialogs
                        var postPlay = function(item, callback) {
                            me.dialogManager(item.dialog, 1, callback);
                        };
                        setTimeout(function() {
                            replay();
                        }, 2000);
                    } else {
                        //no history yet
                        me.underReview = false;
                        //if not a gameover, this review was conducted on player's turn. reenable the board and hand
                        if (!me.gameover) {
                            me.enableHand(true);
                        }
                        me.activatePlayerTurn(me.isMyTurn); //resume game (handles if game over already;
                        
                        $('#title').addClass('enabled');
                        $('#contextmenu li').addClass('enabled');
                    }
                }
            });
        }
    }
};
