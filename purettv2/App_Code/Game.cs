using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;
using System.Collections;

//The Game Class stores and processes information about a game session between player and computer

public class Game
{

    public int gameId;
    
    protected Player[] Players; //0 = playerOne, 1 = playerTwo
    protected int[] Score = new int[2] {0, 0};
    protected List<GameCard>[] PlayerHands = new List<GameCard>[2] { new List<GameCard>(), new List<GameCard>()};

    protected GameCard[] playBoard = new GameCard[9];
    protected int[] boardElements = new int[9];
    protected int elementBonus;
    protected Hashtable rules;
    
    public bool turn; //true = playerOne, false = playerTwo
    

    protected Util util = (Util)HttpContext.Current.Session["Util"]; //Utility class

	public Game(int gameId)
	{
        //build operations:
        this.gameId = gameId;
        this.getGameInfo();
        this.getGameCards();
        this.updateClient();
	}

    private void getGameInfo()
    {
        DataSet ds = util.getDataSet("getGameInfo", "@gameId|" + this.gameId);
        if (util.validateDataSet(ds))
        {
            Players = new Player[2] { util.getPlayer(Convert.ToInt32(util.dsValue(ds, "PlayerOne"))), util.getPlayer(Convert.ToInt32(util.dsValue(ds, "PlayerTwo"))) };

            //set deck colors
            Players[0].deckColor = util.dsValue(ds, "PlayerOneColor");
            Players[1].deckColor = util.dsValue(ds, "PlayerTwoColor");

            //set score
            Score[0] = Convert.ToInt32(util.dsValue(ds, "PlayerOneScore"));
            Score[1] = Convert.ToInt32(util.dsValue(ds, "PlayerTwoScore"));

            this.turn = Convert.ToBoolean(util.dsValue(ds, "Turn"));
            this.buildRules(ds.Tables[1]);

            this.buildElements(util.dsValue(ds, "BoardElements"));
            this.elementBonus = Convert.ToInt32(util.dsValue(ds, "ElementBonus"));
        }
    }

    private int getPlayerByUserId(int userId)
    {
        for (int i = 0; i < Players.Length; i++)
        {
            if (Players[i].userId == userId)
            {
                return i;
            }
        }
        return -1;
    }

    private void buildRules(DataTable dt)
    {
        rules = util.createLocalRules();
        foreach (DataRow dr in dt.Rows)
        {
            ((Rule)rules[dr["RuleName"].ToString()]).active = true;
        }
    }

    private void buildElements(string be)
    {
        //builds local structure for elementals placed on board, param comes from game db
        string[] bea = be.Split(',');
        for(int i=0; i < boardElements.Length; i++)
        {
            boardElements[i] = Convert.ToInt32(bea[i]);
        }
    }


    private void getGameCards()
    {
        DataSet ds = util.getDataSet("getGameCards", "@gameId|" + this.gameId);
        if (util.validateDataSet(ds))
        {
            foreach (DataRow dr in ds.Tables[0].Rows)
            {

                string[] cardData = {  
                    //card class data:
                    dr["CardID"].ToString(),
                    dr["North"].ToString(),
                    dr["East"].ToString(),
                    dr["South"].ToString(),
                    dr["West"].ToString(),
                    dr["Level"].ToString(),
                    dr["Element"].ToString(),
                    dr["Image"].ToString(),
                    dr["Name"].ToString(),
                    //game card data:
                    dr["GameCardID"].ToString(),
                    dr["Position"].ToString(),
                    dr["Owner"].ToString(),
                    dr["CapturedBy"].ToString() == DBNull.Value.ToString() ? "-1" : dr["CapturedBy"].ToString()

                };
                GameCard card = new GameCard(cardData);
                this.placeCard(card, Convert.ToInt32(dr["Position"]));
            }
        }
    }

    private void placeCard(GameCard card, int position)
    {
        switch (position)
        {
            case -2:
                this.PlayerHands[1].Add(card);
                break;
            case -1:
                this.PlayerHands[0].Add(card);
                break;
            default:
                //consider elemental bonuses if necessary
                if (((Rule)rules["elemental"]).active)
                {
                    if (boardElements[position] > -1)
                    {
                        if (boardElements[position] == card.element)
                        {
                            card.elementalBonus = this.elementBonus;
                        }
                        else
                        {
                            card.elementalBonus = this.elementBonus * -1;
                        }
                    }
                }
                this.playBoard[position] = card;
                break;
        }
    }

