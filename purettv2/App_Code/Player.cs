using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;

public class Player
{
	public int userId;
    public string deckColor = "blue";
    public string name;

    protected Util util = (Util)HttpContext.Current.Session["Util"]; //Utility class

    public Player(int userId)
	{
        this.userId = userId;
        getPlayerInfo();
	}

    private void getPlayerInfo()
    {
        DataSet ds = util.getDataSet("getPlayerInfo", "@userId|" + userId);
        name = util.dsValue(ds, "Name");
    }
}
