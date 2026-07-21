<?php

class AuthController extends Gamehouse_Controller_Action
{
    private $session;
    private $database;

    public function init()
    {
        parent::init();
        $this->session = new Zend_Session_Namespace('purett');
        $this->database = new PureTripleTriad_Database();
        if (!isset($this->session->csrf) || !is_string($this->session->csrf)) {
            $this->session->csrf = $this->newToken();
        }
        $this->view->csrfToken = $this->session->csrf;
        $this->_setLayout('auth');
    }

    public function indexAction()
    {
        $this->_helper->redirector->gotoUrl('/auth/login');
    }

    public function loginAction()
    {
        if (isset($this->session->userid)) {
            $this->_helper->redirector->gotoUrl('/');
            return;
        }
        if (!$this->getRequest()->isPost()) {
            return;
        }
        if (!$this->validCsrf()) {
            $this->getResponse()->setHttpResponseCode(403);
            $this->view->error = 'Your form expired. Please try again.';
            return;
        }

        $username = strtolower(trim((string) $this->_getParam('username', '')));
        $password = (string) $this->_getParam('password', '');
        $account = $this->database->getLocalAccountByUsername($username);
        if (!$account || (int) $account['disabled'] === 1 || !password_verify($password, $account['password_hash'])) {
            usleep(200000);
            $this->getResponse()->setHttpResponseCode(401);
            $this->view->error = 'Username or password was not accepted.';
            return;
        }

        session_regenerate_id(true);
        $this->session->userid = (int) $account['userid'];
        $this->session->csrf = $this->newToken();
        $this->_helper->redirector->gotoUrl('/');
    }

    public function registerAction()
    {
        if (isset($this->session->userid)) {
            $this->_helper->redirector->gotoUrl('/');
            return;
        }
        if (!$this->getRequest()->isPost()) {
            return;
        }
        if (!$this->validCsrf()) {
            $this->getResponse()->setHttpResponseCode(403);
            $this->view->error = 'Your form expired. Please try again.';
            return;
        }

        $username = strtolower(trim((string) $this->_getParam('username', '')));
        $displayName = trim((string) $this->_getParam('display_name', ''));
        $password = (string) $this->_getParam('password', '');
        $email = trim((string) $this->_getParam('email', ''));

        if (!preg_match('/^[a-z0-9][a-z0-9_.-]{2,31}$/', $username)) {
            $this->view->error = 'Username must be 3–32 characters using letters, numbers, dot, dash, or underscore.';
            return;
        }
        if ($displayName === '' || strlen($displayName) > 80) {
            $this->view->error = 'Display name must be 1–80 characters.';
            return;
        }
        if (strlen($password) < 10 || strlen($password) > 128) {
            $this->view->error = 'Password must be 10–128 characters.';
            return;
        }
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->view->error = 'Email address is not valid.';
            return;
        }

        try {
            $account = $this->database->createLocalAccount(
                $username,
                $displayName,
                password_hash($password, PASSWORD_DEFAULT),
                $email,
                200
            );
            session_regenerate_id(true);
            $this->session->userid = (int) $account['userid'];
            $this->session->csrf = $this->newToken();
            $this->_helper->redirector->gotoUrl('/');
        } catch (Exception $e) {
            $this->getResponse()->setHttpResponseCode(400);
            $this->view->error = 'That username is unavailable or the account could not be created.';
        }
    }

    public function logoutAction()
    {
        if (!$this->getRequest()->isPost() || !$this->validCsrf()) {
            $this->getResponse()->setHttpResponseCode(403);
            $this->_helper->redirector->gotoUrl('/auth/login');
            return;
        }
        $this->destroySession();
        $this->_helper->redirector->gotoUrl('/auth/login');
    }

    private function validCsrf()
    {
        $token = (string) $this->_getParam('csrf_token', '');
        return isset($this->session->csrf) && hash_equals($this->session->csrf, $token);
    }

    private function newToken()
    {
        $strong = false;
        $bytes = openssl_random_pseudo_bytes(32, $strong);
        if ($bytes === false || !$strong) {
            throw new RuntimeException('Secure random generation is unavailable.');
        }
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }

    private function destroySession()
    {
        Zend_Session::destroy(true, true);
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], true);
        }
    }
}