    public string showNextMove()
    {
        AI ai = new AI(Score[1], Score[0], rules, PlayerHands[1], playBoard, 9, Players[1].userId, boardElements, elementBonus);
        ai.decideMove();
        return ai.revealBestPossible();
    }

    public string updateClient()
    {
        //the purpose of this function is to create a json string which the client can use to render its game space.
        string response = "{";
        
        //json components:
        response += updateClientPlayerOne() + ",";
        response += updateClientPlayerTwo() + ",";
        response += updateClientPlayBoard() + ",";
        response += updateClientTurn() + ",";
        response += updateClientScores() + ",";
        response += updateClientRules();
            
        response += "}";
        return response;
    }

    private string updateClientRules()
    {
        string json = "\"sdflkjweoirukjsdlvkjsdlouwepojljklsdkl\":[";
        IDictionaryEnumerator en = rules.GetEnumerator();
        while (en.MoveNext())
        {
            if (((Rule)en.Value).active) {
                json += "{\"poiqwepoir\":\"" + ((Rule)en.Value).ruleId.ToString() + "\",\"fjklasdjklasfj\":\"" + ((Rule)en.Value).name.ToString() + "\",\"cbnmzxcbnmz\":\"" + ((Rule)en.Value).description.ToString() + "\"},";
            }
        }
        json = json.Remove(json.Length - 1, 1); //removes the last comma :P
        return json += "]";
    }

    private string updateClientScores()
    {
        return "\"lkjasdoiuqwekjadsflkjmnbxcvkhj\":\"" + Score[0] + "\",\"asdlkjqweoiuwervbirwaljdsbvlkjbl\":\"" + Score[1] + "\"";
    }

    private string updateClientTurn()
    {
        //must be wrapped in a json object
        //a small attempt to hide data. when playerOne's turn, the first value is checked at client.
        return "\"MotduJour\":\"" + (turn ? "6b3727315a68646d285c7873262d2e662167725e41213c65353621682b" : "235771522332643162456a567075366d4b7a2d345839242e462355524c") + "\"";
    }

    private string updateClientPlayerOne()
    {
        //must be wrapped in a json object
        string response = "\"fhjdspoqiuhdfjkvslaukrkdhflkhsz\":\"" + Players[0].name+ "\",\"mnsjkaiwbcbakjwifh\":\"" + Players[0].deckColor + "\",";
        response += "\"mnzbxcnbmncbzmxnbcmnbzxmnb\": [";
        for (int i = 0; i < PlayerHands[0].Count; i++)
        {
            response += "{\"gcid\":\"" + PlayerHands[0][i].gameCardId + "\",\"image\":\"" + "img/cards/" + Players[0].deckColor + "/" + PlayerHands[0][i].imageName + ".png\"}";
            if (i < PlayerHands[0].Count - 1) response += ",";
        }
        response += "]";
        return response;
    }

    private string updateClientPlayerTwo()
    {
        //must be wrapped in a json object

        string response = "\"jklasdoiuwqehcnskasjhr\":\"" + Players[1].name + "\",\"yqofhqoiwhfcoqhfcohq\":\"" + Players[1].deckColor + "\",";
        response += "\"kjhsadjhkaskjhdkjhasjhdasd\": [";
        for (int i = 0; i < PlayerHands[1].Count; i++)
        {
            string image = ((Rule)rules["open"]).active ? "img/cards/" + Players[1].deckColor + "/" + PlayerHands[1][i].imageName + ".png" : "img/cardBack.png";

            response += "{\"gcid\":\"" + PlayerHands[1][i].gameCardId + "\",\"image\":\"" + image + "\"}";
            if (i < PlayerHands[1].Count - 1) response += ",";
        }
        response += "]";
        return response;
    }

    private string updateClientPlayBoard()
    {
        //must be wrapped in a json object

        string response = "\"uyeiqowiutoiqyweiuyqwoiyro\": [";             
        for (int i = 0; i < playBoard.Length; i++)
        {
            response += "{";
            if (playBoard[i] != null)
            {
                string color = (playBoard[i].capturedBy != -1) ? Players[getPlayerByUserId(playBoard[i].capturedBy)].deckColor : Players[getPlayerByUserId(playBoard[i].ownerId)].deckColor;
                response += "\"gcid\":\"" + playBoard[i].gameCardId + "\",\"image\":\"img/cards/" + color + "/" + playBoard[i].imageName + ".png\",\"b\":\"" + playBoard[i].elementalBonus + "\",";
            }
            response += "\"e\":\"";
            response += (((Rule)rules["elemental"]).active) ? boardElements[i].ToString() : "-1";
            response += "\"}";
            if (i < playBoard.Length - 1) response += ",";
        }
        response += "]";
        return response;
    }

