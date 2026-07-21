using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Summary description for AI
/// </summary>
public class AI
{
    protected int myScore;
    protected int theirScore;
    protected Hashtable rules;
    protected List<GameCard> hand;
    protected GameCard[] playBoard;
    protected int[] boardElements;
    protected AIGameCard[] possiblePlays = new AIGameCard[9];
    protected int smartness;
    protected int me;               //the AI's userId
    protected int elementalBonus;

    protected List<AIGameCard>[] playBoardConsiderations = new List<AIGameCard>[9];

    public AI(int myScore, int theirScore, Hashtable rules, List<GameCard> hand, GameCard[] playBoard, int smartness, int userId, int[] be, int eb)
	{
        this.myScore = myScore;
        this.theirScore = theirScore;
        this.rules = rules;
        this.playBoard = playBoard;
        this.hand = hand;
        this.smartness = smartness;
        this.me = userId;
        this.boardElements = be;
        this.elementalBonus = eb;

        for (int i = 0; i < playBoardConsiderations.Length; i++)
        {
            playBoardConsiderations[i] = new List<AIGameCard>();
        }
	}

    public int[] decideMove()
    {
        //randomly choose a place on the board to start checking for open places:
        Random random = new Random();
        int startPoint = random.Next(8); //get 0-8

        //consider a card placement at only the number of places on a board 
        int considered = smartness;

        for (int j = 0; j < 9; j++)
        {
            int i = ((j + startPoint) > 8) ? (j + startPoint) - 9 : j + startPoint;


            //continue to next board place if we can consider more places AND if position on board is available for play
            if (considered > 0 && playBoard[i] == null)
            {

                //consider each card in hand for this position
                foreach (GameCard c in hand)
                {
                    int[] scores = new int[4] {0, 0, 0, 0}; //attack, defense, waste, flips

                    /* --- BASIC RULE --- */
                    scores = sumSameSizeArrays(basicRule(i, c), scores); //get scoring for basic rule
                    /* --- SAME RULE --- */
                    if (((Rule)rules["same"]).active) //consider scores for "same" rule if active
                    {
                        scores = sumSameSizeArrays(sameRule(i, c), scores);
                    }
                    /* --- PLUS RULE --- */
                    if (((Rule)rules["same"]).active) //consider scores for the "plus"
                    {
                        scores = sumSameSizeArrays(plusRule(i, c), scores);
                    }

                    //add to array for consideration later once we have results from all possibilities
                    playBoardConsiderations[i].Add(new AIGameCard(c, scores[0], scores[1], scores[2], scores[3]));

                }

                considered--;
            }
        }

        //run through collected results for consideration:
        for (int i = 0; i < playBoardConsiderations.Length; i++)
        {
            if (playBoardConsiderations[i].Count != 0) //if we have a list with card considerations
            {
                //set up variable for what will eventually be the best possible play for this board position
                AIGameCard bestPlay = null;

                //consider defenseive plays first, will always get set
                foreach (AIGameCard c in playBoardConsiderations[i])
                {
                    if (bestPlay == null)
                    {
                        bestPlay = c;
                    }
                    else
                    {
                        if (c.defensePlayScore > bestPlay.defensePlayScore)
                        {
                            bestPlay = c;
                        }
                    }
                }

                //consider agressive plays:
                //to consider an aggresive 1 card flip play, score must be even or down
                if (myScore <= theirScore)
                {
                    bool flips = false;
                    //before we consider an aggressive play, check to see if there are any definite flips
                    foreach (AIGameCard c in playBoardConsiderations[i])
                    {
                        if (c.flips > 0)
                        {
                            flips = true;
                            break;
                        }
                    }
                    //if no flips found, despite lose or tie situation, play defensively nonetheless (with card chosen above)
                    //if flips found, clear best card and find new one
                    if (flips)
                    {
                        foreach (AIGameCard c in playBoardConsiderations[i])
                        {
                            //if more flips than current best or better attack rating with same flips
                            if (c.flips > bestPlay.flips || (c.flips == bestPlay.flips && c.defensePlayScore > bestPlay.defensePlayScore))
                            {
                                bestPlay = c;
                            }
                        }
                    }
                }

                //consider power plays last since they have the highest importance (and will override the above)
                //a power play is simply a play at involves more than one flip
                bool powerFlips = false;
                foreach (AIGameCard c in playBoardConsiderations[i])
                {
                    if (c.flips > 1)
                    {
                        powerFlips = true;
                        break;
                    }
                }
                if (powerFlips)
                {
                    foreach (AIGameCard c in playBoardConsiderations[i])
                    {
                        //if more flips than current best or better defense rating with same flips
                        if (c.flips > bestPlay.flips || (c.flips == bestPlay.flips && c.defensePlayScore > bestPlay.defensePlayScore))
                        {
                            bestPlay = c;
                        }
                    }
                }
                //assign the card we found to be the best possible play for this open position
                possiblePlays[i] = bestPlay;
            }
        }


        int[] myBestPlay = decideBestPlay();


        return new int[2] { myBestPlay[0], myBestPlay[1] };
    }

