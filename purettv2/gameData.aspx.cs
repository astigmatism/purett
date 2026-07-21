using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

public partial class gameData : System.Web.UI.Page
{
    string c;
    int gameId;
    protected Util util;

    Game game;


    protected void Page_Load(object sender, EventArgs e)
    {
        util = (Util)Session["Util"];
        c = Request.Form["c"]; //incoming case values are 256-bit for security purposes
        gameId = Convert.ToInt32(Request.Form["254e36437e3b5d517a335e643f702b6728343074752f2c327d666c4747"]);

        //TODO: perform security checks against gameId and player session information here

        
        game = util.getGameCache(gameId);

        //variables used locally
        int gameCardId = -1;
        int position = -1;

        switch (c)
        {
            //get opponet move requested by client
            case "3c3769475a492e444b4f24673173474375723e214d407b7a2a4f634652":

                Response.Write(game.opponentPlay());
                //sends to client: 
                /*
                 * {
                 *  x: gameCardId to play
                 *  y: gameBoard position to play in
                 *  capture: [
                 *      [{}, {}, {}] //an array of objects with flip data
                 *  ]
                 * }
                */

                break;
            
            //player has dropped a card for play
            case "596759567d50742f642c563e2773745e6c6d6c2b687948374c214c273a":

                gameCardId = Convert.ToInt32(Request.Form["4d257a3039732f622c21686c753239727a314b275f6b64436f356c6476"]);
                position = Convert.ToInt32(Request.Form["3a64232b685f6745696145202a7247703d32262a31413358744b2f2b52"]);

                //send play to game
                Response.Write(game.play(gameCardId, position, 0));

                break;

            //player has requested to view game history
            case "453c6d283a3336597b2865437c6e7073734731542557753b6d3d3f4827":
                Response.Write(game.getGameHistory());
                break;
        }
    }
}
