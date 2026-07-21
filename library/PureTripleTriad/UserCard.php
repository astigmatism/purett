<?php
class PureTripleTriad_UserCard extends PureTripleTriad_Card {

    public $strengthRank;       //Sometimes when building an opponent we want to make a card appear stronger or weaker than it really is
    public $owner;
    public $usercardid;
    public $purchased;
    
    function __construct($cardid, $usercardid, $userid, $strengthrank, $purchased) 
    {
        parent::__construct($cardid);
        $this->owner        = $userid;
        $this->usercardid   = $usercardid;
        $this->strengthRank = ($strengthrank == -1) ? $this->strength : $strengthrank;
        $this->purchased    = $purchased;
    }
}
?>
