using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Collections;

public partial class _Default : System.Web.UI.Page
{

    protected Util util;
    Game game;
    string qs;

    protected void Page_Load(object sender, EventArgs e)
    {
        util = (Util)Session["Util"];


        game = util.getGameCache(13);

        if (Request.QueryString.Count > 0)
        {
            gameOptions(Request.QueryString[0].ToLower());
        }

        Page.RegisterStartupScript("startUp", "<script language=\"javascript\">var gameManager = new gameManager(13, " + game.updateClient() + ");</script>");

        //more.InnerHtml = game.showNextMove();
    }

    private void gameOptions(string qs)
    {
        //parse the query string
        string[] options = qs.Split(';');

        for (int i=0; i < options.Length; i++)
        {
            string[] parameter = options[i].Split(':');

            switch (parameter[0])
            {
                case "rules":
                    Hashtable rules = util.getRules(); //get rules hash

                    //clear current game rules
                    game.clearGameRules();

                    string[] toggles = parameter[1].Split(','); //separate each of the rule strings out
                    int[] ruleInts = new int[toggles.Length]; //create container for ruleid's
                    for (int j = 0; j < toggles.Length; j++)
                    {
                        toggles[j] = toggles[j].Trim();
                        if (((Rule)rules[toggles[j]]) != null)
                        {
                            game.addGameRule(((Rule)rules[toggles[j]]));
                        }
                    }
                    game = util.getGameCache(13);
                    break;
                case "boardelements":
                    game.setGameBoardElements(parameter[1]);
                    game = util.getGameCache(13);
                    break;
                case "level":
                    game.newRandomGameCards(Convert.ToInt32(parameter[1]));
                    break;
                case "reset":
                    game.resetGame();
                    Response.Redirect("/");
                    break;
            }
        }
    }
}
