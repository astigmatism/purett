using System;
using System.Data;
using System.Configuration;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.Web.UI.HtmlControls;
using System.Web.Caching;
using System.Collections;
using System.Data.SqlClient;

public class Util
{
    protected SqlConnection oConn;

    public Util()
    {
        oConn = new SqlConnection(ConfigurationManager.ConnectionStrings["TripleTriad"].ConnectionString);
    }
    
    public Game getGameCache(int gameId)
    {
        /*
        Game game = (Game)HttpRuntime.Cache["game:" + gameId.ToString()];

        if (game == null)
        {
            game = new Game(gameId);
            if (game != null)
                HttpRuntime.Cache.Insert("game:" + gameId.ToString(), game, null, DateTime.Now.AddDays(1), Cache.NoSlidingExpiration);
        }
        */
        return new Game(gameId);
    }

    public Hashtable getRules()
    {
        Hashtable rules = (Hashtable)HttpRuntime.Cache["rules"];

        if (rules == null)
        {
            rules = new Hashtable();
            DataSet ds = getDataSet("getRules", null);
            foreach (DataRow dr in ds.Tables[0].Rows)
            {
                rules.Add(dr["RuleName"].ToString(), new Rule(Convert.ToInt32(dr["RuleID"]), dr["RuleName"].ToString(), dr["Description"].ToString()));
            }

            if (rules != null)
                HttpRuntime.Cache.Insert("rules", rules, null, DateTime.Now.AddDays(1), Cache.NoSlidingExpiration);
        }
        return rules;
    }

    public Hashtable getElements()
    {
        Hashtable elements = (Hashtable)HttpRuntime.Cache["elements"];

        if (elements == null)
        {
            elements = new Hashtable();
            DataSet ds = getDataSet("getElements", null);
            foreach (DataRow dr in ds.Tables[0].Rows)
            {
                elements.Add(dr["ElementID"].ToString(), dr["Name"].ToString());
            }

            if (elements != null)
                HttpRuntime.Cache.Insert("elements", elements, null, DateTime.Now.AddDays(1), Cache.NoSlidingExpiration);
        }
        return elements;
    }

    public Hashtable createLocalRules()
    {
        Hashtable rules = new Hashtable();
        DataSet ds = getDataSet("getRules", null);
        foreach (DataRow dr in ds.Tables[0].Rows)
        {
            rules.Add(dr["RuleName"].ToString(), new Rule(Convert.ToInt32(dr["RuleID"]), dr["RuleName"].ToString(), dr["Description"].ToString()));
        }
        return rules;
    }

    public Player getPlayer(int userId)
    {
        Player player = (Player)HttpRuntime.Cache["player:" + userId.ToString()];

        if (player == null)
        {
            player = new Player(userId);
            if (player != null)
                HttpRuntime.Cache.Insert("player:" + player.ToString(), player, null, DateTime.Now.AddDays(1), Cache.NoSlidingExpiration);
        }
        return player;
    }

    public DataSet getDataSet(string sp, string param)
    {
        string[] pm = null;
        if (param != null)
        {
            pm = param.Split('|');
        }
        DataSet ds = new DataSet();
        SqlCommand oCmd = new SqlCommand();
        oCmd.Connection = oConn;
        oCmd.CommandType = CommandType.StoredProcedure;
        oCmd.CommandText = sp;
        SqlDataAdapter sa = new SqlDataAdapter();
        if (pm != null)
        {
            for (int i = 0; i < pm.Length; i++)
            {
                if (pm[i + 1] == "") //a null value
                    oCmd.Parameters.Add(new SqlParameter(pm[i], DBNull.Value));
                else
                    oCmd.Parameters.Add(new SqlParameter(pm[i], pm[i + 1]));
                i++;
            }
        }
        sa.SelectCommand = oCmd;
        sa.Fill(ds, sp);
        return ds;
    }

    public void execSp(string sp, string param)
    {
        string[] pm = null;
        if (param != null)
        {
            //param = param.Replace("'", "''");
            pm = param.Split('|');
        }
        SqlCommand oCmd = new SqlCommand(sp, oConn);
        oCmd.CommandType = CommandType.StoredProcedure;
        if (pm != null)
        {
            string paramName;
            string paramValue;
            for (int i = 0; i < pm.Length; i++)
            {
                paramName = pm[i];
                paramValue = pm[i + 1];

                if (paramValue == "")
                    oCmd.Parameters.Add(new SqlParameter(paramName, DBNull.Value));
                else
                    oCmd.Parameters.Add(new SqlParameter(paramName, paramValue));
                i++;
            }
        }
        oConn.Open();
        oCmd.ExecuteNonQuery();
        oConn.Close();
    }

    public bool validateDataSet(DataSet ds)
    {
        if (ds.Tables.Count == 0)
            return false;
        if (ds.Tables[0].Rows.Count == 0)
            return false;
        return true;
    }

    public string dsValue(DataSet ds, string field)
    {
        if (validateDataSet(ds))
        {
            foreach (DataColumn dc in ds.Tables[0].Columns)
                if (dc.ColumnName == field)
                    return ds.Tables[0].Rows[0][field].ToString();
        }
        return "No Data";
    }
}
