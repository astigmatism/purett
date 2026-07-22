<?php
class PureTripleTriad_Game {

    protected $db;
    public $gameid;
    public $p1;                             //user object
    public $p1color;
    public $p1score;
    public $p2color;
    public $p2score;
    public $key;
    public $gamecards       = array();      //a collection of all cards for this game (as gamecard objs)
    private $gamehistorylog;
    public $firstturn = false;              //this var is only used when the game is built and the computer's turn was first.
    private $compfollow = true;               //this flag tells the computer that it can take a turn after the player. set to false on game over condition really :P
    
    public $playboard       = array(null, null, null, null, null, null, null, null, null);
    public $elements        = array(-1, -1, -1, -1, -1, -1, -1, -1, -1);
    public $elementbonus    = 1;
    public $victoryclaim    = 0;    //if this game is over, this value represents the number of cards the player may take from them opponent
    public $cardsplayed     = 0;    //a simple token to avoid looping over the play board to count
    
    public $insuddendeath   = false;        //when true, the current round is a sudden death game (necessary flag for closed games whose cards should be open in sudden death)
    
    public $debug = false;                   //when true, nothing is saved to the server or back end
    
    public $rules = array(
        'closed'                => null,
        'open'                  => null,
        'same'                  => null,
        'plus'                  => null,
        'combo'                 => null,
        'same wall'             => null,
        'elemental'             => null,
        'random'                => null,
        'sudden death'          => null,
        'take one'              => null,
        'take direct'           => null,
        'take difference'       => null,
        'take all'              => null
    );
    
    private $ai;                            //separating the ai functionality purely for readibility
    
    function __construct($user) 
    {
        $this->db = new PureTripleTriad_Database();
        $this->p1 = $user;      //full oser object
        
        //get user's current game, if it doesnt exist create it
        $game = $this->db->getGame($this->p1->userid);
        if (!$game) {
            //requirements to pass for new game (should they slip past the client
            if (count($this->p1->hand) == 5) {
                $game = $this->buildGame();
            } else {
                throw new Exception('A game cannot be created when the player does not have 5 cards in hand.');
            }
        }
        
        $this->gameid           = $game['idgames'];
        $this->p1color          = base64_encode($this->p1->options['color']);
        $this->p1score          = $game['p1score'];
        $this->p2color          = 'red';
        $this->p2score          = $game['p2score'];
        $this->victoryclaim     = $game['victoryclaim'];
        $this->insuddendeath    = ($game['insuddendeath'] == 1 ? true : false);
        $this->key              = $game['key'];
        
        $this->buildGameCards();
        
        //get game rules
        $rules = $this->db->getGameRules($this->gameid);
        foreach($rules as $rule) {
            //assign each active rule to its index
            $this->rules[strtolower($rule['name'])] = array (
                'ruleid'            => $rule['ruleid'],
                'rule'              => $rule['name'],
                'description'       => $rule['description']
            );
        }
        //if in a sudden death round, closed rule is nullified (because player has already seen all opponent cards)
        if ($this->insuddendeath) {
            $this->rules['closed'] = null;
        }
        
        //if necessary, get board elements
        if (count(explode(',', $game['elements'])) == 9 && $this->rules['elemental']) {
            $this->elements = explode(',', $game['elements']);
        }
        
        //apply bonuses to cards and place on table
        foreach ($this->gamecards as $card) {
            //if this is a card on the playboard
            if ($card->position > -1) {
                $this->cardsplayed++;
                //does an element exist in this place?
                if ($this->elements[$card->position] > -1 && $this->rules['elemental']) {
                    //if so, apply bonus
                    $card->elementbonus = ($card->element == $this->elements[$card->position] ? $this->elementbonus : $this->elementbonus * -1);
                }
                //add to the playbaord array
                $this->playboard[$card->position] = $card;
            }
        }
        
        $this->ai = new PureTripleTriad_AI($this->p1->getWinLossPerc() * 10);
        
        //start game history
        $historyDirectory = GAMEHISTORY_PATH . '/' . (int) $this->p1->userid;
        if (!is_dir($historyDirectory)) {
            mkdir($historyDirectory, 0770, true);
        }
        $historyFile = $historyDirectory . '/' . (int) $this->gameid . '.jsonl';
        if (!file_exists($historyFile))
        {
            $writer = new Zend_Log_Writer_Stream($historyFile);
            $this->gamehistorylog = new Zend_Log($writer);
            $initialState = $this->getClientData();
            unset($initialState['iiiooioooiooioioiiiiioioioooi']);
            $this->gamehistorylog->info(json_encode($initialState));
        } else {
            $writer = new Zend_Log_Writer_Stream($historyFile);
            $this->gamehistorylog = new Zend_Log($writer);
        }
    }
    
