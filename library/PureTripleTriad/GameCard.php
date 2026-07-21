<?php
class PureTripleTriad_GameCard extends PureTripleTriad_UserCard {

    public $gamecardid;
    public $position;
    public $captured;
    public $elementbonus;
    
    function __construct($cardid, $usercardid, $userid, $strengthrank, $purchased, $gamecardid = null, $position = 0, $captured = null) 
    {
        parent::__construct($cardid, $usercardid, $userid, $strengthrank, $purchased);
        $this->captured     = (!$captured) ? $userid : $captured;
        $this->gamecardid   = $gamecardid;
        $this->position     = $position;
        $this->elementbonus = 0;
    }
}
?>