    public string opponentPlay()
    {
        AI ai = new AI(Score[1], Score[0], rules, PlayerHands[1], playBoard, 9, Players[1].userId, boardElements, elementBonus);
        //returns: 0: the game card id to be played, 1: the game board position to play it
        int[] makeMove = ai.decideMove();

        return play(makeMove[0], makeMove[1], 1);
    }

    public string play(int gameCardId, int position, int player)
    {
        string json = "{";

        json += "\"x\":\"" + gameCardId + "\",\"y\":\"" + position + "\",";

        //add played card to board
        GameCard c = null;
        foreach(GameCard gc in PlayerHands[player])
        {
            if (gc.gameCardId == gameCardId) c = gc;
        }

        //be sure we found the game card id in the player's hand and the playBoard position is clear
        if (c != null && playBoard[position] == null)
        {
            //return card String for closed games
            if (((Rule)rules["closed"]).active) json += "\"z\":\"img/cards/" + Players[player].deckColor + "/" + c.imageName + ".png\",";

            //register play with backend
            util.execSp("setGameCardPosition", "@gameCardId|" + gameCardId + "|@position|" + position);

            //if this is an elemental game, assign bonus here, before evaluating flips
            if (((Rule)rules["elemental"]).active && boardElements[position] != -1)
            {
                c.elementalBonus = (boardElements[position] == c.element) ? this.elementBonus : this.elementBonus * -1;
            }

            //remove from player hand
            PlayerHands[player].Remove(c);
            //add to gameboard, capture to self
            playBoard[position] = c;
            playBoard[position].capturedBy = Players[player].userId;

            //evaluate captures

            json += "\"captures\":[";
            json += evaluateAndFlip(c, position, player, false);
            json += "],";

            DataSet ds = util.getDataSet("setScore", "@gameId|" + gameId);
            json += "\"p1s\":\"" + util.dsValue(ds, "P1S") + "\",\"p2s\":\"" + util.dsValue(ds, "P2S") + "\"";

            //if an elemental game, return the modifier to the client for draw
            if (((Rule)rules["elemental"]).active) json += ",\"eb\":\"" + c.elementalBonus + "\"";
        
            //switch turns
            turn = (turn) ? false : true;
            util.execSp("setGameTurn", "@gameId|" + gameId + "|@turn|" + Convert.ToInt32(turn));

        }

        //close json
        json += "}";

        //record play in game history
        util.execSp("setGameHistory", "@gameId|" + gameId + "|@player|" + Players[player].userId + "|@turnData|" + json);

        return json;
    }

