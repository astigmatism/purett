using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;

public partial class Library : System.Web.UI.Page
{
    protected Util util;

    protected void Page_Load(object sender, EventArgs e)
    {
        util = (Util)Session["Util"];

        DataSet ds = util.getDataSet("getCardLibrary", null);
        int ctr = 0;
        foreach (DataRow dr in ds.Tables[0].Rows)
        {
            if (ctr%6 == 0) playBoard.InnerHtml += "<div style=\"clear:both\"></div>";


            string[] cardData = {  
                    dr["CardID"].ToString(),
                    dr["North"].ToString(),
                    dr["East"].ToString(),
                    dr["South"].ToString(),
                    dr["West"].ToString(),
                    dr["Level"].ToString(),
                    dr["Element"].ToString(),
                    dr["Image"].ToString(),
                    dr["Name"].ToString()
                };
                Card card = new Card(cardData);

                playBoard.InnerHtml += card.render(false);

                ctr++;
        }


        /*
        member = (Member)Session["Member"];
        manager = (Manager)Session["Manager"];

        Game thisGame = manager.getGameCache(0);
        Page.RegisterStartupScript("startUp", "<script language=\"javascript\">var gm = new gm(0," + member.userId + "," + Convert.ToInt32(thisGame.isItMyTurn(member.userId)) + "," + thisGame.getPlayerNumber(member.userId) + "," + thisGame.playerOneScore + "," + thisGame.playerTwoScore + ");</script>");

        playerOneName.InnerHtml = thisGame.getPlayerName(1);
        playerTwoName.InnerHtml = thisGame.getPlayerName(2);

        playerOneDeck.InnerHtml = thisGame.renderHand(true, member.userId);
        playerTwoDeck.InnerHtml = thisGame.renderHand(false, member.userId);

        tablePosition0.InnerHtml = thisGame.renderGameBoard(0);
        tablePosition1.InnerHtml = thisGame.renderGameBoard(1);
        tablePosition2.InnerHtml = thisGame.renderGameBoard(2);
        tablePosition3.InnerHtml = thisGame.renderGameBoard(3);
        tablePosition4.InnerHtml = thisGame.renderGameBoard(4);
        tablePosition5.InnerHtml = thisGame.renderGameBoard(5);
        tablePosition6.InnerHtml = thisGame.renderGameBoard(6);
        tablePosition7.InnerHtml = thisGame.renderGameBoard(7);
        tablePosition8.InnerHtml = thisGame.renderGameBoard(8);

        //gameRulesString.InnerHtml = thisGame.getRulesString();
         * */

    }
}