    private int[] decideBestPlay()
    {
        AIGameCard bestPlay = null;
        int position = 0;

        for (int i = 0; i < possiblePlays.Length; i++)
        {
            //if a bestPlay card has been assigned for eval AND a card is playable in the board area in suggestion
            if (bestPlay != null && possiblePlays[i] != null)
            {
                //the logic here is the same as above. the only reason it doesn't share a function is because the above is a collection and this
                //is an array, necessary for taking the index

                //consider defenseive plays first, will always get set
                for(int j = 0; j < possiblePlays.Length; j++)
                {
                    if (possiblePlays[j] != null && possiblePlays[j].defensePlayScore > bestPlay.defensePlayScore)
                    {
                        bestPlay = possiblePlays[j];
                        position = j;
                    }
                }

                //consider agressive plays:
                //to consider an aggresive 1 card flip play, score must be even or down
                if (myScore <= theirScore)
                {
                    bool flips = false;
                    //before we consider an aggressive play, check to see if there are any definite flips
                    for (int j = 0; j < possiblePlays.Length; j++)
                    {
                        if (possiblePlays[j] != null && possiblePlays[j].flips > 0)
                        {
                            flips = true;
                            break;
                        }
                    }
                    //if no flips found, despite lose or tie situation, play defensively nonetheless (with card chosen above)
                    //if flips found, clear best card and find new one
                    if (flips)
                    {
                        for (int j = 0; j < possiblePlays.Length; j++)
                        {
                            //if more flips than current best or better attack rating with same flips
                            if (possiblePlays[j] != null && (possiblePlays[j].flips > bestPlay.flips || (possiblePlays[j].flips == bestPlay.flips && possiblePlays[j].defensePlayScore > bestPlay.defensePlayScore)))
                            {
                                bestPlay = possiblePlays[j];
                                position = j;
                            }
                        }
                    }
                }

                //consider power plays last since they have the highest importance (and will override the above)
                //a power play is simply a play at involves more than one flip
                bool powerFlips = false;
                for (int j = 0; j < possiblePlays.Length; j++)
                {
                    if (possiblePlays[j] != null && possiblePlays[j].flips > 1)
                    {
                        powerFlips = true;
                        break;
                    }
                }
                if (powerFlips)
                {
                    for (int j = 0; j < possiblePlays.Length; j++)
                    {
                        //if more flips than current best or better attack rating with same flips
                        if (possiblePlays[j] != null && (possiblePlays[j].flips > bestPlay.flips || (possiblePlays[j].flips == bestPlay.flips && possiblePlays[j].defensePlayScore > bestPlay.defensePlayScore)))
                        {
                            bestPlay = possiblePlays[j];
                            position = j;
                        }
                    }
                }

            }
            //first possible chance to play a card, assign it for comparison against the rest
            if (possiblePlays[i] != null && bestPlay == null)
            {
                bestPlay = possiblePlays[i];
                position = i;
            }
        }

        return new int[2] { bestPlay.card.gameCardId, position };
    }

    private int[] basicRule(int position, GameCard c)
    {
        int a; //an attack score against the adjacent cards
        int d; //a defense score if the adjacent areas are open
        int b; //if the adjacent areas are a wall or cards owned by you, this score determines the "wasted" effect of those values
        int f; //if the actions results in a flip, take it.

        //adjust the elemental monus for this position
        int originalBonus = c.elementalBonus;
        if (((Rule)rules["elemental"]).active)
        {
            if (boardElements[position] > -1)
            {
                if (boardElements[position] == c.element)
                {
                    c.elementalBonus = this.elementalBonus;
                }
                else
                {
                    c.elementalBonus = this.elementalBonus * -1;
                }
            }
        }


        int northIndex = ((position - 3) < 0) ? -1 : position - 3;
        int eastIndex = position + 1;
        if (eastIndex == 3 || eastIndex == 6 || eastIndex == 9) eastIndex = -1; //these positions are against walls
        int southIndex = ((position + 3) > 8) ? -1 : position + 3;
        int westIndex = position - 1;
        if (westIndex == 2 || westIndex == 5) westIndex = -1; //these positions are against walls

        int[] northScores = getBasicScores(c, northIndex, 0, 2); //0 = your north, 2 = their south
        int[] eastScores = getBasicScores(c, eastIndex, 1, 3); //0 = your east, 2 = their west
        int[] southScores = getBasicScores(c, southIndex, 2, 0); //0 = your south, 2 = their north
        int[] westScores = getBasicScores(c, westIndex, 3, 1); //0 = your west, 2 = their east

        //sum
        a = northScores[0] + eastScores[0] + southScores[0] + westScores[0];
        d = northScores[1] + eastScores[1] + southScores[1] + westScores[1];
        b = northScores[2] + eastScores[2] + southScores[2] + westScores[2];
        f = northScores[3] + eastScores[3] + southScores[3] + westScores[3];

        c.elementalBonus = originalBonus;

        return new int[4] { a, d, b, f };
    }

