using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Summary description for AIGameCard
/// </summary>
public class AIGameCard
{
    public GameCard card;
    public int attackScore;
    public int defenseScore;
    public int wasteScore;

    public int attackPlayScore;
    public int defensePlayScore;

    public int flips;

	public AIGameCard(GameCard card, int attackScore, int defenseScore, int wasteScore, int flipScore) 
	{
        this.card = card;
        this.attackScore = attackScore;
        this.defenseScore = defenseScore;
        this.wasteScore = wasteScore;
        this.flips = flipScore;

        calculateAttackScore();
        calculateDefenseScore();
	}

    public void calculateAttackScore()
    {
        attackPlayScore = ((attackScore * 2) + defenseScore + (40 - wasteScore));
    }

    public void calculateDefenseScore()
    {
        defensePlayScore = (defenseScore * 2) + (40 - wasteScore);
    }
}
