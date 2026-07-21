<%@ Page Title="" Language="C#" MasterPageFile="~/MasterPage.master" AutoEventWireup="true"
    CodeFile="Default.aspx.cs" Inherits="_Default" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
    <link rel="stylesheet" media="all" href="tt.css" type="text/css"></link>
    <script type="text/javascript" src="js/raphael.js"></script>
    <script type="text/javascript" src="js/fonts.js"></script>
    <script type="text/javascript" src="js/gameManager.js"></script>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="Server">
    
    <div id="playBoard">
        <div id="boardShadow_bottom"></div>
        <div id="boardShadow_left"></div>
        <div id="boardShadow_right"></div>
        <div id="boardShadow_top"></div>
        <div id="svgBoard"></div>
    </div>
    
    <div class="content_bg clear"> </div>
    <div class="content-tp">
        <div id="content">
           <div id="main">
                <h3>Random Match</h3>
                <a href="javascript: gameManager.reviewGame();">review game</a>
           </div>
        </div>
    </div>
    <div class="content_bottom_bg clear"> </div>
    
</asp:Content>
