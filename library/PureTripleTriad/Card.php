<?php
class PureTripleTriad_Card {

    protected $db;
    public $cardid;
    public $n;
    public $e;
    public $s;
    public $w;
    public $level;
    public $element;
    public $name;
    public $image;
    public $strength;
    
    function __construct($cardid) 
    {
        $this->db = new PureTripleTriad_Database();

        $values = $this->db->getCard($cardid);
        if (!$values) {
            throw new InvalidArgumentException('Card not found.');
        }
        $this->cardid       = $cardid;
        $this->n            = $values['n'];
        $this->e            = $values['e'];
        $this->s            = $values['s'];
        $this->w            = $values['w'];
        $this->level        = $values['level'];
        $this->element      = $values['element'];
        $this->name         = $values['name'];
        $this->image        = $values['image'];
        $this->strength     = $values['strength'];
    }
    
    public function getRank($shortcut) {
        switch ($shortcut) {
            case 'n':   return $this->n;
            case 'e':   return $this->e;
            case 's':   return $this->s;
            case 'w':   return $this->w;
            default:    return null;
        }
    }
}
?>
