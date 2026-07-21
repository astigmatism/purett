using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Summary description for Guest
/// </summary>
public class Guest : Visitor
{
	public Guest(string sessionId) : base (sessionId)
	{
		
	}
}
