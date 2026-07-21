<?php
class PureTripleTriad_ShopCard extends PureTripleTriad_Card {

    public $price;
    public $userowns; //the number of this card the player owns in their hand/deck
    
    function __construct($cardid, $price, $userowns) 
    {
        parent::__construct($cardid);
        $this->price        = $price;
        $this->userowns     = $userowns;
    }
}
?>