    private function buildGame() {
        
        //get next game's rules first
        $rules = $this->getNextRules($this->p1->wins, $this->p1->losses, $this->p1->draws);
        
        //when building a new game, evaluate the player's current cards and their W-L percentage to determine the strength of the opponet
        //overall we want a target user w/l perc of .6 (wins 3 out of 5) to keep the player interested in the game
        
        //if this is a random game, replace hand with random cards from collection
        $hand = $this->p1->hand;
        foreach($rules as $rule) {
            if (strtolower($rule['name']) == 'random') {
                //for random rule, we're going to grab five cards from their collection to set
                //as game cards without actually changing the cards in their actual hand
                $allcards = array_merge($this->p1->hand, $this->p1->deck);
                shuffle($allcards);
                $newhand = array();
                for($i=0; $i<5; $i++) {
                    array_push($newhand, $allcards[$i]);
                }
                $hand = $newhand;
            }
        }
        
        $gamecards = array(); //local array of gamecards for setting in the db
        
        //convert my hand to game cards
        if (count($hand) == 5)
        foreach($hand as $card) {
            array_push($gamecards, new PureTripleTriad_GameCard($card->cardid, $card->usercardid, $card->owner, $card->strengthrank, $card->purchased));
        }
        
        //add opponent cards
        $opponetsCards = $this->getOpponentHand($this->p1, $hand);
        foreach($opponetsCards as $card) {
            array_push($gamecards, $card);
        }
        
        //set up elements for elemental game
        $elements = '';
        foreach($rules as $rule) {
            if (strtolower($rule['name']) == 'elemental') {
                
                $board = array(0,1,2,3,4,5,6,7,8);
                shuffle($board);
                $placements = mt_rand(2,4);
                for ($i=0; $i < $placements; $i++) {
                    $this->elements[$board[$i]] = mt_rand(0,7);
                }
            }
        }
        
        //key to expect from client on next turn
        $key = $this->generateKey();
        
        // Build the active game as one unit so a failed rules/card insert cannot
        // leave a partial game behind.
        $this->db->beginTransaction();
        try {
            $gameid = $this->db->newGame($this->p1->userid, implode(',', $this->elements), 0, $key);
            $this->db->setGameRules($gameid, $rules);
            $this->db->setGameCards($gameid, $gamecards);
            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
        
        //before handing back control to the constructor, decide which player will start this game.
        // Browser smoke tests need a stable first move; production remains random.
        $starts = getenv('PURETT_TEST_MODE') === '1' ? 1 : mt_rand(0, 1);
        if ($starts == 0) {
            //here is the case where the computer starts.
            $this->firstturn = true; //this value will be checked after the constructor is complete and after getClientData has been called (get get initial game state) but before responding
        }
        
        return $this->db->getGame($this->p1->userid);
    }
    
    public static function getNextRules($wins = 0, $losses = 0, $draws = 0) {
        
        //static - called without an instantiation of the game object, as such takes in the user class
        
        //this function determines the rules to be used on the next game. It can be called before the next game is built as a preview
        //as such, we can only set rules based on stats from the user (the incoming param)
        
        $played     = $wins + $losses + $draws;
        $perc       = ($wins > 0) ? $losses / $wins : 0;
        
        $rules = array(); //to start
        
        //get all rules, PUT IN CACHE!
        $db = new PureTripleTriad_Database();
        $pool = $db->getRules();
        
        $putin = array();
        
        //force rules now:
        //array_push($rules, $pool[2]);
        
        /*
        pool reference:
        'closed'                => 0,
        'open'                  => 1,
        'same'                  => 2,
        'plus'                  => 3,
        'combo'                 => 4,
        'same wall'             => 5,
        'elemental'             => 6,
        'random'                => 7,
        'sudden death'          => 8,
        'take one'              => 9,
        'take direct'           => 10,
        'take difference'       => 11,
        'take all'              => 12
        */
        
        switch($played) {
            case 0:
            case 1:
                break;
            case 2:
            case 3:
                $putin = array(0); //intro closed
                break;
            case 4:
            case 5:
                $putin = array(9); //intro take one
                break;
            
            case 6:
            case 7:
                $putin = array(9, 8); //intro sudden death
                break;
            case 8:
            case 10:
                $putin = array(0, 8);
                break;
            case 9:
                $putin = array(0, 9, 8);
                break;
            
            case 11:
            case 12:
                $putin = array(2); //intro same
                break;
            case 13:
            case 14:
            case 18:
                $putin = array(9, 2);
                break;
            case 15:
                $putin = array(0, 9, 2);
                break;
            case 16:
            case 19:
                $putin = array(0, 9, 8, 2);
                break;
            case 17:
            case 20:
                $putin = array(9, 8, 2);
                break;
            
            case 21:
            case 22:
            case 30:
                $putin = array(2, 4); //intro combo
                break;
            case 23:
            case 24:
            case 32:
                $putin = array(9, 2, 4);
                break;
            case 25:
            case 31:
                $putin = array(9, 8, 2, 4);
                break;
            case 26:
                $putin = array(0, 9, 2, 4);
                break;
            case 27:
            case 33:
                $putin = array(0, 9, 8, 2, 4);
                break;
            case 28:
            case 34:
                $putin = array(9, 2, 4);
                break;
            case 29:
                $putin = array(9, 8, 2, 4);
                break;
                
                
            case 35:
            case 36:
                $putin = array(3); //intro plus
                break;
            case 37:
            case 38:
                $putin = array(9, 3);
                break;
            case 39:
            case 51:
                $putin = array(0, 9, 3);
                break;
            case 40:
                $putin = array(9, 3, 4);
                break;
            case 41:
            case 52:
                $putin = array(0, 9, 3, 4);
                break;
            case 42:
                $putin = array(9, 8, 3, 4);
                break;
            case 43:
            case 56:
                $putin = array(0, 9, 8, 3, 4);
                break;
            case 44:
            case 50:
                $putin = array(2, 3);
                break;
            case 45:
            case 53:
                $putin = array(2, 3, 4);
                break;
            case 46:
            case 55:
                $putin = array(9, 2, 3, 4);
                break;
            case 47:
            case 54:
                $putin = array(9, 8, 2, 3, 4);
                break;
            case 48:
            case 57:
                $putin = array(0, 9, 2, 3, 4);
                break;
            case 49:
                $putin = array(9, 2, 3, 4);
                break;
                
            case 58:
                $putin = array(11); //intro take difference
                break;
            case 59:
                $putin = array(11, 3, 4);
                break;
                
            case 60:
            case 61:
                $putin = array(7); //introduce random
                break;
            case 62:
                $putin = array(0, 7);
                break;
            case 63:
                $putin = array(9, 7);
                break;
            case 64:
                $putin = array(0, 9, 7);
                break;
            case 65:
                $putin = array(0, 9, 8, 7);
                break;
            case 66:
                $putin = array(11, 7);
                break;
                
                
            case 67:
            case 68:
                $putin = array(6); //introduce elemental
                break;
            case 69:
            case 77:
                $putin = array(9, 6);
                break;
            case 70:
            case 75:
                $putin = array(0, 6);
                break;
            case 71:
            case 76:
                $putin = array(0, 9, 6);
                break;
            case 72:
                $putin = array(9, 8, 6);
                break;
            case 73:
                $putin = array(7, 6);
                break;
            case 74:
                $putin = array(0, 9, 7, 6);
                break;
                
                
            case 78:
            case 79:
                $putin = array(2, 5); //intro same wall
                break;
            case 80:
                $putin = array(2, 4, 5);
                break;
            case 81:
            case 92:
                $putin = array(9, 2, 4, 5);
                break;
            case 82:
                $putin = array(2, 3, 4, 5);
                break;
            case 83:
            case 98:
                $putin = array(9, 2, 3, 4, 5);
                break;
            case 84:
            case 93:
                $putin = array(0, 2, 4, 5);
                break;
            case 85:
            case 95:
                $putin = array(11, 2, 4, 5);
                break;
            case 86:
            case 97:
                $putin = array(9, 8, 2, 4, 5);
                break;
            case 87:
            case 100:
                $putin = array(9, 8, 2, 3, 4, 5);
                break;
            case 88:
            case 99:
                $putin = array(9, 7, 2, 4, 5);
                break;
            case 89:
            case 94:
                $putin = array(0, 7, 2, 4, 5);
                break;
            case 90:
            case 96:
                $putin = array(0, 9, 7, 2, 4, 5);
                break;
            case 91:
            case 101:
                $putin = array(0, 11, 2, 4, 5);
                break;
                
            case 102:
                $putin = array(10, 3, 4); //intro take direct
                break;
            case 103:
                $putin = array(12); //intro take all
                break;
            default: //rotation
                
                /*
                pool reference:
                'closed'                => 0,
                'open'                  => 1,
                'same'                  => 2,
                'plus'                  => 3,
                'combo'                 => 4,
                'same wall'             => 5,
                'elemental'             => 6,
                'random'                => 7,
                'sudden death'          => 8,
                'take one'              => 9,
                'take direct'           => 10,
                'take difference'       => 11,
                'take all'              => 12
                */
                
                switch($played % 109) {
                    case 0:
                        $putin = array(9);
                        break;
                    case 1:
                        $putin = array(0, 7);
                        break;
                    case 2:
                        $putin = array(9, 8, 3);
                        break;
                    case 3:
                        $putin = array(11, 0, 7);
                        break;
                    case 4: //starts here after take all at 103
                        $putin = array(9, 2, 3, 4);
                        break;
                    case 5:
                        $putin = array(0, 9, 8);
                        break;
                    case 6:
                        $putin = array(10, 7);
                        break;
                    case 7:
                        $putin = array(9, 3, 4);
                        break;
                    case 8:
                        $putin = array(0, 9, 8);
                        break;
                    case 9:
                        $putin = array(9, 2, 3, 4);
                        break;
                    case 10:
                        $putin = array(11, 2, 3, 4);
                        break;
                    case 11:
                        $putin = array(9, 8, 6);
                        break;
                    case 12:
                        $putin = array(0, 9, 7);
                        break;
                    case 13:
                        $putin = array(9, 2, 3);
                        break;
                    //same set
                    case 14:
                        $putin = array(9, 2, 4);
                        break;
                    case 15:
                        $putin = array(0, 9, 2, 4);
                        break;
                    case 16:
                        $putin = array(9, 8, 2, 4);
                        break;
                    case 17:
                        $putin = array(10, 2, 4);
                        break;
                    case 18:
                        $putin = array(9, 2, 4);
                        break;
                    case 19:
                        $putin = array(11, 2, 4);
                        break;
                    case 20:
                        $putin = array(9, 2, 4);
                        break;
                    case 21:
                        $putin = array(12, 2, 4);
                        break;
                    case 22:
                        $putin = array(0, 9, 2, 4);
                        break;
                    case 23:
                        $putin = array(9, 2, 4, 7);
                        break;
                    case 24:
                        $putin = array(9, 8, 2, 4);
                        break;
                    case 25:
                        $putin = array(0, 12, 2, 4);
                        break;
                    //plus set
                    case 26:
                        $putin = array(9, 3, 4);
                        break;
                    case 27:
                        $putin = array(10, 3, 4);
                        break;
                    case 28:
                        $putin = array(0, 9, 3, 4);
                        break;
                    case 29:
                        $putin = array(9, 8, 3, 4);
                        break;
                    case 30:
                        $putin = array(0, 9, 8, 3, 4);
                        break;
                    case 31:
                        $putin = array(9, 3, 4, 7);
                        break;
                    case 32:
                        $putin = array(0, 9, 3, 4, 7);
                        break;
                    case 33:
                        $putin = array(0, 11, 3, 4, 7);
                        break;
                    case 34:
                        $putin = array(9, 3, 4);
                        break;
                    case 35:
                        $putin = array(12, 3, 4);
                        break;
                    case 36:
                        $putin = array(12, 3, 4, 7);
                        break;
                    case 37:
                        $putin = array(9, 3, 4);
                        break;
                    //same and same wall
                    
                        /*
                    pool reference:
                    'closed'                => 0,
                    'open'                  => 1,
                    'same'                  => 2,
                    'plus'                  => 3,
                    'combo'                 => 4,
                    'same wall'             => 5,
                    'elemental'             => 6,
                    'random'                => 7,
                    'sudden death'          => 8,
                    'take one'              => 9,
                    'take direct'           => 10,
                    'take difference'       => 11,
                    'take all'              => 12
                    */
                
                    case 39:
                        $putin = array(9, 3, 4);
                        break;
                    case 40:
                        $putin = array(10, 2, 4, 5);
                        break;
                    case 41:
                        $putin = array(0, 9, 2, 4, 5);
                        break;
                    case 42:
                        $putin = array(9, 2, 4, 5, 7);
                        break;
                    case 43:
                        $putin = array(9, 8, 2, 4, 5);
                        break;
                    case 44:
                        $putin = array(12, 2, 4, 5);
                        break;
                    //same and plus
                    case 45:
                        $putin = array(9, 2, 3, 4);
                        break;
                    case 46:
                        $putin = array(9, 2, 3, 4);
                        break;
                    case 47:
                        $putin = array(9, 2, 3, 4);
                        break;
                    case 48:
                        $putin = array(11, 2, 3, 4);
                        break;
                    case 49:
                        $putin = array(0, 9, 2, 3, 4);
                        break;
                    case 50:
                        $putin = array(9, 2, 3, 4, 7);
                        break;
                    case 51:
                        $putin = array(9, 8, 2, 3, 4);
                        break;
                    case 52:
                        $putin = array(12, 2, 3, 4);
                        break;
                    case 53:
                        $putin = array(0, 10, 2, 3, 4);
                        break;
                    case 54:
                        $putin = array(2, 3, 4);
                        break;
                    case 55:
                        $putin = array(9, 8, 2, 3, 4);
                        break;
                    //elemental set
                    case 56:
                        $putin = array(9, 6);
                        break;
                    case 57:
                        $putin = array(10, 6);
                        break;
                    case 58:
                        $putin = array(11, 6);
                        break;
                    case 59:
                        $putin = array(12, 6);
                        break;
                    case 60:
                        $putin = array(9, 6, 7);
                        break;
                    case 61:
                        $putin = array(0, 9, 6);
                        break;
                    case 62:
                        $putin = array(9, 8, 6);
                        break;
                    case 63:
                        $putin = array(0, 10, 6);
                        break;
                        
                    //closed set
                    case 64:
                        $putin = array(0, 9);
                        break;
                    case 65:
                        $putin = array(0, 12);
                        break;
                    case 66:
                        $putin = array(0, 10, 8);
                        break;
                    case 67:
                        $putin = array(0, 9, 7);
                        break;
                    case 68:
                        $putin = array(0, 9, 6);
                        break;
                    case 69:
                        $putin = array(0, 9, 3);
                        break;
                    case 70:
                        $putin = array(0, 9, 2);
                        break;
                    case 71:
                        $putin = array(0, 11);
                        break;
                        
                    //go mental
                    case 72:
                    case 99:
                        $putin = array(9, 2, 3, 4, 5);
                        break;
                    case 73:
                        $putin = array(9, 2, 3, 4, 5, 6);
                        break;
                    case 74:
                        $putin = array(9, 2, 3, 4, 5, 6, 7);
                        break;
                    case 75:
                    case 86:
                        $putin = array(10, 2, 3, 4, 5);
                        break;
                    case 76:
                    case 100:
                        $putin = array(0, 9, 2, 3, 4, 5);
                        break;
                    case 77:
                    case 97:
                        $putin = array(11, 2, 3, 4, 5);
                        break;
                    case 78:
                        $putin = array(9, 8, 2, 3, 4, 5);
                        break;
                    case 79:
                    case 96:
                        $putin = array(0, 9, 2, 3, 4, 5);
                        break;
                    case 80:
                    case 108:
                        $putin = array(12, 2, 3, 4, 5);
                        break;
                    case 81:
                    case 95:
                        $putin = array(9, 2, 3, 4, 5, 7);
                        break;
                    case 82:
                        $putin = array(9, 2, 3, 4, 5, 6);
                        break;
                    case 83:
                    case 102:
                        $putin = array(0, 12, 7);
                        break;
                    case 84:
                    case 105:
                        $putin = array(9, 8, 6, 7);
                        break;
                    case 85:
                    case 107:
                        $putin = array(9, 2, 3, 7);
                        break;
                    case 101:
                        $putin = array(0, 3, 6, 7);
                        break;
                    case 87:
                        $putin = array(11, 2, 3, 4, 5);
                        break;
                    case 88:
                        $putin = array(9, 2, 3, 4, 5, 7);
                        break;
                    case 89:
                    case 104:
                        $putin = array(12);
                        break;
                    case 90:
                    case 106:
                        $putin = array(0, 9, 3, 4, 5);
                        break;
                    case 91:
                    case 98:
                        $putin = array(0, 11);
                        break;
                    case 92:
                        $putin = array(9, 8, 6);
                        break;
                    case 93:
                        $putin = array(9, 8, 6, 7);
                        break;
                    case 94:
                    case 103:
                        $putin = array(0, 10, 7);
                        break;
                        
                    default:
                        $putin = array(0, 9);
                        break;
                }
                
                break;
        }
        
        /*
        pool reference:
        'closed'                => 0,
        'open'                  => 1,
        'same'                  => 2,
        'plus'                  => 3,
        'combo'                 => 4,
        'same wall'             => 5,
        'elemental'             => 6,
        'random'                => 7,
        'sudden death'          => 8,
        'take one'              => 9,
        'take direct'           => 10,
        'take difference'       => 11,
        'take all'              => 12
        */
        
        //force:
        //$putin = array(10, 2, 3, 4);
        
        foreach($putin as $in) {
            array_push($rules, $pool[$in]);
        }
        
        return $rules;
    }
    
    private function buildGameCards() {
        //get all game cards
        $this->gamecards = array();
        $cards = $this->db->getGameCards($this->gameid);
        $mycards = array_merge($this->p1->hand, $this->p1->deck);
        foreach($cards as $card) {
            //we can tell if the card is players by veal the usercardid
            if ($card['usercardid'] > 0) {
                //if user card, we need more details
                foreach($mycards as $hand) {
                    if ($hand->usercardid == $card['usercardid']) {
                        array_push($this->gamecards, new PureTripleTriad_GameCard($card['cardid'], $card['usercardid'], $card['userid'], $hand->strengthRank, $hand->purchased, $card['idgamecards'], $card['position'], $card['captured']));
                    }
                }
            } else {
                array_push($this->gamecards, new PureTripleTriad_GameCard($card['cardid'], $card['usercardid'], $card['userid'], -1, 0, $card['idgamecards'], $card['position'], $card['captured']));
            }
        }
    }
    
    public static function getOpponentHand($player, $hand, $debug = false) {
        
        //hand is passed in separately (as opposed to using the player object) because in random games,
        //the hand they have set is not the hand they'll be playing with
        
        $strengthModifier = 1.5;      //increase this value to make the opponent more difficult for winning players and easier for lossers. A lower value decreases the spread.
        
        $handStrength = $player->getHandStrength($hand); //array with count, max and min levels. sums "percieved" (strength rank) strength of all cards in hand
        $playerStrength = $handStrength['strength'];
        $max = $handStrength['max'];
        $min = $handStrength['min'];
        $perc = $player->getWinLossPerc();
        
        //$targetStrength is the overall strength of their hand that we want to hit.
        $targetStrength = $playerStrength; //start by matching
        //adjust target by evaluating player's win/loss record. > 1 more wins, harder opponent.. < 1 more losses, weaker opponent
        
        //0.5 even record.. at this point, make the opponent slightly weaker (to allow the user to stay above.. gives them the illusion they're good at this if they win slightly more)
        //0.5 - 0.6 = 0.1 * 10 = minus 1
        $recordModifier = ((($perc - 0.6) * 10));
        
        //now the strength mod takes the above value and exponentially increases/decreases its effectiveness
        //the minimal strengh mod is 1.. below this point the spead of cards is too even, making it so that good cards dont show and good card progression cannot continue
        $strengthModifier = (($recordModifier * $strengthModifier) > 1) ? $recordModifier * $strengthModifier : 1;
        
        $targetStrength = $targetStrength + $strengthModifier;
        
        $targetStrength = ($targetStrength < 55 ? 55 : $targetStrength);        //min overall strength is 55 (really 50)
        $targetStrength = ($targetStrength > 140 ? 140 : $targetStrength);      //max overall strength is 140 (really 145)
        
        $runningStrength = $targetStrength; //average
        
        $opponentsCards = array();
        
        for ($i = 5; $i > 0; $i--) {
            $center = $runningStrength / $i;
            
            //randomly select a card with - strength and + strength *2: gives a greater chance for strong cards and then weaker ones
            $findStrength = rand($center - ($strengthModifier), $center + ($strengthModifier));
            $findStrength = ($findStrength < 10 ? 10 : $findStrength);
            
            $played = $player->getGamesPlayed();
            $ceiling = 24;
            
            switch(true) {
                case ($played > 100):
                    $ceiling = 29;
                    break;
                case ($played > 85):
                    $ceiling = 28;
                    break;
                case ($played > 70):
                    $ceiling = 27;
                    break;
                case ($played > 55):
                    $ceiling = 26;
                    break;
                case ($played > 40):
                    $ceiling = 25;
                    break;
            }
            
            //strongest card schedule 
            $findStrength = ($findStrength > $ceiling ? $ceiling : $findStrength);
            
            if ($debug) {
                echo 'center: '.$center;
                echo ' findstrength: '.$findStrength.'<br/>';
            }
            
            //find a card with this strength that they do not already have (returns card object)
            $cardid = $player->getRandomNewCardByStrength($findStrength, $opponentsCards);
            
            //add to opponents cards
            array_push($opponentsCards, new PureTripleTriad_GameCard($cardid, 0, 1, -1, 0)); //cardid, usercardid, userid (always 1 for comp), rank, purchased
            
            $runningStrength = $runningStrength - $findStrength; //reduce running average
        }
        
        if ($debug) {
            echo 'playerStrength: '.$playerStrength.'<br/>';
            echo 'max: '.$max.'<br/>';
            echo 'min: '.$min.'<br/>';
            echo 'played: '.$played.'<br/>';
            echo 'ceiling: '.$ceiling.'<br/>';
            echo 'win/loss perc: '.$perc.'<br/>';
            echo 'record mod: '.$recordModifier.'<br/>';
            echo 'strength mod: '.$strengthModifier.'<br/>';
            echo 'target strength: '.$targetStrength.'<br/>';
        }
        
        return $opponentsCards;
    }
    
    public function play($gamecardid, $position, $userid) {
        
        $result = array();
        
        if ($position < 9 && $position > -1) {
            //first be sure that the card is in the player's hand
            //also, be sure that the poisiton is available on the board
            $isinhand = false;
            $positionopen = true;
            $gamecard = null;
            foreach($this->gamecards as $card) {
                //check three things: verify the gamecardid, the owner, and that the card is in hand. evaluate against "captured" for sudden death rounds
                if ($card->gamecardid == $gamecardid && $card->captured == $userid && $card->position < 0) {
                    $isinhand = true;
                    $gamecard = $card;
                } else if ($card->position == $position) {
                    $positionopen = false;
                    throw new Exception('The position "'.$position.'" the card was played on is already taken.');
                }
            }
            //passed?
            if ($isinhand && $positionopen && $gamecard) {
                
                //register play
                $this->db->setGameCard($gamecardid, $position, $userid);
                $this->cardsplayed++;
                
                //if this is an elemental game, assign bonus here, before evaluating captures
                if ($this->elements[$position] > -1 && $this->rules['elemental']) {
                    $gamecard->elementbonus = ($this->elements[$position] == $gamecard->element ? $this->elementbonus : $this->elementbonus * -1);
                }
                //captures
                $captures = $this->capture($gamecard, $position, array());
                
                //update gamecard
                $gamecard->position = $position;
                $this->playboard[$position] = $gamecard;    //pointer to obj in gamecards array
                
                //update score
                $this->p1score = 0;
                $this->p2score = 0;
                foreach($this->gamecards as $card) {
                    if ($card->captured == $this->p1->userid) {
                        $this->p1score++;
                    } else {
                        $this->p2score++;
                    }
                }
                
                //save all to backend
                if (!$this->debug) {
                    $this->db->setGame($this->gameid, $this->p1score, $this->p2score, $this->key);
                }
                
                //check end condition
                $gameover = true;
                foreach($this->playboard as $place) {
                    //if not null
                    if (!$place) {
                        $gameover = false;
                    }
                }
                
                $dialog = $this->getDialogs(); //if we intend to show dialogs mid-game, this object allows us to do that
                
                $gameoverdetails = array();
                if ($gameover) {
                    $gameoverdetails = $this->gameover(); //end this game and get details about the game being over (claims/takes)
                }
                
                $result = array(
                    'x'             => $gamecardid,
                    'y'             => $position,
                    'captures'      => $captures,
                    'p1s'           => $this->p1score,
                    'p2s'           => $this->p2score,
                    'eb'            => $gamecard->elementbonus,
                    'z'             => ($gamecard->captured == 1 ? $this->p2color : $this->p1color).'/'.$gamecard->image,
                    'u'             => $userid,
                    'c'             => $gamecard->cardid,
                    'dialog'        => $dialog,
                    'gameover'      => $gameoverdetails
                );
                
                //same client result to game history
                $this->gamehistorylog->info(json_encode($result));
            } else {
                throw new Exception('Play failed validation check by 1) the card played was not part of this game or 2) the game was not in the player\'s hand.');
            }
        } else {
            throw new Exception('The position request was not a valid value:' .$position);
        }
        return $result;
    }
    
    private function capture($gamecard, $position, $array, $iscombo = false) {
        
        //tricky logic! for this function we compared captured:
        //by default its the owner's id, but in sudden death rounds it may not be!
        
        $response = array();
        
        $nindex     = (($position - 3) < 0) ? -1 : $position - 3;
        $eindex     = $position + 1;
        $sindex     = (($position + 3) > 8) ? -1 : $position + 3;
        $windex     = $position - 1;
        //if against walls
        if ($eindex == 3 || $eindex == 6 || $eindex == 9) {
            $eindex = -1;
        }
        if ($windex == 2 || $windex == 5) {
            $windex = -1;
        }
        
        //the evaluation struture
        $evaluation = array(
            'n' => array(
                'index'     => $nindex,
                'myrank'    => 'n',
                'theirrank' => 's',
                'direction' => 1,
                'sum'       => array('me' => 0, 'them' => 0),
                'same'      => false
            ),
            'e' => array(
                'index'     => $eindex,
                'myrank'    => 'e',
                'theirrank' => 'w',
                'direction' => 0,
                'sum'       => array('me' => 0, 'them' => 0),
                'same'      => false
            ),
            's' => array(
                'index'     => $sindex,
                'myrank'    => 's',
                'theirrank' => 'n',
                'direction' => 1,
                'sum'       => array('me' => 0, 'them' => 0),
                'same'      => false
            ),
            'w' => array(
                'index'     => $windex,
                'myrank'    => 'w',
                'theirrank' => 'e',
                'direction' => 0,
                'sum'       => array('me' => 0, 'them' => 0),
                'same'      => false
            )
        );
        $flips = array(null, null, null, null, null, null, null, null, null);
        
        //basic captures and setup for other rules
        
        foreach($evaluation as $ekey => $e) {
            
            //helpers:
            //$this->playboard[$e['index']] - their card
            
            //if there is a card for evaluation and it isnt a wall
            if ($e['index'] != -1 && $this->playboard[$e['index']]) {
                
                //if the card for evaluation was not captured or belong to this player
                if ($this->playboard[$e['index']]->captured != $gamecard->captured) {
                    //if my rank trumps their rank
                    if (
                        ($gamecard->getRank($e['myrank']) + ($this->rules['elemental'] ? $gamecard->elementbonus : 0)) 
                        > 
                        ($this->playboard[$e['index']]->getRank($e['theirrank']) + ($this->rules['elemental'] ? $this->playboard[$e['index']]->elementbonus : 0))
                    ) {
                        
                        //add to flip array for client
                        $flips[$e['index']] = array(
                            'position'      => $e['index'],
                            'direction'     => $e['direction'],
                            'image'         => ($this->playboard[$e['index']]->purchased == 1 ? 'p' : '').($gamecard->captured == 1 ? $this->p2color : $this->p1color).'/'.$this->playboard[$e['index']]->image,
                            'rule'          => ($iscombo ? 4 : 0)
                        );
                    }
                }
                //consider for same rule
                if ($gamecard->getRank($e['myrank']) == $this->playboard[$e['index']]->getRank($e['theirrank'])) {
                    $evaluation[$ekey]['same'] = true;
                }
                
                //setup for plus rule - for now save these values for sumation later if plus is on
                $evaluation[$ekey]['sum']['me']     = $gamecard->getRank($e['myrank']);
                $evaluation[$ekey]['sum']['them']   = $this->playboard[$e['index']]->getRank($e['theirrank']);
                
            } else {
                //setup for same wall rule
                if ($this->rules['same wall'] && $e['index'] == -1 && $gamecard->getRank($e['myrank']) == 10) {
                    $evaluation[$ekey]['same'] = true;
                }
            }
        }
        
        //build json structure for basic flips
        array_push($response, array(
            'rule'      => ($iscombo ? 4 : 0),
            'flash'     => array(),
            'flips'     => array()     //to be determined later by flips array
        ));
        
        //plus rule
        if ($this->rules['plus'] && !$iscombo) {
            
            $flashes    = array();
            
            //begin by checking list of sum values for qualifying sums
            $qualify = array(
                'n' => false,
                'e' => false,
                's' => false,
                'w' => false
            );
            $keys = array_keys($evaluation);
            //outer loop, run over each saved sum
            for($i = 0; $i < count($evaluation); $i++) {
                //inner loop, compare it to the other saved sums looking for matches
                for($j = $i + 1; $j < count($evaluation); $j++) {
                    $suma = $evaluation[$keys[$i]]['sum']['me'] + $evaluation[$keys[$i]]['sum']['them'];
                    $sumb = $evaluation[$keys[$j]]['sum']['me'] + $evaluation[$keys[$j]]['sum']['them'];
                    
                    //if the sums match and are not 0 (because defaults are 0), we have a plus match
                    if ($suma == $sumb && $sumb > 0) {
                        
                        //let the same rule capture when the values are identical
                        if ($this->rules['same'] && 
                            $evaluation[$keys[$i]]['sum']['me'] == $evaluation[$keys[$i]]['sum']['them'] &&
                            $evaluation[$keys[$j]]['sum']['me'] == $evaluation[$keys[$j]]['sum']['them']
                            ) {
                            
                        } else {
                            $qualify[$keys[$i]] = true;
                            $qualify[$keys[$j]] = true;
                        }
                    }
                }
            }
            
            //loop through qualifiers
            foreach($qualify as $qkey => $q) {
                //if qualified (is one of another or more sums)
                if ($q) {
                    //since a plus rule can qualify with your own cards, check the other before flipping
                    if ($this->playboard[$evaluation[$qkey]['index']]->captured != $gamecard->captured) {
                        $flips[$evaluation[$qkey]['index']] = array(
                            'position'      => $evaluation[$qkey]['index'],
                            'direction'     => $evaluation[$qkey]['direction'],
                            'image'         => ($this->playboard[$evaluation[$qkey]['index']]->purchased == 1 ? 'p' : '').($this->playboard[$evaluation[$qkey]['index']]->captured == 1 ? $this->p1color : $this->p2color).'/'.$this->playboard[$evaluation[$qkey]['index']]->image,
                            'rule'          => 3
                        );
                    }
                    //add flash
                    array_push($flashes, $evaluation[$qkey]['index']);
                    //add gamecard to flash too
                    if (!in_array($position, $flashes)) {
                        array_push($flashes, intval($position));
                    }
                }
            }
            
            //build json structure for plus
            array_push($response, array(
                'rule'      => 3,
                'flash'     => $flashes,
                'flips'     => array() //to be determined later by flips array
            ));
        }
        
        //same and same wall
        if ($this->rules['same'] && !$iscombo) {
            
            $flashes = array();
            
            //first get a count of same's, we need at least two for rule
            $sames = 0;
            foreach($evaluation as $e) {
                if ($e['same']) {
                    $sames++;
                }
            }
            //we have some valid same's!
            if ($sames > 1) {
                foreach($evaluation as $e) {
                    if ($e['same']) {
                        //if valid for same wall rule, we cant flip a card
                        if ($e['index'] != -1) {
                            //make sure the card used by the rule doesn't already belong to the player
                            if ($this->playboard[$e['index']]->captured != $gamecard->captured) {
                                $flips[$e['index']] = array(
                                    'position'      => $e['index'],
                                    'direction'     => $e['direction'],
                                    'image'         => ($this->playboard[$e['index']]->purchased == 1 ? 'p' : '').($this->playboard[$e['index']]->captured == 1 ? $this->p1color : $this->p2color).'/'.$this->playboard[$e['index']]->image,
                                    'rule'          => 2
                                );
                            }
                            //add flash
                            array_push($flashes, $e['index']);
                            //add gamecard to flash too
                            if (!in_array($position, $flashes)) {
                                array_push($flashes, intval($position));
                            }
                        }
                    }
                }
            }
            
            //build json structure for same
            array_push($response, array(
                'rule'      => 2,
                'flash'     => $flashes,
                'flips'     => array() //to be determined later by flips array
            ));
        }
        
        //determine which rule gets to flip the card - sometimes a card canbe flipped by more than one rule, we've saved the order of precidence already though
        foreach($flips as $flip) {
            if (!$flip) {
                continue;
            }
            //for each rule set in response
            foreach($response as $rkey => $r) {
                if ($flip['rule'] === $r['rule']) {
                    array_push($response[$rkey]['flips'], array(
                        'p'         => $flip['position'],
                        't'         => $flip['direction'],
                        'i'         => $flip['image']
                    ));
                    $this->playboard[$flip['position']]->captured = $gamecard->captured;
                    if (!$this->debug) {
                        //save to backend
                        $this->db->setGameCard($this->playboard[$flip['position']]->gamecardid, $flip['position'], $gamecard->captured);
                    }
                }
            }
        }
        
        array_push($array, $response);
        
        //recurse for combo
        if ($this->rules['combo']) {
            foreach($flips as $flip) {
                if (!$flip) {
                    continue;
                }
                switch ($flip['rule']) {
                    case 3: //for plus
                    case 2: //for same
                    case 4: //for combo
                        $array = $this->capture($this->playboard[$flip['position']], $flip['position'], $array, true);
                        break;
                    default:
                        break;
                }
            }
        }
        
        return $array;
    }
    
    public function me($gamecardid, $position, $userid, $key) {
        //this function is called from the controller, from the client dynamically.
        //it contains information about a user's play. in the response we include details about the
        //play and the computer's response to that play as well…
        
        if ((int) $userid !== (int) $this->p1->userid) {
            throw new Exception('The requested player does not own this game.');
        }

        $this->db->beginTransaction();
        try {
            // Serializes submissions for this game and validates against the
            // current database token, not a stale constructor snapshot.
            $lockedGame = $this->db->db->fetchRow(
                'SELECT `key` FROM games WHERE idgames = ? AND p1 = ? FOR UPDATE',
                array((int) $this->gameid, (int) $this->p1->userid)
            );
            if (!$lockedGame) {
                throw new Exception('The requested player does not own this game.');
            }
            if (!hash_equals((string) $lockedGame['key'], (string) $key)) {
                throw new Exception('Player is attempting to play out of turn.');
            }

            $this->key = $this->generateKey();
            $me = $this->play($gamecardid, $position, $userid);

            $them = array();
            if ($this->compfollow) {
                $them = $this->them();
            }

            $result = array(
                'ppqoowoieoiqpoipieoicojqpojuu' => $me,
                'ppqoowoieoiqpoipieoicojqpojow' => $them,
                'player'                        => $this->key
            );
            $this->db->commit();
            return $result;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    public function them()
    {
        // This can be the opening move or part of a human move transaction.
        // Nested database transactions collapse onto the same PDO transaction.
        $this->db->beginTransaction();
        try {
            $lockedGame = $this->db->db->fetchRow(
                'SELECT idgames FROM games WHERE idgames = ? AND p1 = ? FOR UPDATE',
                array((int) $this->gameid, (int) $this->p1->userid)
            );
            if (!$lockedGame) {
                throw new RuntimeException('Active game not found.');
            }
            $response = $this->ai->compute($this);
            $result = $this->play($response['gamecardid'], $response['position'], 1);
            $this->db->commit();
            return $result;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    private function setSuddenDeath() {
        //we have a draw situation with sudden death
                
        $this->insuddendeath = true;
        $this->db->setSuddenDeath($this->gameid, true);
        
        //clear play board
        $this->playboard       = array(null, null, null, null, null, null, null, null, null);
        $this->cardsplayed = 0;
        
        //move captured cards into player's hands
        foreach($this->gamecards as $card) {
            //setGameCard($gamecardid, $position, $captured)
            $this->db->setGameCard($card->gamecardid, ($card->captured == 1 ? -2 : -1), $card->captured);
            $card->position = ($card->captured == 1 ? -2 : -1);
            $card->elementbonus = 0;
        }
        return array(); //return details of sudden death, bail early
    }
    
    private function gameover() {
        //if draw and sudden death on
        if ($this->rules['sudden death']) {
            if ($this->p1score == $this->p2score) {
                return $this->setSuddenDeath();
            }
        }
        //if sudden death not set or game not a draw, this is indeed a game over, handle thusly
        
        $this->compfollow = false; //the computer may not take their turn anymore
        
        //set result, 1 = win, 0 = draw, -1 = loss
        $result = 0;
        if ($this->p1score > $this->p2score) {
            $result = 1;
        }
        if ($this->p1score < $this->p2score) {
            $result = -1;
        }
        
        $this->db->beginTransaction();
        try {
        //record result
        $this->p1->recordGameResult($result);
        
        //add the game to the gamehistory
        $this->db->setGameHistory($this->p1->userid, $this->gameid, $this->p1score, $this->p2score);

        $coinsAwarded = self::getCoinReward($this->p1score, $this->p2score);
        $coinBalance = $this->db->getWalletBalance($this->p1->userid);
        if ($coinsAwarded > 0) {
            $coinResult = $this->db->awardMatchCoins(
                $this->p1->userid,
                $this->gameid,
                $coinsAwarded,
                'Victory ' . $this->p1score . '-' . $this->p2score
            );
            $coinBalance = (int) $coinResult['balance'];
        }
        
        //create vars for player's game cards and return to client
        $given = array();       //when deck/hand count below 5
        $taken = array();       //cards opponent has taken from you in a loss
        $won = array();         //card you won directly (without claiming) like in take all and take direct
        $mycards = array();     //a shortcut array on my cards
        $theircards = array();  //a shortcut array of their cards
        $nonpurchased = array();    //a shortcut array on my nonpurchased cards
        
        foreach($this->gamecards as $card) {
            //loop through all game cards. 
            if ($card->owner == $this->p1->userid) {
                array_push($mycards, $card);
            } else {
                array_push($theircards, $card);
            }
        }
        foreach($mycards as $card) {
            if ($card->purchased == 0) {
                array_push($nonpurchased, $card);
            }
        }
        
        
        //handle victory claim, until this is complete, the game stays in the db
        if (isset($this->rules['take one'])) {
            
            if ($result == 1) {
                //if you won, set the victory claim feild. it is used as a counter on the backend for the number of cards you can select
                $this->setVictoryClaim(1);
            } else if ($result == -1) {
                //opponent takes a single card from you that isn't purchased
                if (count($nonpurchased) > 0) {
                    //we have cards that can be taken, entirely possible that the comp can't take any away (if all purchased :)
                    $gone = array_rand($nonpurchased);
                    array_push($taken, $nonpurchased[$gone]);
                    $this->p1->removeUserCard($nonpurchased[$gone]->usercardid); //take card away! :(
                }
                
                $this->deleteGame();
            } else {
                //draw game, no victory rules applied
                $this->deleteGame();
            }
            
        } else if (isset($this->rules['take difference'])) {
            
            if ($result == 1) {
                $diff = $this->p1score - $this->p2score;
                if ($diff > 4) {
                    //instead of claiming a diff of 5 or greater, simple give all opponents cards to player
                    foreach($theircards as $card) {
                        array_push($won, $card);
                        $this->p1->getNewCard($card->cardid, 'Collected as a prize from a game won on '.date('F j, Y').'.', false);
                    }
                    $this->deleteGame();
                } else {
                    $this->setVictoryClaim($diff);      //set claim to difference in score (for values 1 through 4)
                }
            } else if ($result == -1) {
                $diff = $this->p2score - $this->p1score;
                $diff = ($diff > 5) ? 5 : $diff;    //the max number of claims allowed is 5 of course
                shuffle($nonpurchased);             //shuffle the nonpurchase array since we're using pop to choose
                for ($i = 0; $i<$diff; $i++) {      //for the diff, continue to pop cards
                    if (count($nonpurchased) > 0) { //only if more exist
                        $card = array_pop($nonpurchased);
                        array_push($taken, $card);
                        $this->p1->removeUserCard($card->usercardid); //take card away! :(
                    }
                }
                $this->deleteGame();
            } else {
                $this->deleteGame();
            }
            
        } else if (isset($this->rules['take all'])) {
            
            if ($result == 1) {
                //you win, take all opponents cards
                foreach($theircards as $card) {
                    array_push($won, $card);
                    $this->p1->getNewCard($card->cardid, 'Collected as a prize from a game won on '.date('F j, Y').'.', false);
                }
            } else if ($result == -1) {
                //you loose, opponent takes all non-purchased cards
                foreach($nonpurchased as $card) {
                    array_push($taken, $card);
                    $this->p1->removeUserCard($card->usercardid); //take card away! :(
                }
            }
            //after exchanges, delete game
            $this->deleteGame();
        
        } else if (isset($this->rules['take direct'])) {
            
            //players keep the cards they've captured
            //basically, just loop over the nonpurchased cards. if they've been captured by the opponent, remove them
            foreach($nonpurchased as $card) {
                if ($card->captured == 1) {
                    array_push($taken, $card);
                    $this->p1->removeUserCard($card->usercardid); //take card away! :(
                }
            }
            //for won cards, loop over opponents
            foreach($theircards as $card) {
                if ($card->captured == $this->p1->userid) {
                    array_push($won, $card);
                    $this->p1->getNewCard($card->cardid, 'Collected as a prize from a game won on '.date('F j, Y').'.', false);
                }
            }
            
            //after exchanges, delete game
            $this->deleteGame();
            
        } else {
            //no claim
            $this->deleteGame();
        }
        
        //check for too few cards in deck/hand
        $given = $this->p1->tooFewCards();
        
        //get preview of next game's rules
        $rules = $this->getNextRules($this->p1->wins, $this->p1->losses, $this->p1->draws);
        
        //build array to return to client
        $result = array(
            'won'       => $won,                            //cards won from take all or take direct (instances when the user doesnt claim won cards)
            'taken'     => $taken,                          //array of cards taken by opponent (empty if none)
            'claim'     => $this->victoryclaim,             //the number of cards you can take from poponent
            'given'     => $given,                          //any cards given to you when you have less than 5 in hand/deck OR if a victory condition like take all or take direct (since you dont choose them)
            'hand'      => $this->p1->hand,                 //player's new hand for display on main menu
            'deckcount' => count($this->p1->deck) + $this->victoryclaim,          //used to show "deck" menu command
            'nextrules' => $rules,                          //a preview of next game's rules to display on the client
            'own'       => $this->getOwnershipCountOfOpponentsCards(),
            'coinsAwarded' => $coinsAwarded,
            'coins'     => $coinBalance
        );
        
        //if this is a closed game, return the contents of p2's hand. we cannot rely on the client because not all cards are shown yet!
        if (isset($this->rules['closed'])) {
            $p2hand = array();
            foreach ($theircards as $card) {
                array_push($p2hand, array(
                    'lkjasdojwlkajsdkjdpakjkjs'    => $this->p2color.'/'.$card->image,
                    'jjkaooijslakjdiwjkalsjkkk'    => $card->gamecardid,
                    'yoiasdknqowkjndlansihjwsd'    => $card->usercardid,
                    'ffjklaksjidlkmjaiwnnmnalk'    => $card->owner
                ));
            }
            
            $result = array_merge($result, array(
                'p2h' => $p2hand
            ));
        }
        
        $this->db->commit();
        //return details to client
        return $result;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public static function getCoinReward($p1score, $p2score)
    {
        $p1score = (int) $p1score;
        $p2score = (int) $p2score;
        if ($p1score <= $p2score) {
            return 0;
        }
        return $p1score - $p2score;
    }

    public function setVictoryClaim($value) {
        $this->victoryclaim = $value;
        $this->db->setVictoryClaim($this->gameid, $value);
    }
    
    public function claim($userid, $gameid, $gamecardid) {
        if ((int) $userid !== (int) $this->p1->userid || (int) $gameid !== (int) $this->gameid) {
            throw new RuntimeException('The requested claim does not belong to this account.');
        }
        if (!ctype_digit((string) $gamecardid) || (int) $gamecardid < 1) {
            throw new InvalidArgumentException('A valid game card ID is required.');
        }

        $this->db->beginTransaction();
        try {
            $lockedGame = $this->db->db->fetchRow(
                'SELECT victoryclaim FROM games WHERE idgames = ? AND p1 = ? FOR UPDATE',
                array((int) $this->gameid, (int) $this->p1->userid)
            );
            if (!$lockedGame || (int) $lockedGame['victoryclaim'] < 1) {
                throw new RuntimeException('No card claim is available.');
            }

            $selected = $this->db->db->fetchRow(
                'SELECT idgamecards, cardid FROM gamecards
                 WHERE idgamecards = ? AND gameid = ? AND userid = 1 FOR UPDATE',
                array((int) $gamecardid, (int) $this->gameid)
            );
            if (!$selected) {
                throw new InvalidArgumentException('The selected opponent card is not available.');
            }

            $remaining = (int) $lockedGame['victoryclaim'] - 1;
            $this->setVictoryClaim($remaining);
            if ($this->db->removeGameCard($this->gameid, (int) $selected['idgamecards']) !== 1) {
                throw new RuntimeException('The selected opponent card is no longer available.');
            }
            $this->p1->getNewCard((int) $selected['cardid'], 'Collected as a game prize.', false);
            if ($remaining === 0) {
                $this->deleteGame();
            }
            $this->db->commit();
            $this->buildGameCards();
            return array('remaining' => $remaining);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    public function deleteGame() {
        //delete game from the db
        $this->db->deleteGame($this->gameid);
    }
    
    public function removeGameCard($gamecardid) {
        //completely removes a game card from the game.
        //for now this is only used for victory claim to prevent a user from claiming the same card multiple times
        //obviously this call should never be made unless the game is over and not yet deleted
        
        if (isset($gamecardid)) {
            $this->db->removeGameCard($this->gameid, $gamecardid);
        }
        
        //rebuild structure
        $this->buildGameCards();
    }
    
    public function getClientData() {
        
        //this function on game start and on game recall to setup the client with necessary data
        
        $p1hand     = array();
        $p2hand     = array();
        $board      = array();
        $dialog     = $this->getDialogs(); //any dialogs to show at this point in the game? empty array if not
        
        for($i = 0; $i < 9; $i++) {
            array_push($board, array(
                'elkasdaoiooiaoiiasokdplkl'    => $this->elements[$i]
            ));
        }
        
        foreach($this->gamecards as $card) {
            if ($card->position == -1) {
                array_push($p1hand, array(
                    'lkjasdojwlkajsdkjdpakjkjs'    => ($card->purchased == "1" ? 'p' : '').$this->p1color.'/'.$card->image,
                    'jjkaooijslakjdiwjkalsjkkk'    => $card->gamecardid,
                    'yoiasdknqowkjndlansihjwsd'    => $card->usercardid,
                    'ffjklaksjidlkmjaiwnnmnalk'    => $card->owner,
                    'yyqweiuydhiiwoqijkwlkkjww'    => $card->purchased
                ));
            } else if ($card->position == -2) {
                array_push($p2hand, array(
                    'lkjasdojwlkajsdkjdpakjkjs'    => ($this->rules['closed'] && $this->victoryclaim == 0) ? 'cardBack' : $this->p2color.'/'.$card->image,
                    'jjkaooijslakjdiwjkalsjkkk'    => $card->gamecardid,
                    'yoiasdknqowkjndlansihjwsd'    => $card->usercardid,
                    'ffjklaksjidlkmjaiwnnmnalk'    => $card->owner
                ));
            } else {
                $board[$card->position] = array_merge($board[$card->position], array(
                    'llkjasdoiuqwoiquweiiwiuie'    => $card->captured,
                    'lkjasdojwlkajsdkjdpakjkjs'    => ($card->purchased == "1" ? 'p' : '').($card->captured == 1 ? $this->p2color : $this->p1color).'/'.$card->image,
                    'jjkaooijslakjdiwjkalsjkkk'    => $card->gamecardid,
                    'yoiasdknqowkjndlansihjwsd'    => $card->usercardid,
                    'huuskajhskduuuhasduhuusss'    => $card->elementbonus,
                    'ffjklaksjidlkmjaiwnnmnalk'    => $card->owner,
                    'yyqweiuydhiiwoqijkwlkkjww'    => $card->purchased
                ));
            }
        }
        
        $rules = array();
        foreach($this->rules as $rule) {
            if (!is_array($rule)) {
                continue;
            }
            array_push($rules, array(
                'poiqwepoir'        => $rule['ruleid'],
                'fjklasdjklasfj'    => $rule['rule'],
                'cbnmzxcbnmz'       => $rule['description']
            ));
        }
        
        $result = array(
            'oiuwqnlaskjodwksjdlappw'           => $this->gameid,
            'bdjiauhjhduqijshckjhaii'           => $this->p1->userid,
            'ysjhkauhwjkahjhsjkhdkjh'           => $this->insuddendeath,
            'mnsjkaiwbcbakjwifh'                => $this->p1color,
            'yqofhqoiwhfcoqhfcohq'              => $this->p2color,
            'mnzbxcnbmncbzmxnbcmnbzxmnb'        => $p1hand,
            'kjhsadjhkaskjhdkjhasjhdasd'        => $p2hand,
            'uyeiqowiutoiqyweiuyqwoiyro'        => $board,
            'lkjasdoiuqwekjadsflkjmnbxcvkhj'    => $this->p1score,
            'asdlkjqweoiuwervbirwaljdsbvlkjbl'  => $this->p2score,
            'sdflkjweoirukjsdlvkjsdlouw'        => $rules,
            'uwlksjdflkjieknflknklsdkfnkfn'     => $dialog,
            'iiiooioooiooioioiiiiioioioooi'     => $this->key,
            'ppqoowoieoiqpoipieoicojqpojow'     => $this->firstturn
        );
        
        //if during victory claim period, these structures need to be passed as well
        // they are normally passed at the end of a turn but are needed again resume during claim period
        if ($this->victoryclaim > 0) {
            
            
            $additional = array(
                'ewoicujonadsincoqinokcnvbzkak'     => $this->victoryclaim,
                'bqpdkjaoskcjqekndckmaslkneihn'     => $this->getNextRules($this->p1->wins, $this->p1->losses, $this->p1->draws),
                'oiqwpojcoqeijckjlkwjepficojpk'     => $this->p1->hand,
                'uioqoiiidiioqoiwudioiuqwiowiq'     => count($this->p1->deck) + $this->victoryclaim,
                'nbzxcvmnzbxmncvshjashkdjhkakk'     => $this->getOwnershipCountOfOpponentsCards()
            );
            $result = array_merge($result, $additional);
        }
        
        return $result;
    }
    
    public static function parseGameHistoryLog($filepath) {
        //for the review, we're going to send back and array where each line in the log is an item in it
        $return = array();
        if (file_exists($filepath)) {
            $lines = file($filepath);
            foreach ($lines as $line_num => $line) {
                //parse out log information
                $line = preg_replace('/.*INFO\s+\(6\):\s+/i', '', $line);
                $line = preg_replace('/\r\n/i', '', $line);
                //decode the json from the log for the array
                $decoded = json_decode(trim($line));
                if ($decoded !== null) {
                    array_push($return, $decoded);
                }
            }
        }
        return $return;
    }
    
    private function getDialogs() {
        //this function evaluates current game and/or player conditions to determine if a dialog should be loaded mid-game
        
        $dialog = array();
        
        //helpers
        $gamesplayed = $this->p1->wins + $this->p1->losses + $this->p1->draws;
        
        //first game dialog
        if ($gamesplayed == 0 && $this->cardsplayed == 0) {
            $dialog = $this->getDialogContent('firstgame');
        }
        //end of first game
        if ($gamesplayed == 0 && $this->cardsplayed == 9) {
            if ($this->p1score > $this->p2score) {
                $dialog = $this->getDialogContent('firstgameendswin');
            } else if ($this->p1score < $this->p2score) {
                $dialog = $this->getDialogContent('firstgameendslose');
            } else {
                $dialog = $this->getDialogContent('firstgameendsdraw');
            }
            
        }
        
        //closed
        if ($gamesplayed == 2 && $this->cardsplayed == 0) {
            $dialog = $this->getDialogContent('closedintro');
        }
        
        //introduce take one
        if ($gamesplayed == 4 && $this->cardsplayed == 0) {
            $dialog = $this->getDialogContent('takeoneintro');
        }
        //end of take one
        if ($gamesplayed == 4 && $this->cardsplayed == 9) {
            if ($this->p1score > $this->p2score) {
                $dialog = $this->getDialogContent('takeonewin');
            } else if ($this->p1score < $this->p2score) {
                $dialog = $this->getDialogContent('takeonelose');
            } else {
                $dialog = $this->getDialogContent('takeonedraw');
            }
            
        }
        
        //intro sudden death
        if ($gamesplayed == 6 && $this->cardsplayed == 0) {
            $dialog = $this->getDialogContent('suddendeathintro');
        }
        
        //intro same
        if ($gamesplayed == 11 && $this->cardsplayed == 0) {
            $dialog = $this->getDialogContent('sameintro');
        }
        
        //intro combo
        if ($gamesplayed == 21 && $this->cardsplayed == 0) {
            $dialog = $this->getDialogContent('combointro');
        }
        
        //intro plus
        if ($gamesplayed == 35 && $this->cardsplayed == 0) {
            $dialog = $this->getDialogContent('plusintro');
        }
        
        //take difference
        if ($gamesplayed == 58 && $this->cardsplayed == 0) {
            $dialog = $this->getDialogContent('takediffintro');
        }
        
        //random
        if ($gamesplayed == 60 && $this->cardsplayed == 0) {
            $dialog = $this->getDialogContent('randomintro');
        }
        
        //elemental
        if ($gamesplayed == 67 && $this->cardsplayed == 0) {
            $dialog = $this->getDialogContent('elementalintro');
        }
        
        //same wall
        if ($gamesplayed == 78 && $this->cardsplayed == 0) {
            $dialog = $this->getDialogContent('samewallintro');
        }
        
        //take direct
        if ($gamesplayed == 102 && $this->cardsplayed == 0) {
            $dialog = $this->getDialogContent('takedirectintro');
        }
        
        //take all
        if ($gamesplayed == 103 && $this->cardsplayed == 0) {
            $dialog = $this->getDialogContent('takeallintro');
        }
        
        return $dialog;
    }
    
    private function getDialogContent($filename) {
        $content = array();
        if (file_exists(DIALOGS_PATH.'/'.$filename.'.txt')) {
            $content = json_decode(file_get_contents(DIALOGS_PATH.'/'.$filename.'.txt'));
        }
        return $content;
    }
    
    public static function review($gameid, $userid) {
        if (!ctype_digit((string) $gameid) || (int) $gameid < 1) {
            throw new InvalidArgumentException('A valid game ID is required.');
        }
        $db = new PureTripleTriad_Database();
        $history = $db->getAuthorizedGameHistory((int) $gameid, (int) $userid);
        if (!$history) {
            throw new RuntimeException('Replay not found.');
        }
        $path = self::historyPath($history['log_path']);
        $data = self::parseGameHistoryLog($path);
        if (empty($data)) {
            throw new RuntimeException('Replay data is unavailable.');
        }
        return $data[0];
    }

    public static function reviewData($gameid, $userid) {
        if (!ctype_digit((string) $gameid) || (int) $gameid < 1) {
            throw new InvalidArgumentException('A valid game ID is required.');
        }
        $db = new PureTripleTriad_Database();
        $history = $db->getAuthorizedGameHistory((int) $gameid, (int) $userid);
        if ($history) {
            return self::parseGameHistoryLog(self::historyPath($history['log_path']));
        }
        $active = $db->getOwnedActiveGame((int) $gameid, (int) $userid);
        if (!$active) {
            throw new RuntimeException('Replay not found.');
        }
        return self::parseGameHistoryLog(self::historyPath((int) $userid . '/' . (int) $gameid . '.jsonl'));
    }

    private static function historyPath($relativePath) {
        if (!preg_match('#^(?:[0-9]+/[0-9]+|tutorials/[1245])\.jsonl$#', $relativePath)) {
            throw new RuntimeException('Replay path is invalid.');
        }
        $path = GAMEHISTORY_PATH . '/' . $relativePath;
        if (!is_file($path)) {
            throw new RuntimeException('Replay data is unavailable.');
        }
        return $path;
    }

    private function generateKey($length = 64) {
        $strong = false;
        $bytes = openssl_random_pseudo_bytes(max(32, (int) ceil($length * 0.75)), $strong);
        if ($bytes === false || !$strong) {
            throw new RuntimeException('Secure random generation is unavailable.');
        }
        return substr(rtrim(strtr(base64_encode($bytes), '+/', '-_'), '='), 0, $length);
    }
    
    private function getOwnershipCountOfOpponentsCards() {
        //get ownership count of opponents cards
        $ownership = array();
        $theircards = array();
        foreach($this->gamecards as $card) {
            //loop through all game cards. 
            if ($card->owner == 1) {
                array_push($theircards, $card);
            }
        }
        foreach($theircards as $card) {
            array_push($ownership, array(
                'gcid'.$card->gamecardid   => $this->p1->getOwnershipCount($card->cardid)
            ));
        }
        return $ownership;
    }
    
    public static function removeValue($array, $val = '', $preserve_keys = false) {
        if (empty($array) || !is_array($array)) return false;
        if (!in_array($val, $array)) return $array;
        
        foreach($array as $key => $value) {
            if ($value == $val) unset($array[$key]);
        }
        
        return ($preserve_keys === true) ? $array : array_values($array);
    }
}
?>
