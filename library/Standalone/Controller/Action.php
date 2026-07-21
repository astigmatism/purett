<?php

class Standalone_Controller_Action extends Gamehouse_Controller_Action
{
    public $config;
    public $user;
    public $account;
    protected $session;
    protected $database;

    public function init()
    {
        parent::init();
        $this->config = new Zend_Config_Ini(APPLICATION_PATH . '/configs/game.ini');
        $this->session = new Zend_Session_Namespace('purett');
        $this->database = new PureTripleTriad_Database();

        $userid = isset($this->session->userid) ? (int) $this->session->userid : 0;
        $this->account = ($userid >= 2) ? $this->database->getLocalAccountByUserId($userid) : false;
        if (!$this->account || (int) $this->account['disabled'] === 1 || $this->account['deleted_at'] !== null) {
            unset($this->session->userid);
            if ($this->isJsonRequest()) {
                $this->_jsonError('Authentication required.', 401);
                return;
            }
            $this->_helper->redirector->gotoUrl('/auth/login');
            return;
        }

        if (!isset($this->session->csrf) || !is_string($this->session->csrf)) {
            $this->session->csrf = $this->generateToken(32);
        }
        $this->user = new PureTripleTriad_User($userid, $this->account);
        $this->view->currentAccount = $this->account;
        $this->view->csrfToken = $this->session->csrf;
    }

    public function dispatch($action)
    {
        // init() has already produced either a login redirect or a JSON 401.
        // Do not invoke an action with a missing user and let it overwrite that
        // response or dereference a null account.
        if (!$this->account) {
            return;
        }
        parent::dispatch($action);
    }

    protected function isJsonRequest()
    {
        $request = $this->getRequest();
        if ($request->isXmlHttpRequest()) {
            return true;
        }
        $accept = isset($_SERVER['HTTP_ACCEPT']) ? $_SERVER['HTTP_ACCEPT'] : '';
        if (stripos($accept, 'application/json') !== false) {
            return true;
        }
        return $this->_getParam('action') !== 'index';
    }

    protected function generateToken($bytes)
    {
        $strong = false;
        $random = openssl_random_pseudo_bytes($bytes, $strong);
        if ($random === false || !$strong) {
            throw new RuntimeException('Secure random generation is unavailable.');
        }
        return rtrim(strtr(base64_encode($random), '+/', '-_'), '=');
    }

    protected function requireCsrf()
    {
        $this->_requirePost();
        $token = isset($_SERVER['HTTP_X_CSRF_TOKEN']) ? $_SERVER['HTTP_X_CSRF_TOKEN'] : $this->_getParam('csrf_token', '');
        if (!is_string($token) || !hash_equals($this->session->csrf, $token)) {
            throw new Zend_Controller_Action_Exception('Invalid CSRF token.', 403);
        }
    }

    protected function bootData()
    {
        $rules = array();
        if (!$this->user->ingame) {
            $rules = PureTripleTriad_Game::getNextRules($this->user->wins, $this->user->losses, $this->user->draws);
        }
        $redis = new PureTripleTriad_Redis();
        return array(
            'ingame' => (int) $this->user->ingame,
            'hand' => $this->user->hand,
            'deckcount' => count($this->user->deck),
            'name' => $this->account['display_name'],
            'userid' => (int) $this->user->userid,
            'wins' => (int) $this->user->wins,
            'losses' => (int) $this->user->losses,
            'draws' => (int) $this->user->draws,
            'nextrules' => $rules,
            'coins' => $this->database->getWalletBalance($this->user->userid),
            'colors' => $this->user->colors,
            'color' => base64_encode($this->user->options['color']),
            'csrf' => $this->session->csrf,
            'leaderboard' => $redis->getLeaderboard(),
            'profile' => array(
                'id' => (int) $this->user->userid,
                'display_name' => $this->account['display_name']
            )
        );
    }
}
