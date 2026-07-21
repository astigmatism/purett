<?php

class AdminController extends Facebook_Controller_Action
{
    /**
     * init()
     *
     * This is the first method that gets invoked by the dispatch process.
     * Use this methods to set up instance variables that need to be shared
     * among all action methods.
     */
    public function init()
    {
        parent::init();
    }
    
    public function deleteUserAction() {
        //utility, disable later
        $this->user->deleteUser();
        die('user deleted');
    }
    
    public function opponentAction() {
        //utility, disable later
        
        $cards = PureTripleTriad_Game::getOpponentHand($this->user, $this->user->hand, true);
        foreach($this->user->hand as $card) {
            echo '<img src="/images/cards/'.base64_encode($this->user->options['color']).'/'.$card->image.'.png" />';
        }
        echo '<br/>';
        foreach($cards as $card) {
            echo '<img src="/images/cards/red/'.$card->image.'.png" />';
        }
        die();
    }
    
    public function getInfoAction() {
        phpinfo();
        die();
    }
    
    public function usersAction() {
        if (isset($_REQUEST['code']) && $_REQUEST['code'] == '1111') {
        
        } else {
            die();
        }
    }
    
    public function ruleScheduleAction() {
        for ($i = 0; $i < 300; $i++) {
            $result = array();
            $rules = PureTripleTriad_Game::getNextRules($i, 0, 0);
            foreach($rules as $rule) {
                array_push($result, $rule['name']);
            }
            echo $i .': '. implode(',', $result). '<br/>';
        }
        die();
    }
    
    /*
    public function setRecordAction() {
        $db = new PureTripleTriad_Database();
        $db->setUserRecord($this->user->userid, $_REQUEST['wins'], $_REQUEST['losses'], $_REQUEST['draws']);
        die();
    }
    */
    public function getshopAction() {
        $shopcards = PureTripleTriad_User::getShopStock($this->user, 8);
        foreach ($shopcards as $card) {
            echo '<img src="/images/cards/blue/'.$card->image.'.png" /><br/>player owns: '.$card->userowns.'<br/>'.$card->price.' credits<br/>';
        }
        die();
    }
    
    public function getApcOpcodeCacheStatusAction()
    {
        if (!function_exists('apc_cache_info')) {
            echo "APC is not installed properly.";
            die;
        }
        
        $result = apc_cache_info('');
        echo "<h1>Opcode Cache in APC</h1>";
        echo '<pre>' . print_r($result, true) . '</pre>';
        die;
    }
    
    public function getcardsAction() {
        $db = new PureTripleTriad_Database();
        $cards = $db->getCards();
        foreach($cards as $card) {
            echo 'elif x + 1 == '.$card['idcards'].':<br/>    name = \''.$card['image'].'\'<br/>';
        }
        die();
    }
    
    public function testTimeAction() {
        
        $minutesRemaining = (5 - date('i') % 5);
        $secondsRemaining = 300 - (date('s') + ((5 - $minutesRemaining) * 60)) % 300;
        
        
        
        echo date('s');
        echo 'seconds: '.$secondsRemaining;
        echo 'minutes: '. $minutesRemaining ;
        
        /*
        // Get the current time
        $now = time();
        
        // Get information about the current time
        $currentHour = date('H', $now); // "H" returns the current hour
        $currentMinute = date('i', $now); // "s" returns the current minute
        
        // Determine when the next half-hour is
        echo ($currentMinute) % 10;
        if ($currentMinute < 30) {
          $nextHalfHour = date($currentHour . ':30'); // String representation
          $nextHalfHour = strtotime($nextHalfHour); // Turn into an integer timestamp
        } else {
          $nextHalfHour = date(($currentHour + 1) . ':00'); // String representation
          $nextHalfHour = strtotime($nextHalfHour); // Turn into an integer timestamp
        }
        
        // Find the time between the current time and the next half hour
        $difference = $nextHalfHour - $now;
        
        // Echo the time left
        echo 'There are ';
        echo date('i', $difference) . ' minutes and '.date('s', $difference).' seconds until the next half-hour.';
        */
        die();
        
    }
}
?>