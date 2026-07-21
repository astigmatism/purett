<?php

class ReplayController extends Standalone_Controller_Action
{
    public function indexAction()
    {
        $gameid = $this->_getParam('gameid', '');
        if (!ctype_digit((string) $gameid) || !$this->database->getAuthorizedGameHistory((int) $gameid, $this->user->userid)) {
            throw new Zend_Controller_Action_Exception('Replay not found.', 404);
        }
        $this->_helper->redirector->gotoUrl('/?replay=' . (int) $gameid);
    }
}
