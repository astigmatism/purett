using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// A visitor is the top level class for a user
/// </summary>
public class Visitor
{
    public string sessionId;


	public Visitor(string sessionId)
	{
        this.sessionId = sessionId;
	}
}
