using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Summary description for GameCard
/// </summary>
public class GameCard : Card
{
    public int gameCardId;
    public int position;
    public int ownerId;
    public int capturedBy;

    public int elementalBonus;

    public GameCard() { }

	public GameCard(string[] cardData) : base (cardData)
	{
        //index 0-8 see card class
        this.gameCardId = Convert.ToInt32(cardData[9]);
        this.position = Convert.ToInt32(cardData[10]);
        this.ownerId = Convert.ToInt32(cardData[11]);
        this.capturedBy = Convert.ToInt32(cardData[12]);

        elementalBonus = 0;
	}
}