    private int[] getBasicScores(GameCard c, int boardIndex, int yourValueIndex, int theirValueIndex)
    {
        int a = 0;  //an attack score against the adjacent card
        int d = 0;  //a defense score if the adjacent area is open
        int b = 0; //if the adjacent area is a wall or owned by you, this score determines the "wasted" effect of those values
        int f = 0;

        //if board Index was -1, it indicates that the position for evaluation was against a wall
        if (boardIndex != -1)
        {
            //a null index indicates the position adjacent is open 
            if (playBoard[boardIndex] == null)
            {
                d = c.values[yourValueIndex] * 2; //mutiplying by two gives greater importance to higher values when grading on a linear scale
            }
            //a card was found adjacently
            else
            {
                //check if the adjacent card is own, if so, its another wall
                if (playBoard[boardIndex].capturedBy == me)
                {
                    b = c.values[yourValueIndex] * 2;
                    d = 20; //walls mean maximum defense because card is not exposed
                }
                //card is not yours, consider for attack
                else
                {
                    int yourValue = c.values[yourValueIndex];
                    int theirValue = playBoard[boardIndex].values[theirValueIndex];

                    //consider elemental properties, if necessary
                    if (((Rule)rules["elemental"]).active)
                    {
                        yourValue += c.elementalBonus;
                        theirScore += playBoard[boardIndex].elementalBonus;
                    }

                    //if your card beats theirs, you have a flip. 
                    if (yourValue > theirValue)
                    {
                        //a better sleip could exist with another card, so generate a score based on the relative values
                        // we don't want to reward 'A' for flipping a '2'
                        a = (10 - (c.values[yourValueIndex] - playBoard[boardIndex].values[theirValueIndex])) * 2;
                        f++;
                        d = 20; //a flip also represents a wall, hence defense
                    }
                    //your card CANT flip theirs, another defensive wall really
                    else
                    {
                        b = c.values[yourValueIndex] * 2;
                        d = 20;
                    }
                }
            }
        }
        //board index is 0 indictaing adjacent is a wall, evaluate b only
        else
        {
            b = c.values[yourValueIndex] * 2; //mutiplying by two gives greater importance to higher values when grading on a linear scale
            d = 20; //walls mean maximum defense because card is not exposed
        }

        return new int[4] {a, d, b, f};
    }

    private int[] sameRule(int position, GameCard c)
    {
        //the same rule considers properties of attack only

        int northIndex = ((position - 3) < 0) ? -1 : position - 3;
        int eastIndex = position + 1;
        if (eastIndex == 3 || eastIndex == 6 || eastIndex == 9) eastIndex = -1; //these positions are against walls
        int southIndex = ((position + 3) > 8) ? -1 : position + 3;
        int westIndex = position - 1;
        if (westIndex == 2 || westIndex == 5) westIndex = -1; //these positions are against walls

        //we'll check for "sameness" at each location and store the result in a list which we can check against
        bool[] results = new bool[4] {false, false, false, false};

        if (northIndex != -1 && playBoard[northIndex] != null && playBoard[northIndex].south == c.north) results[0] = true;
        if (eastIndex != -1 && playBoard[eastIndex] != null && playBoard[eastIndex].west == c.east) results[1] = true;
        if (southIndex != -1 && playBoard[southIndex] != null && playBoard[southIndex].north == c.south) results[2] = true;
        if (westIndex != -1 && playBoard[westIndex] != null && playBoard[westIndex].east == c.west) results[3] = true;


        //SAME WALL
        if (((Rule)rules["same wall"]).active)
        {
            //the same wall rule gives wall's a value of "A".
            if (northIndex == -1 && c.north == 10) results[0] = true;
            if (eastIndex == -1 && c.east == 10) results[1] = true;
            if (southIndex == -1 && c.south == 10) results[2] = true;
            if (westIndex == -1 && c.west == 10) results[3] = true;
        }

        //count totals
        int flips = 0;
        int score = 0;
        for (int i = 0; i < results.Length; i++)
        {
            if (results[i]) flips++;
        }
        if (flips > 1) //2 or more
        {
            //SAME WALL
            if (((Rule)rules["same wall"]).active)
            {
                //with the same wall, we didn't actually flip the wall, so remove those now
                if (northIndex == -1 && c.north == 10) flips--;
                if (eastIndex == -1 && c.east == 10) flips--;
                if (southIndex == -1 && c.south == 10) flips--;
                if (westIndex == -1 && c.west == 10) flips--;
            }

            score = flips * 10;
        }
        //if we didn't have at least two flips, no captures :(
        else
        {
            score = 0;
            flips = 0;
        }
        //give the same attack score of 10
        return new int[4] { score, 0, 0, flips };
    }

