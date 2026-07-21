<?php

class AccountController extends Standalone_Controller_Action
{
    public function indexAction()
    {
        $this->_setLayout('auth');
        $this->view->account = $this->account;
    }

    public function deleteAction()
    {
        try {
            $this->requireCsrf();
            $password = (string) $this->_getParam('password', '');
            if (!password_verify($password, $this->account['password_hash'])) {
                $this->_jsonError('Password was not accepted.', 403);
                return;
            }
            $this->user->deleteUser();
            Zend_Session::destroy(true, true);
            $this->_jsonRespond(array('deleted' => true));
        } catch (Zend_Controller_Action_Exception $e) {
            $this->_jsonError($e->getMessage(), $e->getCode());
        } catch (Exception $e) {
            error_log($e->getMessage());
            $this->_jsonError('Account deletion failed.', 500);
        }
    }
}
