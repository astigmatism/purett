using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Summary description for Rule
/// </summary>
public class Rule
{
    public int ruleId;
    public string name;
    public string description;
    public bool active = false;      //used in local implementations for games

    protected Util util = (Util)HttpContext.Current.Session["Util"]; //Utility class

	public Rule(int ruleId)
	{
        //TODO: get rule data from db
	}

    public Rule(int ruleId, string name, string desc)
    {
        this.ruleId = ruleId;
        this.name = name;
        this.description = desc;
    }
}
