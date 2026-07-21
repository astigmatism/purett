<?php
class Gamehouse_Session_SaveHandler extends Zend_Session_SaveHandler_DbTable
{
    public function __construct($db, $config)
    {
        $this->_setAdapter($db);
        parent::__construct($config);
    }
}
?>