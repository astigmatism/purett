<?php
require_once 'Facebook/facebook.php';

class Facebook_Controller_Action extends Gamehouse_Controller_Action {

    //the follow var holds all configuration values from games.ini
    public $config;
    
    //Facebook api
    public $facebook;
    
    //global user
    public $user;       //will hold the global User object for this player
    
    /**
     * init()
     *
     * This is the first method that gets invoked by the dispatch process.
     * Use this methods to set up instance variables that need to be shared
     * among all action methods.
     */
    public function init() {
        
        $this->config = new Zend_Config_Ini(APPLICATION_PATH.'/configs/game.ini');
        $layoutView = $this->_helper->layout->getView();
        
        
        $this->facebook = new Facebook(array(
            'appId'  => $this->config->appId,
            'secret' => $this->config->apiSecret,
            'cookie' => true
        ));
        
        $actionName = $this->_getParam('action');
        $session = $this->facebook->getUser();
        
        if ($session) {
            try {
                $uid = $this->facebook->getUser();
                $this->facebook->me = $this->facebook->api('/me'); //try api connect
                
                $this->user = new PureTripleTriad_User($uid, $this->facebook->me);
                
                //get next game info
                $rules = array();
                if (!$this->user->ingame) {
                    $rules = PureTripleTriad_Game::getNextRules($this->user->wins, $this->user->losses, $this->user->draws);
                }
                
                //calculate number of seconds until next 5min invertal (when cron runs to up lives)
                $minutesRemaining = (($this->config->turnInterval / 60) - date('i') % ($this->config->turnInterval / 60));
                $secondsRemaining = $this->config->turnInterval - (date('s') + ((($this->config->turnInterval / 60) - $minutesRemaining) * 60)) % $this->config->turnInterval;
                
                //data used upfront to avoid an additional callback
                $layoutView->headScript()->appendScript('gh.data = { 
                    "appid": '.$this->config->appId.', 
                    "ingame": '.$this->user->ingame.', 
                    "hand": '.json_encode($this->user->hand).', 
                    "deckcount":'.count($this->user->deck).', 
                    "name": "'.$this->facebook->me['name'].'", 
                    "wins": '.$this->user->wins.', 
                    "losses":'.$this->user->losses.', 
                    "draws": '.$this->user->draws.', 
                    "turns": '.$this->user->getTurns().', 
                    "fbid":'.$this->facebook->me.' ,
                    "nextrules": '.json_encode($rules).',
                    "more": '.$secondsRemaining.', 
                    "turninterval": '.$this->config->turnInterval.', 
                    "credits": '.$this->creditsBalance().', 
                    "colors": '.json_encode($this->user->colors).', 
                    "color": "'.(isset($this->user->options['color']) ? base64_encode($this->user->options['color']) : 'blue').'"
                }');
                
            } catch (FacebookApiException $e) {
                //invalid access token. get a new one
                //for fb connect, set flag and allow client to handle (render button)
                if ($actionName != 'connect') {
                    if (isset($this->_request->code)) {
                        $url = "https://graph.facebook.com/oauth/access_token" . 
                               "?client_id=" . $this->config->appId .
                               "&scope=" . $this->config->requirePermissions .
                               "&redirect_uri=" . urlencode($this->redirectUrl()) . 
                               "&client_secret=" . $this->config->apiSecret . 
                               "&code=" . $this->_request->code . 
                               "&display=popup";
                        $response = $this->curl_get_file_contents($url);
                        
                        //facebook suggests we perform a client redirect and not a php redirect
                        $this->scriptRedirect($url);
                    } else {
                        //redirect back with a new code
                        $url= "https://www.facebook.com/dialog/oauth?client_id=".$this->config->appId."&scope=".$this->config->connectPermissions."&redirect_uri=".urlencode($this->redirectUrl());
                        
                        //facebook suggests we perform a client redirect and not a php redirect
                        $this->scriptRedirect($url);
                    }
                } else {
                    $this->connected = false;
                }
            }
        } else {
            $this->forceFacebookLogin($this->redirectUrl() );
        }
        
        parent::init();
    }
    
    
    public function creditsBalanceAction() {
        //ajax endpoint
        $this->_jsonRespond($this->creditsBalance());
    }
    
    public function creditsBalance() {
        $token = $this->getApplicationAccessToken(); //get application access token
        
        $response = json_decode( 
            file_get_contents(
                'https://api.facebook.com/method/users.getStandardinfo?uids=' . 
                $this->facebook->me['id'] . 
                '&fields=credit_balance&access_token=' . $token . '&format=json'
            )
        );
        if (is_array($response) && isset($response[0]->credit_balance)) {
            return $response[0]->credit_balance;
        }
        return 0;
    }
    
    private function getApplicationAccessToken() {
        if (!isset($this->facebook->applicationaccesstoken)) {
            $applicationTokenUrl = "https://graph.facebook.com/oauth/access_token" . 
                                   "?client_id=" . $this->config->appId .
                                   "&client_secret=" . $this->config->apiSecret .
                                   "&grant_type=client_credentials";
            $this->facebook->applicationaccesstoken = str_replace(
                'access_token=', '', file_get_contents($applicationTokenUrl)
            );
        }
        return $this->facebook->applicationaccesstoken;
    }
    
    private function forceFacebookLogin($next = null) {
        $options = array(
            'canvas'        => 1,
            'fbconnect'     => 0,
            'scope'     => $this->config->requirePermissions
        );
        
        if (isset($next)) {
            $options['redirect_uri'] = $next;
        }
        
        $url = $this->facebook->getLoginUrl($options);
        //facebook suggests we perform a client redirect and not a php redirect
        $this->scriptRedirect($url);
    }
    
    private function scriptRedirect($url) {
        echo "<html><head></head><body><script type='text/javascript'>top.location.href='" . $url . "';</script></body></html>";
        die();
    }
    
    private function redirectUrl() {
        $url = $this->config->canvasUrl;
        $normalizedParams = "";
       
        //Remove special values so Facebook does not have conflicts
        foreach ($_GET as $key => $value) {
            if ($key != "code" && $key != "state") {
                if ($value) {
                    $normalizedParams .= $key . "=" . $value . "&";
                }
            }
        }

        //Remove the last amp
        $normalizedParams = substr( $normalizedParams, 0, strlen($normalizedParams) - 1);
        $url .= '?' . $normalizedParams;
        return $url;
    }
    
    // You can find the following functions and more details
      // on http://developers.facebook.com/docs/authentication/canvas.
    public function parse_signed_request($signed_request, $app_secret) {
            list($encoded_sig, $payload) = explode('.', $signed_request, 2);
        
            // Decode the data
            $sig = $this->base64_url_decode($encoded_sig);
            $data = json_decode($this->base64_url_decode($payload), true);
        
            if (strtoupper($data['algorithm']) !== 'HMAC-SHA256') {
              error_log('Unknown algorithm. Expected HMAC-SHA256');
              return null;
            }
        
            // Check signature
            $expected_sig = hash_hmac('sha256', $payload, $app_secret, $raw = true);
            if ($sig !== $expected_sig) {
              error_log('Bad Signed JSON signature!');
              return null;
            }
        
            return $data;
      }
      
     private function base64_url_decode($input) {
        return base64_decode(strtr($input, '-_', '+/'));
      }
}
?>