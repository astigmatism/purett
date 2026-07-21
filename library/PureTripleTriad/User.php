<?php
class PureTripleTriad_User {

    protected $db;
    public $userid;
    public $profile;
    
    public $hand = array();     //cards player is holding (using)
    public $deck = array();     //cards player is not using
    
    public $optioncollection = array(); //a collection of all the users options
    public $options = array();  //user options that are enabled
    public $colors = array();   //deck colors available to this user
    
    public $wins;
    public $losses;
    public $draws;
    
    public $ingame = 0;         //will hold gameid when in game
    
    function __construct($userid, $profile = null)
    {
        $this->db = new PureTripleTriad_Database();

        if (!ctype_digit((string) $userid) || (int) $userid < 2) {
            throw new InvalidArgumentException('A valid local user ID is required.');
        }
        $user = $this->db->getUser($userid);
        if (!$user || $user['deleted_at'] !== null) {
            throw new RuntimeException('Local account not found.');
        }

        if ($profile === null) {
            $profile = $this->db->getLocalAccountByUserId($userid);
        }

        $this->userid   = (int) $userid;
        $this->profile  = array(
            'id' => (int) $userid,
            'display_name' => $profile ? $profile['display_name'] : 'Player',
            'email' => $user['email']
        );
        $this->wins     = $user['wins'];
        $this->losses   = $user['losses'];
        $this->draws    = $user['draws'];
        
        $this->ingame   = $this->db->inGame($userid);
        $this->buildUserOptions();
        
        $this->buildCards();
    }
    
    public function getTurns() {
        return $this->db->getTurns($this->userid);
    }
    
    public function decrementTurn() {
        return $this->db->decrementTurn($this->userid);
    }
    
    private function buildCards() {
        $this->deck = array();
        $this->hand = array();
        $cards = $this->db->getUserCards($this->userid);
        foreach ($cards as $card) {
            if ($card['inhand'] == 1) {
                array_push($this->hand, new PureTripleTriad_UserCard($card['idcards'], $card['idusercards'], $this->userid, $card['strengthrank'], $card['purchased']));
            } else {
                array_push($this->deck, new PureTripleTriad_UserCard($card['idcards'], $card['idusercards'], $this->userid, $card['strengthrank'], $card['purchased']));
            }
        }
    }
    
    private function buildUserOptions() {
        $this->colors = array();
        $this->options = array();

        //set defaults
        $this->options['color'] = 'blue';
        array_push($this->colors, 'blue');
        
        //get user options, override defaults -- seems like we can put it in cache?
        $this->optioncollection = $this->db->getUserOptions($this->userid);
        foreach($this->optioncollection as $option) {
            if ($option['active'] == 1) {
                $this->options[$option['name']] = $option['value'];
            }
            //keep track of all colors this user owns
            if ($option['name'] == 'color') {
                array_push($this->colors, $option['value']);
            }
        }
        $this->colors = array_values(array_unique($this->colors));
    }
    
    public function deleteUser() {
        $path = GAMEHISTORY_PATH . '/' . (int) $this->userid;
        $this->db->removeUser($this->userid);
        if (is_dir($path)) {
            $this->deleteAll($path);
        }
    }
    
    public static function getHandStrength($hand) {
        
        //hand is passed in because game can contain either player's actual hand, or a random selection of cards (from random rule)
        
        $strength = 0;
        $count = 0;
        $max = 0;
        $min = 10;
        foreach ($hand as $card) {
            $strength   += $card->strengthRank;     //rememner that this isnt just the card's strength, it is precieved strength :)
            $count      += $card->level;
            $max        = ($card->level > $max ? $card->level : $max);
            $min        = ($card->level < $min ? $card->level : $min);
        }
        return array(
            'strength'      => $strength,
            'levelcount'    => $count, 
            'max'           => $max, 
            'min'           => $min
        );
    }
    
    public function getWinLossPerc() {
        if (($this->wins + $this->losses + $this->draws) > 5) //for first five games, balance in player's favor to allow them possibility to win more
        {
            if ($this->wins > 0) {
                return ($this->wins / ($this->wins + $this->losses));
            }
            return 0;
        }
        return 0.4;
    }
    
    public function getRandomNewCardByLevel($level, $array, $trynew = true) {
        //$trynew says = we should look through $array for a card that don't already have
        $cards = $this->db->getCardsByLevel($level);
        shuffle($cards);
        if ($trynew) {
            foreach($cards as $card) {
                if (!$this->propertyValueInArray($array, 'cardid', $card['idcards'])) {
                    return $card['idcards'];
                }
            }
        }
        //user has all cards from this level, give them another at random
        if (empty($cards)) {
            throw new RuntimeException('No cards exist for requested level.');
        }
        return $cards[0]['idcards'];
    }
    
    public function getRandomNewCardByStrength($strength, $array) {
        //this function is primarily for building opponent decks, the edge cases are not tested for players
        $cards = $this->db->getCardsByStrength($strength);
        shuffle($cards);
        foreach($cards as $card) {
            if (!$this->propertyValueInArray($array, 'cardid', $card['idcards'])) {
                return $card['idcards'];
            }
        }
        if ($strength < 29) { //29 is max, if we've reached this spot, then the user has all lvl 29 cards 
            return $this->getRandomNewCardByStrength($strength + 1, $array); //if all cards of this strength are in array, jump to next strength and try again
        }
        //when all else fails, start dropping strength :P (this case occurs at the end because there are only 4 cards with str 29)
        return $this->getRandomNewCardByStrength($strength - 1, array());
    }
    
    public function getNewCard($cardid, $notes, $inhand, $purchased = false) {
        //simply adds a card to the user's deck by id
        $card = new PureTripleTriad_Card($cardid);
        
        $this->db->insertUserCard($this->userid, $cardid, $notes, $inhand, $card->strength, $purchased);
        $this->buildCards();
        
        return $card;
    }
    
