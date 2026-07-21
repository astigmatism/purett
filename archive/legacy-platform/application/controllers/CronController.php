<?php

class CronController extends Gamehouse_Controller_Action
{
    public function init()
    {
        parent::init();
    }
    
    public function topPlayersAction() {
        
        if ($_REQUEST['code'] == '1111') {
            
            $db = new PureTripleTriad_Database();
            $db->saveTopPlayersThreeDays();
        } else if ($_REQUEST['code'] == '2222') {
            
            $redis = new PureTripleTriad_Redis();
            $result = $redis->getTopPlayersThreeDays();
            foreach($result as $a) {
                echo var_dump($a).'<br/>';
            }
        }
        
        die();
    }
}

?>