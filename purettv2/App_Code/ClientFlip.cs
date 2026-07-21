using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Summary description for ClientFlip
/// </summary>
public class ClientFlip
{
    public int position;
    public int gameCardId;
    public Player player;
    public int rule;
    public int flipDirection;
    public string image;

    protected Util util = (Util)HttpContext.Current.Session["Util"]; //Utility class

	public ClientFlip(int rule, int gameCardId, int position, Player player, int flip, string image)
	{
        this.rule = rule;
        this.position = position;
        this.player = player;
        this.flipDirection = flip;
        this.image = image;
        this.gameCardId = gameCardId;
	}

    public string generateJson()
    {
        return "{\"p\":\"" + position + "\",\"t\":\"" + flipDirection + "\",\"i\":\"img/cards/" + player.deckColor + "/" + image + ".png\"},";
    }

    public void saveFlipToServer()
    {
        util.execSp("setGameCardCapture", "@gameCardId|" + gameCardId + "|@capturedBy|" + player.userId);
    }
}