    public function removeUserCard($usercardid) {
        //removes a card from a users possession
        //delete takes in userid for sanity check
        $this->db->removeUserCard($this->userid, $usercardid); //take card away! :(
        
        $this->buildCards();
    }
    
    public function tooFewCards() {
        
        //check for too few cards. this function is called at end of game for all take victory conditions on loss
        
        $newcards = array();
        $sum = count($this->deck) + count($this->hand);
        
        if ($sum < 5) {
            for ($i = 0; $i<(5-$sum); $i++) {
                $cardid = $this->getRandomNewCardByLevel(2, $this->hand);
                //new card goes straight to hand
                $newcard = $this->getNewCard($cardid, 'A freebie since they had to few cards for a full hand.', true);
                array_push($newcards, $newcard);
            }
        }
        
        //rebuild local structure
        $this->buildCards();
        
        return $newcards; //returns array of new cards given
    }
    
    public function setHand($cardidsstring) {
        //cardids is a string of card ids to set as hand separated by commas
        //it is used when setting a hand from the deck menu option
        if (isset($cardidsstring)) {
            if ($this->ingame == 0) {
                
                $requested = explode(',', $cardidsstring);
                if (count($requested) !== 5) {
                    throw new InvalidArgumentException('Exactly five cards are required in the active hand.');
                }

                $available = array_merge($this->deck, $this->hand);
                $selectedUserCardIds = array();
                foreach ($requested as $cardid) {
                    $cardid = trim($cardid);
                    if (!ctype_digit($cardid) || (int) $cardid < 1) {
                        throw new InvalidArgumentException('Every selected card ID must be numeric.');
                    }
                    $foundIndex = null;
                    foreach ($available as $index => $card) {
                        if ((int) $card->cardid === (int) $cardid) {
                            $foundIndex = $index;
                            $selectedUserCardIds[] = (int) $card->usercardid;
                            break;
                        }
                    }
                    if ($foundIndex === null) {
                        throw new InvalidArgumentException('The account does not own every selected card.');
                    }
                    unset($available[$foundIndex]);
                }

                $this->db->setExactHand($this->userid, $selectedUserCardIds);
                $this->buildCards();
                return $this->hand;
            } else {
                throw new Exception('User cannot set hand while playing a game');
            }
        } else {
            throw new Exception('The request data for card ids was not formatted properly');
        }
    }
    
    public function getOwnershipCount($cardid) {
        //input value is array of cardids.
        //the result is an array of the number of that card the player owns in the same order
        $mycards = array_merge($this->hand, $this->deck);
        $count = 0;
        foreach($mycards as $card) {
            if ($card->cardid == $cardid) {
                $count++;
            }
        }
        return $count;
    }
    
    public function getAllCards() {
        return array_merge($this->deck, $this->hand);
    }
    
    public function getGamesPlayed() {
        return $this->wins + $this->losses + $this->draws;
    }
    
    private function propertyValueInArray($array, $property, $value) {
        $flag = false;
        foreach($array as $object) {
            if(!is_object($object) || !property_exists($object, $property)) {
                return false;
            }
            if($object->$property == $value) {
                $flag = true;
            }
        }
        return $flag;
    }
    
    public function recordGameResult($result) {
        if ($result == 1) {
            //win!
            $this->db->setUserGameResult($this->userid, 1, 0, 0);
            $this->wins++;
        } else {
            if ($result == 0) {
                $this->db->setUserGameResult($this->userid, 0, 0, 1);
                $this->draws++;
            } else {
                //loss
                $this->db->setUserGameResult($this->userid, 0, 1, 0);
                $this->losses++;
            }
        }
    }
    
    private function deleteAll($dirname) {
        
        // Sanity check
        if (!file_exists($dirname)) {
        return false;
        }
        
        // Simple delete for a file
        if (is_file($dirname)) {
        return unlink($dirname);
        }
        
        // Loop through the folder
        $dir = dir($dirname);
        while (false !== $entry = $dir->read()) {
        // Skip pointers
        if ($entry == '.' || $entry == '..') {
        continue;
        }
        
        // Recurse
        $this->deleteAll("$dirname/$entry");
        }
        
        // Clean up
        $dir->close();
        return rmdir($dirname);
    }
    
    public static function getShopStock($user, $returncount) {
        //this function returns todays shop stock
        //this is potentially not a function of User but for now we need access to the player's deck
        //count = the number of cards to return
        
        $allcards = array_merge($user->deck, $user->hand);
        $db = new PureTripleTriad_Database();
        $chosen = $db->getDailyShopCards($user->userid, $returncount);

        $shopcards = array();
        foreach($chosen as $card) {
            
            //determine price
            // Standalone coin pricing scales with card level.
            $price = ($card['level']) * 2;
            
            //does the user already own this card?
            $count = 0;
            foreach($allcards as $mycard) {
                if ($mycard->cardid == $card['idcards']) {
                    $count++;
                }
            }
            $shopcard = new PureTripleTriad_ShopCard($card['idcards'], $price, $count);
            array_push($shopcards, $shopcard);
        }
        return $shopcards;
    }
    
    public function addUserOption($optionid, $value, $active = false) {
        
        $db = new PureTripleTriad_Database();
        
        if ($active) {
            $db->setActiveUserOption($this->userid, $optionid, $value);
        } else {
            $db->addUserOption($this->userid, $optionid, $value);
        }
        
        $this->buildUserOptions();
    }
    
    public function setUserOption($optionid, $value = null) {
        $db = new PureTripleTriad_Database();
        $db->setActiveUserOption($this->userid, $optionid, $value);
        $this->buildUserOptions();
    }
}
?>