    private int[] plusRule(int position, GameCard c)
    {
        //the plus rule considers properties of attack only

        int northIndex = ((position - 3) < 0) ? -1 : position - 3;
        int eastIndex = position + 1;
        if (eastIndex == 3 || eastIndex == 6 || eastIndex == 9) eastIndex = -1; //these positions are against walls
        int southIndex = ((position + 3) > 8) ? -1 : position + 3;
        int westIndex = position - 1;
        if (westIndex == 2 || westIndex == 5) westIndex = -1; //these positions are against walls

        //so we're basically looking for adjacent cards which share the same sum as two or more of my card. 
        //this rule can flip up to 4 cards that share the same sum or simply two different sums
        //cards that I've already captured are figured into the equation

        int[] sums = new int[4] { -1, -1, -1, -1 };

        //calculate sums. plus does not sum same values. that it what the same rule is for.

        if (northIndex != -1 && playBoard[northIndex] != null && c.north != playBoard[northIndex].south) sums[0] = c.north + playBoard[northIndex].south;
        if (eastIndex != -1 && playBoard[eastIndex] != null && c.east != playBoard[eastIndex].west) sums[1] = c.east + playBoard[eastIndex].west;
        if (southIndex != -1 && playBoard[southIndex] != null && c.south != playBoard[southIndex].north) sums[2] = c.south + playBoard[southIndex].north;
        if (westIndex != -1 && playBoard[westIndex] != null && c.west != playBoard[westIndex].east) sums[3] = c.west + playBoard[westIndex].east;

        bool[] qualify = new bool[4] { false, false, false, false };
        //with sums collected, compare results
        for (int i = 0; i < sums.Length; i++)
        {
            if (sums[i] > 0)
            {
                for (int j = i + 1; j < sums.Length; j++)
                {
                    if (sums[i] == sums[j] && sums[j] > 0) //if one of the next values matches
                    {
                        qualify[i] = true;
                        qualify[j] = true;
                    }
                }
            }
        }
        int flips = 0;
        GameCard[] aroundIt = new GameCard[4] { 
            (northIndex != -1 && playBoard[northIndex] != null) ? playBoard[northIndex] : null, 
            (eastIndex != -1 && playBoard[eastIndex] != null) ? playBoard[eastIndex] : null, 
            (southIndex != -1 && playBoard[southIndex] != null) ? playBoard[southIndex] : null, 
            (westIndex != -1 && playBoard[westIndex] != null) ? playBoard[westIndex] : null };
        //check that qualifying plus flips are owned by me already (and wouldn't count)
        for (int i = 0; i < qualify.Length; i++)
        {
            if (qualify[i] && aroundIt[i] != null && aroundIt[i].capturedBy != me) flips++;
        }

        return new int[4] { flips * 10, 0, 0, flips };

    }

    private int[] sumSameSizeArrays(int[] a, int[] b)
    {
        int[] x = new int[a.Length];
        for (int i = 0; i < a.Length; i++)
        {
            x[i] = a[i] + b[i];
        }
        return x;
    }

    public string revealBestPossible()
    {
        string x = "";
        for(int i = 0; i < possiblePlays.Length; i++)
        {
            if (possiblePlays[i] != null)
            {
                x += "<br/><br/>BOARD POSITION: " + (i+1) + "<br/>";
                x += possiblePlays[i].card.render(false);
                x += "a: " + possiblePlays[i].attackScore + " d:" + possiblePlays[i].defenseScore + " b:" + possiblePlays[i].wasteScore;
                x += "<br/>FLIPS: " + possiblePlays[i].flips;
                x += "<br/>attack: " + possiblePlays[i].attackPlayScore;
                x += "<br/>defense: " + possiblePlays[i].defensePlayScore;
                x += "<div \"styles\"=\"clear:both\"></div>";
            }
        }
        return x;
    }
}