    public string evaluateAndFlip(GameCard c, int position, int player, bool combo)
    {
        //the returning array is an array of objects which define which rules cards were flipped by. It is structured thusly:
        //(this function also recurrses for combos which would return several arrays)
        /*
         *  
         * [
         *      {
         *          "rule":"0",
         *          "flash":[],
         *          "flips":
         *          [
         *              {"p":1, "t":1, "i":"img/cards/red/y.png"},
         *              {"p":3, "t":0, "i":"img/cards/red/x.png"}
         *          ]
         *      },
         *      {
         *          "rule":"2",
         *          "flash":[0, 1, 2],
         *          "flips":
         *          [
         *              {"p":4, "t":1, "i":"img/cards/red/y.png"},
         *              {"p":4, "t":0, "i":"img/cards/red/x.png"}
         *          ]
         *      },
         * ]        
         *
         * 
        */


        string json = "["; //this four point eval is an array of objects
        //this list will hold each of the rule flip objects
        List<string> jsonObjects = new List<string>();
        ClientFlip[] clientFlips = new ClientFlip[9];

        int northIndex = ((position - 3) < 0) ? -1 : position - 3;
        int eastIndex = position + 1;
        if (eastIndex == 3 || eastIndex == 6 || eastIndex == 9) eastIndex = -1; //these positions are against walls
        int southIndex = ((position + 3) > 8) ? -1 : position + 3;
        int westIndex = position - 1;
        if (westIndex == 2 || westIndex == 5) westIndex = -1; //these positions are against walls

        //additional strucures for other checks
        bool[] same = new bool[4] { false, false, false, false };
        int[,] sums = new int[4,2] { {0,0}, {0,0}, {0,0}, {0,0} }; //tracks pairs to sum later

        /* --- START BASIC AND ALL OTHER CHECKS --- */


        string basicString = "{\"rule\":" + ((combo) ? "4" : "0") + ",\"flash\":[],\"flips\":[";

        /* --- NORTH --- */
        if (northIndex != -1 && playBoard[northIndex] != null)
        {
            if (playBoard[northIndex].capturedBy != Players[player].userId)
            {
                //basic rule
                if ((c.north + (((Rule)rules["elemental"]).active ? c.elementalBonus : 0)) > (playBoard[northIndex].south + (((Rule)rules["elemental"]).active ? playBoard[northIndex].elementalBonus : 0)))
                {
                    clientFlips[northIndex] = new ClientFlip(0, playBoard[northIndex].gameCardId, northIndex, Players[player], 1, playBoard[northIndex].imageName);
                    if (combo)
                    {
                        clientFlips[northIndex].rule = 4;
                    }
                }
            }
            //same
            if (c.north == playBoard[northIndex].south) same[0] = true;
        }
        else
        {
            //same wall
            if (((Rule)rules["same wall"]).active && northIndex == -1 && c.north == 10) same[0] = true;
        }
        //plus
        if (northIndex != -1 && playBoard[northIndex] != null)
        {
            sums[0,0] = c.north;
            sums[0,1] = playBoard[northIndex].south;
        }

        /* --- EAST --- */
        if (eastIndex != -1 && playBoard[eastIndex] != null)
        {
            if (playBoard[eastIndex].capturedBy != Players[player].userId)
            {
                //basic rule
                if ((c.east + (((Rule)rules["elemental"]).active ? c.elementalBonus : 0)) > (playBoard[eastIndex].west + (((Rule)rules["elemental"]).active ? playBoard[eastIndex].elementalBonus : 0)))
                {
                    clientFlips[eastIndex] = new ClientFlip(0, playBoard[eastIndex].gameCardId, eastIndex, Players[player], 0, playBoard[eastIndex].imageName);
                    if (combo)
                    {
                        clientFlips[eastIndex].rule = 4;
                    }
                }
            }
            //same
            if (c.east == playBoard[eastIndex].west) same[1] = true;
        }
        else
        {
            //same wall
            if (((Rule)rules["same wall"]).active && eastIndex == -1 && c.east == 10) same[1] = true;
        }
        //plus
        if (eastIndex != -1 && playBoard[eastIndex] != null)
        {
            sums[1,0] = c.east;
            sums[1,1] = playBoard[eastIndex].west;
        }

        /* --- SOUTH ---*/
        if (southIndex != -1 && playBoard[southIndex] != null)
        {
            if (playBoard[southIndex].capturedBy != Players[player].userId)
            {
                //basic rule
                if ((c.south + (((Rule)rules["elemental"]).active ? c.elementalBonus : 0)) > (playBoard[southIndex].north + (((Rule)rules["elemental"]).active ? playBoard[southIndex].elementalBonus : 0)))
                {
                    clientFlips[southIndex] = new ClientFlip(0, playBoard[southIndex].gameCardId, southIndex, Players[player], 1, playBoard[southIndex].imageName);
                    if (combo)
                    {
                        clientFlips[southIndex].rule = 4;
                    }
                }
            }
            //same
            if (c.south == playBoard[southIndex].north) same[2] = true;
        }
        else
        {
            //same wall
            if (((Rule)rules["same wall"]).active && southIndex == -1 && c.south == 10) same[2] = true;
        }
        //plus
        if (southIndex != -1 && playBoard[southIndex] != null)
        {
            sums[2,0] = c.south;
            sums[2,1] = playBoard[southIndex].north;
        }

        /* --- WEST --- */
        if (westIndex != -1 && playBoard[westIndex] != null)
        {
            if (playBoard[westIndex].capturedBy != Players[player].userId)
            {
                //basic rule
                if ((c.west + (((Rule)rules["elemental"]).active ? c.elementalBonus : 0)) > (playBoard[westIndex].east + (((Rule)rules["elemental"]).active ? playBoard[westIndex].elementalBonus : 0)))
                {
                    clientFlips[westIndex] = new ClientFlip(0, playBoard[westIndex].gameCardId, westIndex, Players[player], 0, playBoard[westIndex].imageName);
                    if (combo)
                    {
                        clientFlips[westIndex].rule = 4;
                    }
                }
            }
            //same
            if (c.west == playBoard[westIndex].east) same[3] = true;
        }
        else
        {
            //same wall
            if (((Rule)rules["same wall"]).active && westIndex == -1 && c.west == 10) same[3] = true;
        }
        //plus
        if (westIndex != -1 && playBoard[westIndex] != null)
        {
            sums[3,0] = c.west;
            sums[3,1] = playBoard[westIndex].east;
            
        }

        //close up basic object
        //basicString += String.Join(",", basicFlipsList.ToArray()) + "]}"; 

        /* --- END BASIC AND ALL OTHER CHECKS--- */


        /* --- START PLUS --- */

        string plusString = "{\"rule\":3";
        string plusFlashes = "\"flash\":[" + position;

        if (((Rule)rules["plus"]).active && !combo)
        {
            //begin by checking list of sums for qualifiers
            bool[] qualify = new bool[4] { false, false, false, false }; //north, east, south, west
            for (int i = 0; i < 4; i++)
            {	
				//inner loop through the sums array
				for (int j = i + 1; j < 4; j++)
				{
					//in these inner 2d arrays, the first value is MY cards value, the second theirs
					int sumA = sums[i,0] + sums[i,1];
					int sumB = sums[j,0] + sums[j,1];
					
					//if these sums much, we have a plus
					//make sure the sum wasn't a sum of zeros, but actual values. the array defaults with zeros, so we don't want to trap these
					
					//latestly, observe both of my values in the sum. Were they the same number? If so, this isn't a plus match but a same match. Make sure this is a game with plus AND same though
					
					if (sumA == sumB && sumB > 0)
					{
						if (((Rule)rules["same"]).active && sums[i,0] != sums[j,0])
						{
							//same on, yet qualify
							qualify[i] = true;
							qualify[j] = true;
						} 
						else 
						{
							//same off, plus rule takes
							qualify[i] = true;
							qualify[j] = true;
						}
					}
				}
            }

            if (qualify[0])
            {
                //although its a qualifier for a flip, a card owned by me does not flip
                if (playBoard[northIndex].capturedBy != Players[player].userId)
                {
                    if (clientFlips[northIndex] == null)
                    {
                        clientFlips[northIndex] = new ClientFlip(3, playBoard[northIndex].gameCardId, northIndex, Players[player], 1, playBoard[northIndex].imageName);
                    }
                    else
                    {
                        clientFlips[northIndex].rule = 3;
                    }
                }
                plusFlashes += "," + northIndex;
            }
            if (qualify[1])
            {
                //although its a qualifier for a flip, a card owned by me does not flip
                if (playBoard[eastIndex].capturedBy != Players[player].userId)
                {
                    if (clientFlips[eastIndex] == null)
                    {
                        clientFlips[eastIndex] = new ClientFlip(3, playBoard[eastIndex].gameCardId, eastIndex, Players[player], 0, playBoard[eastIndex].imageName);
                    }
                    else
                    {
                        clientFlips[eastIndex].rule = 3;
                    }
                }
                plusFlashes += "," + eastIndex;
            }
            if (qualify[2])
            {
                //although its a qualifier for a flip, a card owned by me does not flip
                if (playBoard[southIndex].capturedBy != Players[player].userId)
                {
                    if (clientFlips[southIndex] == null)
                    {
                        clientFlips[southIndex] = new ClientFlip(3, playBoard[southIndex].gameCardId, southIndex, Players[player], 1, playBoard[southIndex].imageName);
                    }
                    else
                    {
                        clientFlips[southIndex].rule = 3;
                    }
                }
                plusFlashes += "," + southIndex;
            }
            if (qualify[3])
            {
                //although its a qualifier for a flip, a card owned by me does not flip
                if (playBoard[westIndex].capturedBy != Players[player].userId)
                {
                    if (clientFlips[westIndex] == null)
                    {
                        clientFlips[westIndex] = new ClientFlip(3, playBoard[westIndex].gameCardId, westIndex, Players[player], 0, playBoard[westIndex].imageName);
                    }
                    else
                    {
                        clientFlips[westIndex].rule = 3;
                    }
                }
                plusFlashes += "," + westIndex;
            }
            plusString += "," + plusFlashes + "],\"flips\":[";

        }
        /* --- END PLUS --- */


        /* --- START SAME --- */

        string sameString = "{\"rule\":2";
        string sameFlashes = "\"flash\":[" + position;

        if (((Rule)rules["same"]).active && !combo)
        {
            //begin by checking the evaluations above
            int ctr = 0;
            for (int i = 0; i < same.Length; i++)
            {
                if (same[i]) ctr++;
            }
            //if more than one same, flip sames
            if (ctr > 1)
            {

                if (same[0])
                {
                    //on the same wall rule, there wont be a card to flip
                    if (northIndex != -1)
                    {
                        if (playBoard[northIndex].capturedBy != Players[player].userId) //if the card evaluated in the same rule was already owned by the player, we don't want to flip it
                        {
                            if (clientFlips[northIndex] == null)
                            {
                                clientFlips[northIndex] = new ClientFlip(2, playBoard[northIndex].gameCardId, northIndex, Players[player], 1, playBoard[northIndex].imageName);
                            }
                            else
                            {
                                clientFlips[northIndex].rule = 2;
                            }
                        }
                        sameFlashes += "," + northIndex;
                    }
                }
                if (same[1])
                {
                    //on the same wall rule, there wont be a card to flip
                    if (eastIndex != -1)
                    {
                        if (playBoard[eastIndex].capturedBy != Players[player].userId) //if the card evaluated in the same rule was already owned by the player, we don't want to flip it
                        {
                            if (clientFlips[eastIndex] == null)
                            {
                                clientFlips[eastIndex] = new ClientFlip(2, playBoard[eastIndex].gameCardId, eastIndex, Players[player], 0, playBoard[eastIndex].imageName);
                            }
                            else
                            {
                                clientFlips[eastIndex].rule = 2;
                            }
                        }
                        sameFlashes += "," + eastIndex;
                    }
                }
                if (same[2])
                {
                    //on the same wall rule, there wont be a card to flip
                    if (southIndex != -1)
                    {
                        if (playBoard[southIndex].capturedBy != Players[player].userId) //if the card evaluated in the same rule was already owned by the player, we don't want to flip it
                        {
                            if (clientFlips[southIndex] == null)
                            {
                                clientFlips[southIndex] = new ClientFlip(2, playBoard[southIndex].gameCardId, southIndex, Players[player], 1, playBoard[southIndex].imageName);
                            }
                            else
                            {
                                clientFlips[southIndex].rule = 2;
                            }
                        }
                        sameFlashes += "," + southIndex;
                    }
                }
                if (same[3])
                {
                    //on the same wall rule, there wont be a card to flip
                    if (westIndex != -1)
                    {
                        if (playBoard[westIndex].capturedBy != Players[player].userId) //if the card evaluated in the same rule was already owned by the player, we don't want to flip it
                        {
                            if (clientFlips[westIndex] == null)
                            {
                                clientFlips[westIndex] = new ClientFlip(2, playBoard[westIndex].gameCardId, westIndex, Players[player], 0, playBoard[westIndex].imageName);
                            }
                            else
                            {
                                clientFlips[westIndex].rule = 2;
                            }
                        }
                        sameFlashes += "," + westIndex;
                    }
                }

                sameString += "," + sameFlashes + "],\"flips\":["; 
            }
        }

        /* --- END SAME --- */


        int[] ruleCtr = new int[4] { 0, 0, 0, 0 }; //same, plus, basic, combo

        foreach (ClientFlip cf in clientFlips)
        {
            if (cf != null)
            {
                switch (cf.rule)
                {
                    case 0: //basic rule
                        ruleCtr[2]++;
                        basicString += cf.generateJson();
                        break;
                    case 2: //same rule
                        ruleCtr[0]++;
                        sameString += cf.generateJson();
                        break;
                    case 3: //plus rule
                        ruleCtr[1]++;
                        plusString += cf.generateJson();
                        break;
                    case 4: //combo
                        ruleCtr[3]++;
                        basicString += cf.generateJson();
                        break;
                }

                //SAVE CAPTURES TO BACK END while tablating results

                cf.saveFlipToServer();
                playBoard[cf.position].capturedBy = Players[player].userId;
            }
        }

        if (ruleCtr[0] > 0)
        {
            json += sameString.Remove(sameString.Length - 1, 1) + "]}";
        }
        if (ruleCtr[1] > 0)
        {
            json += plusString.Remove(plusString.Length - 1, 1) + "]}";
        }
        if (ruleCtr[2] > 0 || ruleCtr[3] > 0)
        {
            json += basicString.Remove(basicString.Length - 1, 1) + "]}";
        }


        json += "]";

        //recurse for combo, be sure to add a comma to the end of json
        if (((Rule)rules["combo"]).active)
        {
            foreach (ClientFlip cf in clientFlips)
            {
                if (cf != null)
                {
                    switch (cf.rule)
                    {
                        case 2: //same rule
                            json += "," + evaluateAndFlip(playBoard[cf.position], cf.position, player, true);
                            break;
                        case 3: //plus rule
                            json += "," + evaluateAndFlip(playBoard[cf.position], cf.position, player, true);
                            break;
                        case 4: //combo rule
                            json += "," + evaluateAndFlip(playBoard[cf.position], cf.position, player, true);
                            break;
                    }
                }
            }
        }

        return json;
    }

