var gameManager = new Class({
    initialize: function(gameId, gameData) {
        //upon initialization server has already verified players for this gameid
        this.gameid = gameId;
        this.canvas = null;

        this.gameover = false; //set to true when there are no more plays

        this.cW = 117       //static card width
        this.cH = 146;      //static card height
        this.eW = 30;       //static board element width
        this.eH = 30;       //static board element height

        //review 
        this.underReview = false; //is set to true when player is reviewing history
        this.reviewSpeed = 750; //the delay (in ms) between player turns when revewing

        //player information
        this.myColor = 'blue';
        this.opponentColor = 'red';

        this.isMyTurn = false;      //when true, cards are playable
        this.dragging = null;       //a flag which will contain the player object deck array item of the currently dragging card
        this.isDroppable = false;   //a card can only be droppable once picked up. This flag prevents immature dropping
        this.grapbpoint = null;

        this.rules = new Array(8);           //will store a rule object if rule if active for this game

        //places where there are cards:
        this.p1h = []; //player one hand. the object contains the properties: gamecardId, image, card (svg ref), x, y (current positions)
        this.p2h = []; //player two hand same properties as above
        this.pb = []; //play board

        //places where there are other canvas objects
        this.scores = [];
        this.turnMarker = null;

        //board positions:
        this.pbp = [];
        this.p1p = [];
        this.p2p = [];
        this.fp = [];

        //create client placeholders
        this.buildCanvas();
        this.buildPositions();

        //seed client data from server
        this.buildClientData(gameData);
        //render client
        this.renderClient(gameData);

        //begin game
        this.activatePlayerTurn((gameData.MotduJour == "6b3727315a68646d285c7873262d2e662167725e41213c65353621682b") ? true : false);
    },
    buildCanvas: function() {
        var gm = this;
        this.canvas = Raphael("svgBoard", 693, 500);
        //these events are attached to the svg canvas. both relate to dragging player cards.
        $('svgBoard').onmousemove = function(evt) { if (gm.dragging) gm.drag(gm, evt) }
        $('svgBoard').onclick = function(evt) { if (gm.isDroppable) gm.drop(gm.dragging, null, gm, evt) }

        this.grapbpoint = new Object({ x: 0, y: 0 });
    },
    buildPositions: function() {
        this.pbp = [
            new Object({ x: 229.5, y: 104 }), //center
            new Object({ x: 172, y: 35 }), //1
            new Object({ x: 289, y: 35 }), //2
            new Object({ x: 406, y: 35 }), //3
            new Object({ x: 172, y: 181 }), //4
            new Object({ x: 289, y: 181 }), //5
            new Object({ x: 406, y: 181 }), //6
            new Object({ x: 172, y: 327 }), //7
            new Object({ x: 289, y: 327 }), //8
            new Object({ x: 406, y: 327 }) //9
            ]
        this.p1p = [
            new Object({ x: 0, y: 0 }),
            new Object({ x: 28, y: 18 }), //1
            new Object({ x: 28, y: 73 }), //2
            new Object({ x: 28, y: 128 }), //3
            new Object({ x: 28, y: 183 }), //4
            new Object({ x: 28, y: 238 }), //5
            ]
        this.p2p = [
            new Object({ x: 0, y: 0 }),
            new Object({ x: 550, y: 18 }), //1
            new Object({ x: 550, y: 73 }), //2
            new Object({ x: 550, y: 128 }), //3
            new Object({ x: 550, y: 183 }), //4
            new Object({ x: 550, y: 238 }), //5
            ]
        this.fp = [ //font positions (x, y: for the number, a:b for the "+" / "-"
        //new Object({ x: 229.5, y: 104 }), //center
            new Object({ x: 227, y: 117, a: 203, b: 117 }), //1
            new Object({ x: 343, y: 117, a: 320, b: 117 }), //2
            new Object({ x: 462, y: 117, a: 438, b: 117 }), //3
            new Object({ x: 227, y: 281, a: 203, b: 305 }), //4
            new Object({ x: 343, y: 281, a: 320, b: 305 }), //5
            new Object({ x: 462, y: 281, a: 438, b: 305 }), //6
            new Object({ x: 227, y: 445, a: 203, b: 490 }), //7
            new Object({ x: 343, y: 445, a: 320, b: 490 }), //8
            new Object({ x: 462, y: 445, a: 438, b: 490 }) //9
            ]
    },
    buildClientData: function(gameData) {
        var gm = this;
        //colors
        gm.myColor = gameData.mnsjkaiwbcbakjwifh;
        gm.opponentColor = gameData.yqofhqoiwhfcoqhfcohq;

        //this function builds client data from a server data response
        this.buildPlayerOneHand(gameData.mnzbxcnbmncbzmxnbcmnbzxmnb);
        this.buildPlayerTwoHand(gameData.kjhsadjhkaskjhdkjhasjhdasd);
        this.buildPlayBoard(gameData.uyeiqowiutoiqyweiuyqwoiyro);

        //build scores
        this.scores.include(new Object({ score: gameData.lkjasdoiuqwekjadsflkjmnbxcvkhj, oldScore: null, coming: null, going: null, x: 87, y: 545 }));
        this.scores.include(new Object({ score: gameData.asdlkjqweoiuwervbirwaljdsbvlkjbl, oldScore: null, coming: null, going: null, x: 568, y: 545 }));

        //build rules
        gameData.sdflkjweoirukjsdlvkjsdlouwepojljklsdkl.each(function(item, index) {
            gm.rules[item.poiqwepoir] = new Object({ 'name': item.fjklasdjklasfj, 'desc': item.cbnmzxcbnmz });
        });
    },
    renderClient: function(gameData) {
        var gm = this;
        this.drawBoardElements();
        this.drawBoardDrops();
        this.drawPlayerOneHand();
        this.drawPlayerTwoHand();
        this.drawPlayerScores();

        gm.imagePreLoad('img/cardBack.png');
    },
    buildPlayerOneHand: function(data) {
        var gm = this;
        data.each(function(item, index) {
            gm.p1h.include(new Object({ gameCardId: item.gcid, image: item.image, card: null, x: 0, y: 0 }));
            gm.imagePreLoad(item.image.replace(gm.myColor, gm.opponentColor)); //pre load inverse of players cards since all are shown (opponents are preloaded on reveal)
        });
    },
    buildPlayerTwoHand: function(data) {
        var gm = this;
        data.each(function(item, index) {
            gm.p2h.include(new Object({ gameCardId: item.gcid, image: item.image, card: null, x: 0, y: 0 }));
        });
    },
    buildPlayBoard: function(data) {
        var gm = this;
        //data.pb will ALWAYS contain the nine index for play board.
        data.each(function(item, index) {
            //if there is a game card id for this position
            if (item.gcid) {
                /*
                Play Board object contains these properties:
                
                gameCardId: int, the game card id of the card placed here. -1 if no card
                image: string, the url to the card's image, null if no card
                card: object, the raphael object js ref to the card object, null if no card
                rect: object, the raphael object js ref to the onmouseover rect droppable, null if not a playable area
                elementId: int, if an elemental game, the elementId of the elemtn placed on the board in this position, -1 if no element
                element: object, the raphael object js ref to the element image object, null if no element
                bonus: int, the bonus modifier on the card in this position if element on this board position 
                bonusObject: the object that gets rendered on the play board
                
                */
                gm.pb.include(new Object({ gameCardId: item.gcid, image: item.image, card: null, rect: null, elementId: item.e, element: null, bonus: item.b, bonusObject: null, x: 0, y: 0 }));
            }
            //no game card, playable area for this index
            else {
                gm.pb.include(new Object({ gameCardId: "-1", image: null, card: null, rect: null, elementId: item.e, element: null, bonus: 0, bonusObject: null, x: 0, y: 0 }));
            }
        });
    },
    drawBoardElements: function() {
        var gm = this;
        gm.pb.each(function(item, position) {
            //if an element was defined for this index and a card is not already placed, draw it
            if (item.elementId > -1) {
                gm.pb[position].element = gm.canvas.image('img/cardElements/g' + item.elementId + '.png', (gm.pbp[position + 1].x) + (gm.cW / 2) - (gm.eW / 2), (gm.pbp[position + 1].y) + (gm.cH / 2) - (gm.eH / 2), gm.eW, gm.eH);
                gm.animateBoardElement(gm.pb[position].element, parseInt(item.elementId));
            }
        });
    },
    animateBoardElement: function(item, elementId) {
        var gm = this;
        switch (elementId) {
            case 7: //light
            case 2: //ice
            case 3: //wind
                //spin:
                item.animate({ rotation: 3600 }, 60000, function() {
                    item.animate({ rotation: 0 }, 60000, function() {
                        gm.animateBoardElement(item, elementId);
                    });
                });
                break;
            case 6: //water
            case 4: //poison
            case 0: //lightening
                //grow and shrink
                item.animate({ scale: 1.2 }, 500, function() {
                    item.animate({ scale: 1 }, 500, function() {
                        gm.animateBoardElement(item, elementId);
                    });
                });
                break;
            case 1: //earth
            case 5: //fire
                //shake
                item.animate({ translation: [0, -3] }, 300, function() {
                    item.animate({ translation: [0, 3] }, 300, function() {
                        gm.animateBoardElement(item, elementId);
                    });
                });
                break;
        }
    },
    drawBoardDrops: function() {
        var gm = this;
        gm.pb.each(function(item, index) {
            //if a game card was defined for this index, draw it
            if (item.gameCardId > 0) {

                item.card = gm.canvas.image(item.image, gm.pbp[index + 1].x, gm.pbp[index + 1].y, gm.cW, gm.cH).toBack();

                //if an elemental bonus has been added to this card, show it
                if (gm.rules[6]) {
                    gm.drawBonusModifier(index);
                }

            } else {
                //otherwise build a rectangular, droppable, playing area
                item.rect = gm.canvas.rect(gm.pbp[index + 1].x, gm.pbp[index + 1].y, gm.cW, gm.cH, 10).attr({ 'fill': 'black', 'opacity': '0', 'stroke-width': '0' })
                item.rect.node.onmouseover = function(evt) { if (gm.dragging) item.rect.attr({ 'opacity': '0.3' }); }
                item.rect.node.onmouseout = function(evt) { if (gm.dragging) item.rect.attr({ 'opacity': '0' }) }
                item.rect.node.onclick = function(evt) { if (gm.dragging) gm.drop(gm.dragging, item, gm, evt, index); }
            }
            item.x = gm.pbp[index + 1].x;
            item.y = gm.pbp[index + 1].y;
        });
    },
    drawBonusModifier: function(index) {
        var gm = this;
        var bonus = Math.abs(parseInt(gm.pb[index].bonus));
        if (bonus != 0) {
            gm.pb[index].bonusObject = [
                gm.canvas.print(gm.fp[index].a, gm.fp[index].b, (parseInt(gm.pb[index].bonus) > 0) ? "+" : "-", gm.canvas.getFont("edison"), 80).attr({ 'fill': '#ffffff', 'stroke': '#300d08', 'stroke-width': '1.5' }).toFront(),
                gm.canvas.print(gm.fp[index].x, gm.fp[index].y, bonus, gm.canvas.getFont("plugnickel"), 40).attr({ 'fill': '#ffffff', 'stroke': '#300d08', 'stroke-width': '1.5' }).toFront()
            ]
        }
    },
    drawPlayerTwoHand: function() {
        var gm = this;
        //loop through the player two deck object array
        this.p2h.each(function(item, index) {
            if ($defined(item.card)) {
                item.card.animate({ x: gm.p2p[index + 1].x, y: gm.p1p[index + 1].y }, 300 + (index * 100), ">").toFront(); //toFront assures that cards dropped in a non-playable area return in the proper order
            } else {
                item.card = gm.canvas.image(item.image, gm.p2p[index + 1].x, gm.p2p[index + 1].y, gm.cW, gm.cH);
            }
            item.x = gm.p2p[index + 1].x;
            item.y = gm.p2p[index + 1].y;
        });
    },
    drawPlayerOneHand: function() {
        //this function is called to render the player one hand (card not in play)
        var gm = this;
        //loop through the player one deck object array
        this.p1h.each(function(item, index) {
            //if a card has already been defined for this index, we're calling this function after an array change (card was played)
            if ($defined(item.card)) {
                //reanimate the remaning cards
                item.card.animate({ x: gm.p1p[index + 1].x, y: gm.p1p[index + 1].y }, 300 + (index * 100), ">").toFront(); //toFront assures that cards dropped in a non-playable area return in the proper order
            } else {
                //initial call to this function creates and renders the card
                item.card = gm.canvas.image(item.image, gm.p1p[index + 1].x, gm.p1p[index + 1].y, gm.cW, gm.cH);
                item.card.node.setStyle('cursor', ' url(/img/open.cur), move');
                item.card.node.onclick = function(evt) { gm.grab(item, gm, evt); }
            }
            //save origin position of this card to the deck object array
            item.x = gm.p1p[index + 1].x;
            item.y = gm.p1p[index + 1].y;
        });
    },
    drawPlayerScores: function() {
        var gm = this;
        gm.scores.each(function(item, index) {
            //if no score, draw it
            if (item.coming == null) {
                item.coming = gm.canvas.print(item.x, item.y, item.score, gm.canvas.getFont("orotund"), 80);
                //if recent score change, animate it
                if (item.oldScore != null) {
                    //var r = (item.oldScore > item.score) ? 90 : -90;
                    item.coming.attr({ fill: '#300d08', opacity: 0, scale: .3 });
                    item.coming.animate({ opacity: 1, scale: .275, rotation: 0 }, 300, ">");
                } else {
                    item.coming.attr({ fill: '#300d08', opacity: 1, scale: .275 });
                }
            }
        });
    },
    drawTurnMarker: function(myTurn, callback) {
        //renders the turn marker. mtTurn is true when the user's turn is active. callback is function to fire when animation is complete
        var gm = this;
        //images to use
        var src = ['img/dime-heads.png', 'img/dime-tails.png'];
        var xpos = (myTurn) ? 33 : 621;
        if (!$defined(gm.turnMarker)) {
            gm.turnMarker = gm.canvas.image(src[(myTurn) ? 0 : 1], xpos, 420, 41, 41).toFront();
            gm.turnMarker.animate({ rotation: Math.floor(Math.random() * 90) }, 2000, ">");
            if ($defined(callback)) callback();
        } else {
            //begin animation to other side
            gm.turnMarker.attr('rotation', 0);
            gm.turnMarker.animate({ x: xpos, y: 420, width: 41 }, 400, "<>", function() {
                if ($defined(callback)) callback();
                //residule rotation, rotates negatively on user's side
                var rot = (Math.floor(Math.random() * 180) * ((myTurn) ? -1 : 1));
                gm.turnMarker.animate({ rotation: rot }, 2000, ">");
            });
        }
    },
    activatePlayerTurn: function(bool) {
        var gm = this;
        if (!gm.endCondition()) {
            gm.isMyTurn = bool;
            gm.drawTurnMarker(gm.isMyTurn, function() {
                //it is now player's turn:
                if (bool) {
                    gm.enableBoard(true);
                }
                //the player's turn as ended:
                else {
                    gm.enableBoard(false); //disable immediately
                    //initiate opponet's turn. small delay to avoid appearance of opponent "rushing" move
                    var go = function() { gm.getOpponentMove(); }
                    go.delay(1500);
                }
            });
        } else {
            gm.gameover = true;
            gm.enableHand(false);
            gm.enableBoard(false);
        }
    },
    updateScores: function(scores) {
        var gm = this;
        scores.each(function(newScore, index) {
            if (newScore != gm.scores[index].score) {
                gm.scores[index].oldScore = gm.scores[index].score;
                gm.scores[index].score = newScore;
                gm.scores[index].going = gm.scores[index].coming;
                gm.scores[index].coming = null;

                //var r = (gm.scores[index].oldScore > newScore) ? 90 : -90;
                gm.scores[index].going.animate({ opacity: 0, scale: .2 }, 300, ">", function() {
                    gm.scores[index].going.remove();
                    gm.scores[index].going = null;
                });
            }
        });
        gm.drawPlayerScores();
    },
    getOpponentMove: function() {
        var gm = this;
        new Request.JSON({
            method: 'post',
            url: 'gameData.aspx',
            onComplete: function(x) {

                //pre load reveal
                if (x.z) gm.imagePreLoad(x.z);

                gm.opponentTeasePlay(Math.floor(Math.random() * gm.p2h.length), 0, x);
            }
        }).send('254e36437e3b5d517a335e643f702b6728343074752f2c327d666c4747=' + gm.gameid + '&c=3c3769475a492e444b4f24673173474375723e214d407b7a2a4f634652');
        //to throw off any hax0rs, the first value sent to the server is the gameid (we check the player session against gameid on the back)
        //and the second value is the case on the server, this time we want opponet ai move
    },
    opponentTeasePlay: function(count, ctr, x) {
        var gm = this;
        if (count == ctr) gm.opponentPlay(x, function() {

            //activate player's turn
            gm.activatePlayerTurn(true);
        });
        else {
            var index = Math.floor(Math.random() * gm.p2h.length);
            gm.p2h[index].card.animate({ x: gm.p2h[index].x - 20 }, 300, ">", function() {
                gm.p2h[index].card.animate({}, (Math.floor(Math.random() * 10) * 50) + 1000, function() { //hold
                    gm.p2h[index].card.animate({ x: gm.p2h[index].x }, 300, ">", function() {
                        gm.drawPlayerTwoHand(); //reposition cards
                        gm.opponentTeasePlay(count, ctr + 1, x);
                    });
                });
            });
        }
    },
    opponentPlay: function(x, callback) {
        var gm = this;
        var item;
        var playIndex = parseInt(x.y);
        gm.p2h.each(function(that, index) { if (that.gameCardId == x.x) item = that; });

        //draw card from opponet's deck
        item.card.toFront();
        item.card.animate({ x: gm.pbp[0].x, y: gm.pbp[0].y, scale: 2 }, 300, ">", function() {

            var y = function(x, item, playIndex) {
                item.card.animate({}, 300 * 2, function() { //hold
                    //adding +1 to index for board positions since we use 0 there
                    item.card.animate({ scale: 1, x: gm.pbp[playIndex + 1].x, y: gm.pbp[playIndex + 1].y, rotation: 720 }, 300, "<>", function() {

                        item.card.attr({ rotation: 0 }).toBack();

                        //flip any captured surrounding cards
                        gm.flipCardsStage1(x.captures, 0, function() {

                            //update scores when finished
                            gm.updateScores([x.p1s, x.p2s]);

                            //by removing the rect on the playing area we remove the ability to make another play in this area
                            //it may not be there if it was used with a flash
                            if ($defined(gm.pb[playIndex].rect)) {
                                gm.pb[playIndex].rect.remove();
                                gm.pb[playIndex].rect = null;
                            }

                            //fire callback
                            callback();
                        });

                        //move card to playBoard
                        gm.pb[playIndex].card = item.card;
                        gm.pb[playIndex].gameCardId = item.gameCardId;


                        //show modifier if elemental game and position has element
                        if (gm.rules[6]) {
                            if (parseInt(x.eb) != 0) {
                                gm.pb[playIndex].bonus = parseInt(x.eb);
                                gm.drawBonusModifier(playIndex);
                            }
                        }

                        //erase from player deck
                        gm.p2h.erase(item);
                        //redraw player two hand
                        gm.drawPlayerTwoHand();

                    });
                });
            }
            //if a closed game, perform reveal flip
            if (gm.rules[0] != null) {
                var z = item.card.getBBox().y;
                item.card.animate({ height: 0, y: z + ((gm.cH * 2) / 2) }, 300 / 2, ">", function() {
                    item.card.attr({ 'src': x.z });
                    item.card.animate({ height: gm.cH * 2, y: z }, 300 / 2, ">", function() {
                        y(x, item, playIndex);
                    });
                });
            } else {
                //if an open game, continue
                y(x, item, playIndex);
            }

        });
    },
    flipCardsStage1: function(data, index, callback) {
        var gm = this;
        //stage 1 considers if there will be more than one placement (with combo rule)
        if (data.length == index) {
            //if no more placements
            callback();
        }
        else {
            gm.flipCardsStage2(data[index], 0, function() {
                gm.flipCardsStage1(data, index + 1, callback);
            });
        }
    },
    flipCardsStage2: function(data, index, callback) {
        //stage 2 considers the different rules used to flip cards
        var gm = this;
        if (data.length == index) {
            //if no more rules to flip cards, consider next placements
            callback();
        } else {
            gm.flipCardsStage3(data[index], function() {
                //consider next rule flip object
                gm.flipCardsStage2(data, index + 1, callback);
            });
        }
    },
    flipCardsStage3: function(data, callback) {
        //stage 3 actually anylizes the rule slip object and flips cards
        var gm = this;
        //build a function to call after messages/fashes
        var basicFlip = function(flips) {
            flips.each(function(item, index) {
                /*
                p: game board position
                t: transition type
                i: image path
                */
                var speed = 300;
                var it = gm.pb[item.p];
                var optionsA;
                var optionsB;
                it.card.animate({ scale: 1.075 }, speed, ">", function() {
                    var y = it.card.getBBox().y;
                    var x = it.card.getBBox().x;
                    if (item.t == 1) {
                        //flip card top to bottom
                        optionsA = new Object({ height: 0, y: it.y + ((gm.cH * 1.075) / 2) });
                        optionsB = new Object({ height: gm.cH * 1.075, y: y });
                    } else {
                        //flipp card left ro right
                        optionsA = new Object({ width: 0, x: it.x + ((gm.cW * 1.075) / 2) });
                        optionsB = new Object({ width: gm.cW * 1.075, x: x });
                    }
                    it.card.animate(optionsA, speed / 4, function() {
                        it.card.attr({ 'src': 'img/cardBack.png' });
                        it.card.animate(optionsB, speed / 4, function() {
                            it.card.animate(optionsA, speed / 4, function() {
                                //change card color during flipping
                                it.card.attr({ 'src': item.i });
                                it.card.animate(optionsB, speed / 4, function() {
                                    it.card.animate({ scale: 1 }, "<", speed, function() {
                                        //if there was a bonus modifier on this position, redraw it
                                        if (gm.rules[6]) {
                                            if (parseInt(it.bonus) != 0 && $defined(it.bonusObject)) {
                                                it.bonusObject[0].toFront();
                                                it.bonusObject[1].toFront();
                                            }
                                        }
                                        //tricky business! The last card flip will call the callback
                                        if (index + 1 == flips.length) {
                                            callback();
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }

        //function logic starts here with considerations for messages and flashes
        if (data.flips.length > 0) {
            //first bring all flips to surface (in order to avoid interferance with message
            data.flips.each(function(item, index) {
                gm.pb[item.p].card.toFront();
            });
            // if a rule with a message (2: same, 3: plus, 4: combo, 5: same wall)
            if (parseInt(data.rule) > 1 && parseInt(data.rule) < 6) {

                if (data.flash.length > 0) {
                    data.flash.each(function(flashIndex, index) {
                        gm.pb[flashIndex].rect = gm.canvas.rect(gm.pb[flashIndex].x, gm.pb[flashIndex].y, gm.cW, gm.cH, 10).attr({ 'fill': 'white', 'opacity': '0', 'stroke-width': '0' });
                        gm.pb[flashIndex].rect.animate({ opacity: 0.7 }, 200, "<", function() {
                            gm.pb[flashIndex].rect.animate({ opacity: 0 }, 200, ">", function() {

                                gm.pb[flashIndex].rect.remove();
                                gm.pb[flashIndex].rect = null;

                                basicFlip(data.flips);

                            });
                        });
                    });
                } else {
                    //if there are no flashes, go straight to flipping (as with combos)
                    basicFlip(data.flips);
                }

                var msg = gm.canvas.image('img/rules/' + data.rule + '.png', gm.pbp[0].x + gm.cW - (348 / 2), gm.pbp[0].y + gm.cH - (146 / 2), 348, 146).attr({ scale: 3, opacity: 0, rotation: 0 });
                msg.animate({ opacity: 1, scale: 1, rotation: 0 }, 300, ">", function() {
                    msg.animate({}, 200, function() { //hold for read
                        msg.animate({ opacity: 0, scale: .3, rotation: -720 }, 300, ">", function() {
                            msg.remove();
                            msg.node.destroy();
                        });
                    });
                });
            } else {
                //if there are no flashes (probably the basic rule)
                basicFlip(data.flips);
            }
        } else {
            //if there weren't any flips to perform, bail
            callback();
        }
    },
    drag: function(gm, evt) {
        //if a card has been picked up
        if ($defined(gm.dragging)) {
            //get card's current position
            var transMatrix = gm.dragging.card.node.getCTM();
            //using the saved point of origin from the last drag iteration, translate the card in the direction the mouse is moving
            gm.dragging.card.translate((evt.clientX - Number(transMatrix.e)) - gm.grapbpoint.x, (evt.clientY - Number(transMatrix.f)) - gm.grapbpoint.y);
            //save the point of origin of the card for the next drag iteration
            gm.grapbpoint.x = evt.clientX - Number(transMatrix.e);
            gm.grapbpoint.y = evt.clientY - Number(transMatrix.f);
        }
    },
    drop: function(item, dropItem, gm, evt, position) {
        //an extra check to be sure something is being dragged
        if ($defined(gm.dragging) && gm.isDroppable) {

            //reset the dragging flags
            gm.dragging = null;
            gm.isDroppable = false;

            //if dropItem is null, it means that the card was dropped in a non-playable area on the canvas
            // also fails when it is not player's turn. player can indeed modify this setting locally.. but we
            //redraw the board when the next player plays.
            if ($defined(dropItem) && gm.isMyTurn) {
                //the card was dropped on a playable area

                item.card.animate({ x: dropItem.x, y: dropItem.y, scale: 1 }, 300, function() {
                    item.card.toBack();
                });

                //register play with server
                new Request.JSON({
                    method: 'post',
                    url: 'gameData.aspx',
                    onComplete: function(x) {
                        //by removing the rect on the playing area we remove the ability to make another play in this area
                        dropItem.rect.remove();
                        dropItem.rect = null;



                        //x: json, item: obj from the player's hand, and callback
                        gm.dropResult(x, item, function() {
                            //end their turn locally
                            gm.activatePlayerTurn(false);
                        });
                    }
                }).send('254e36437e3b5d517a335e643f702b6728343074752f2c327d666c4747=' + gm.gameid +
                    '&c=596759567d50742f642c563e2773745e6c6d6c2b687948374c214c273a' +
                    '&4d257a3039732f622c21686c753239727a314b275f6b64436f356c6476=' + item.gameCardId +
                    '&3a64232b685f6745696145202a7247703d32262a31413358744b2f2b52=' + position);

            } else {
                //card was dropped in a non playable area of the canvas, return to deck                
                gm.drawPlayerOneHand(); //reposition cards (draws tofront from top to bottom)
                item.card.node.setAttributeNS(null, 'pointer-events', 'none'); //disable card while returning to deck

                item.card.animate({ x: item.x, y: item.y, rotation: 360, scale: 1 }, 300, ">", function() {
                    item.card.attr({ rotation: 0 });
                    item.card.node.setAttributeNS(null, 'pointer-events', 'all'); //return draggable properties
                });
            }
        }
    },
    dropResult: function(json, item, callback) {
        //this function is fired as a result of the player dropping a card and a server request (or game review) json data set is returned
        var gm = this;
        var position = parseInt(json.y);

        //move this card to the playboard
        gm.pb[position].card = item.card;
        gm.pb[position].gameCardId = item.gameCardId;
        gm.pb[position].image = item.image;

        //show modifier is elemental game and position has element

        if (gm.rules[6]) {
            if (parseInt(json.eb) != 0) {
                gm.pb[position].bonus = parseInt(json.eb);
                gm.drawBonusModifier(position);
            }
        }

        //remove array item for this card object from the player deck
        gm.p1h.erase(item);

        //redraw player one hand
        gm.drawPlayerOneHand();

        gm.flipCardsStage1(json.captures, 0, function() {

            //update scores
            gm.updateScores([json.p1s, json.p2s]);

            //fire callback
            callback();
        });

    },
    grab: function(item, gm, evt) {
        if (!$defined(gm.dragging)) {
            //grab

            item.card.toFront();
            item.card.node.setAttributeNS(null, 'pointer-events', 'none');
            var transMatrix = item.card.node.getCTM();
            gm.grapbpoint.x = evt.clientX - Number(transMatrix.e);
            gm.grapbpoint.y = evt.clientY - Number(transMatrix.f);
            gm.dragging = item;
            item.card.animate({ scale: 1.075 }, 300, function() {
                //since this card has been picked up, it can now be dropped
                gm.isDroppable = true;
                //this is set after the animation in order to prevent the canvas.onclick (drop event) from firing the same time the card is lifted.
            });
        }
    },
    endCondition: function() {
        var gm = this;
        var end = true;
        gm.pb.each(function(item, index) {
            if (item.gameCardId == -1) end = false;
        });
        return end;
    },
    enableBoard: function(enableBoard) {
        var gm = this;
        if (enableBoard) {
            gm.pb.each(function(item, index) {
                //turn on droppable actions
                if (item.rect) item.rect.node.setAttributeNS(null, 'pointer-events', 'all');
            });
        }
        else {
            gm.pb.each(function(item, index) {
                //turn off droppable actions
                if (item.rect) item.rect.node.setAttributeNS(null, 'pointer-events', 'none');
            });
        }
    },
    enableHand: function(enableHand) {
        var gm = this;
        if (enableHand) {
            gm.p1h.each(function(item, index) {
                if (item.card) item.card.node.setAttributeNS(null, 'pointer-events', 'all');
            });
        } else {
            gm.p1h.each(function(item, index) {
                if (item.card) item.card.node.setAttributeNS(null, 'pointer-events', 'none');
            });
        }
    },
    imagePreLoad: function(path) {
        //once a card has been revealed, a preload in its opponent deck color will reduce load time
        var gm = this;
        var x = new Image(gm.cW, gm.cH);
        x.src = path;
    },
    reviewGame: function() {
        //review game suspends current play under history animations are complete
        var gm = this;

        //if not already under review and it is currently the player's turn
        if (!gm.underReview && (gm.isMyTurn || gm.gameover)) {
            new Request.JSON({
                method: 'post',
                url: 'gameData.aspx',
                onComplete: function(x) {

                    //if a game history exists
                    if (x.iuakjwofljskjanwjofhngmnbxmnbxxmnbxjsoiwjkk.length > 0) {

                        //set global toggle
                        gm.underReview = true;
                        gm.enableBoard(false);
                        gm.enableHand(false);
                        //clear the turn marker since it could start on either side and we don't know its current pos
                        gm.turnMarker.remove();
                        gm.turnMarker = null;

                        gm.pb.each(function(item, index) {

                            //step through the cards known to be player one's and find them on the canvas
                            x.mnzbxcnbmncbzmxnbcmnbzxmnb.each(function(item2, index2) {
                                //if the gamecardid of the card on playboard matches that of one of player one's cards
                                if (item2.gcid == item.gameCardId) {
                                    //remove these cards from their place on the game board and put them back into the player's hand
                                    var p1hi = gm.p1h.length; //the index at which this card will be placed
                                    var card = item.card; //handle for the card obj
                                    gm.p1h.include(new Object({ gameCardId: item.gameCardId, image: item.image, card: item.card, x: gm.p1p[p1hi + 1].x, y: gm.p1p[p1hi + 1].y })); //add back to the player hand
                                    card.attr({ 'src': item2.z }); //change color back to original
                                    card.animate({ x: gm.p1p[p1hi + 1].x, y: gm.p1p[p1hi + 1].y, rotation: 360 }, 200 + (index * 100), ">", function() {
                                        card.attr({ rotation: 0 });
                                    }).toFront(); //toFront assures that cards dropped in a non-playable area return in the proper order

                                }
                            });

                            //step through the cards known to me player two's and put them back into the player's hand
                            x.kjhsadjhkaskjhdkjhasjhdasd.each(function(item2, index2) {
                                //if the gamecardid of the card on playboard matches that of one of player two's cards
                                if (item2.gcid == item.gameCardId) {
                                    //remove these cards from their place on the game board and put them back into the player's hand
                                    var p2hi = gm.p2h.length; //the index at which this card will be placed
                                    var card = item.card; //handle for the card obj
                                    gm.p2h.include(new Object({ gameCardId: item.gameCardId, image: item.image, card: item.card, x: gm.p2p[p2hi + 1].x, y: gm.p2p[p2hi + 1].y })); //add back to the player hand
                                    card.attr({ 'src': item2.z }); //change color back to original
                                    card.animate({ x: gm.p2p[p2hi + 1].x, y: gm.p2p[p2hi + 1].y, rotation: 360 }, 200 + (index * 100), ">", function() {
                                        card.attr({ rotation: 0 });
                                    }).toFront(); //toFront assures that cards dropped in a non-playable area return in the proper order
                                }
                            });

                            //the card HAD to be one of the player's cards, so clear the playboard of this card.
                            gm.pb[index].gameCardId = -1;
                            gm.pb[index].image = null;
                            gm.pb[index].card = null;
                            if ($defined(gm.pb[index].bonusObject)) {
                                gm.pb[index].bonusObject[0].remove();
                                gm.pb[index].bonusObject[1].remove();
                            }
                            gm.pb[index].bonusObject = null;
                        });

                        //reset the score
                        var us = function() {
                            gm.updateScores([5, 5]);
                        }
                        us.delay(1500);

                        //structures for replay:
                        var replay = function(historyIndex) {
                            if (!$defined(historyIndex)) historyIndex = 0; //on initial load, can't pass params with delay
                            //base case, for when all the histry steps are complete
                            if (historyIndex == x.iuakjwofljskjanwjofhngmnbxmnbxxmnbxjsoiwjkk.length) {

                                gm.underReview = false;
                                //if not a gameover, this review was conducted on player's turn. reenable the board and hand
                                if (!gm.gameover) {
                                    gm.enableHand(true);
                                }
                                gm.activatePlayerTurn(gm.isMyTurn); //resume game (handles if game over already;

                            } else {
                                var item = x.iuakjwofljskjanwjofhngmnbxmnbxxmnbxjsoiwjkk[historyIndex];
                                //if this is my own play
                                if (item.qoiqwoiudcoicnckbakjdjxjkjhcodf == 1) {
                                    gm.drawTurnMarker(true, function() {
                                        var obj = null; //handle for obj in player's hand
                                        gm.p1h.each(function(item2, index2) {
                                            if (item2.gameCardId == item.jijjijj.x) obj = item2;
                                        });
                                        if ($defined(obj)) {
                                            //move this card manually since the player would normally
                                            obj.card.toFront();
                                            obj.card.animate({ x: gm.pbp[0].x, y: gm.pbp[0].y, scale: 2 }, 300, ">", function() {
                                                obj.card.animate({}, 300 * 2, function() { //hold
                                                    obj.card.animate({ scale: 1, x: gm.pbp[parseInt(item.jijjijj.y) + 1].x, y: gm.pbp[parseInt(item.jijjijj.y) + 1].y, rotation: 720 }, 300, "<>", function() {
                                                        obj.card.attr({ rotation: 0 }).toBack();
                                                        //result that fires with response from server. the 'true' param indicates 'is for review'
                                                        gm.dropResult(item.jijjijj, obj, function() {
                                                            var go = function() { replay(historyIndex + 1) };
                                                            go.delay(gm.reviewSpeed);
                                                        });
                                                    });
                                                });
                                            });
                                        }
                                    });
                                } else {
                                    gm.drawTurnMarker(false, function() {
                                        gm.opponentPlay(item.jijjijj, function() {
                                            var go = function() { replay(historyIndex + 1) };
                                            go.delay(gm.reviewSpeed);
                                        });
                                    });
                                }

                            }

                        }
                        //start the replay delayed so that the cards returning to player hand animations can finish 
                        replay.delay(2000);
                    }
                }
            }).send('254e36437e3b5d517a335e643f702b6728343074752f2c327d666c4747=' + gm.gameid + '&c=453c6d283a3336597b2865437c6e7073734731542557753b6d3d3f4827');
        }
    }
});