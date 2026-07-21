using System;
using System.Data;
using System.Configuration;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.Web.UI.HtmlControls;

public class Card
{
    protected int cardId;               //the cardId from the card library
    public int north;
    public int east;
    public int south;
    public int west;
    public int[] values;                //an array of the above values for iteration
    protected int cardLevel;
    public string color = "red";        //a textual value for the current color of the card
    public int element = -1;            //the int representation of the cards element, -1 if no element
    public string imageName;
    public string name;

    protected Util util = (Util)HttpContext.Current.Session["Util"]; //Utility class

    public Card() { }

    public Card(string[] cardData)
    {
        this.cardId = Convert.ToInt32(cardData[0]);
        this.north = Convert.ToInt32(cardData[1]);
        this.east = Convert.ToInt32(cardData[2]);
        this.south = Convert.ToInt32(cardData[3]);
        this.west = Convert.ToInt32(cardData[4]);
        this.cardLevel = Convert.ToInt32(cardData[5]);
        this.element = !String.IsNullOrEmpty(cardData[6]) ? Convert.ToInt32(cardData[6]) : -1;
        this.imageName = cardData[7];
        this.name = cardData[8];

        this.values = new int[4] { this.north, this.east, this.south, this.west };
    }

    public string render(bool playable)
    {
        string div = "<div class=\"card " + (playable ? "playableCard" : "") + "\">";
        div += "<div class=\"border border" + cardLevel.ToString() + "\"></div>";
        div += "<div class=\"redCard\"></div>";
        //div += "<div class=\"cardCaption\" style=\"background: transparent url(img/cardCaptions/G" + cardId.ToString() + ".png) no-repeat top left;\"></div>";
        div += (this.element != -1) ? "<div class=\"element\" style=\"background: transparent url(img/cardElements/G" + element.ToString() + ".png) no-repeat top left;\"></div>" : "";
        div += "<div class=\"illustration\" style=\"background: transparent url(img/cardIllustrations/G" + cardId.ToString() + ".png) no-repeat top left;\"></div>";
        div += "<div class=\"cardValue cardValue" + north.ToString() + " cardValueNorth\"></div>";
        div += "<div class=\"cardValue cardValue" + east.ToString() + " cardValueEast\"></div>";
        div += "<div class=\"cardValue cardValue" + south.ToString() + " cardValueSouth\"></div>";
        div += "<div class=\"cardValue cardValue" + west.ToString() + " cardValueWest\"></div>";
        div += "</div>";
        //div += "<div>id: " + cardId + "<br/>name: " + name + "<br/>image: " + imageName + "<br/>level: " + cardLevel + "</div>";
        return div;
    }
}