    public string getGameHistory()
    {
        //this function returns a json structure detailing the origin of cards at game start and the play history that then occurred.
        string json = "{";

        //grab all the cards currently being used in this game
        DataSet ds = util.getDataSet("getGameCards", "@gameId|" + this.gameId);
        if (util.validateDataSet(ds))
        {

            //structure for player one
            json += "\"mnzbxcnbmncbzmxnbcmnbzxmnb\": [";

            foreach (DataRow dr in ds.Tables[0].Rows)
            {
                //look for cards that belong to player one (regardless of their capture state)
                if (Convert.ToInt32(dr["Owner"]) == Players[0].userId)
                {
                    json += "{\"gcid\":\"" + dr["GameCardID"].ToString() + "\",\"z\":\"" + "img/cards/" + Players[0].deckColor + "/" + dr["Image"].ToString() + ".png\"}";
                    json += ",";
                }
            }
            //remove last delimiter
            json = json.Substring(0,json.Length-1);
            json += "],";


            //structure for player two
            json += "\"kjhsadjhkaskjhdkjhasjhdasd\": [";

            foreach (DataRow dr in ds.Tables[0].Rows)
            {
                //look for cards that belong to player two (regardless of their capture state)
                if (Convert.ToInt32(dr["Owner"]) == Players[1].userId)
                {
                    json += "{\"gcid\":\"" + dr["GameCardID"].ToString() + "\",\"z\":\"" + "img/cards/" + Players[1].deckColor + "/" + dr["Image"].ToString() + ".png\"}";
                    json += ",";
                }
            }
            //remove last delimiter
            json = json.Substring(0, json.Length - 1);
            json += "],";
        }

        //game the game history
        ds = util.getDataSet("getGameHistory", "@gameId|" + this.gameId);
        if (util.validateDataSet(ds))
        {
            json += "\"iuakjwofljskjanwjofhngmnbxmnbxxmnbxjsoiwjkk\": [";
            foreach (DataRow dr in ds.Tables[0].Rows)
            {
                json += "{\"jijjijj\":" + dr["TurnData"].ToString();
                json += ",\"qoiqwoiudcoicnckbakjdjxjkjhcodf\":" + (Convert.ToInt32(dr["Player"]) == Players[0].userId ? '1' : '0');
                json += "},";
            }
            //remove last delimiter
            json = json.Substring(0, json.Length - 1);
            json += "]";
        }

        json += "}";
        return json;
    }

    public void resetGame()
    {
        util.execSp("resetGame", "@gameId|" + gameId);
    }

    public void clearGameRules()
    {
        util.execSp("clearGameRules", "@gameId|" + gameId);
    }

    public void addGameRule(Rule rule)
    {
        util.execSp("addGameRule", "@gameId|" + gameId + "|@ruleId|" + rule.ruleId);
    }

    public void setGameBoardElements(string set)
    {
        util.execSp("setGameBoardElements", "@gameId|" + gameId + "|@set|" + set);
    }

    public void newRandomGameCards(int level)
    {
        util.execSp("setGameCardsRandom", "@gameId|" + gameId + "|@level|" + level);
    }
}
