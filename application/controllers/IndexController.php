<?php

class IndexController extends Standalone_Controller_Action
{
    public function indexAction()
    {
        $boot = $this->bootData();
        $requestedReplay = $this->_getParam('replay', '');
        if ($requestedReplay !== '') {
            if (!ctype_digit((string) $requestedReplay)) {
                throw new Zend_Controller_Action_Exception('Replay not found.', 404);
            }
            $history = $this->database->getAuthorizedGameHistory((int) $requestedReplay, $this->user->userid);
            if (!$history) {
                throw new Zend_Controller_Action_Exception('Replay not found.', 404);
            }
            $boot['requestedReplay'] = (int) $requestedReplay;
        }
        $latest = $this->database->getLatestGameHistoryForUser($this->user->userid);
        $boot['latestReplay'] = $latest ? (int) $latest['gameid'] : null;

        $this->view->bootData = json_encode($boot, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
        $this->_setLayout('standalone');
    }

    public function tosAction()
    {
        $this->_setLayout('auth');
    }

    public function colorAction()
    {
        try {
            $this->requireCsrf();
            $color = strtolower(trim((string) $this->_getParam('color', 'blue')));
            if (!in_array($color, $this->user->colors, true)) {
                throw new InvalidArgumentException('That deck color is not owned by this account.');
            }
            $this->user->setUserOption(1, $color === 'blue' ? null : $color);
            $this->_jsonRespond(array('color' => base64_encode($color)));
        } catch (Zend_Controller_Action_Exception $e) {
            $this->_jsonError($e->getMessage(), $e->getCode());
        } catch (InvalidArgumentException $e) {
            $this->_jsonError($e->getMessage(), 400);
        }
    }

    public function meAction()
    {
        try {
            $this->requireCsrf();
            $gamecardid = $this->_getParam('yasidhnqwkjnsljdansflcknaslksjdlan', '');
            $position = $this->_getParam('woaijsdlkjqwpoijdlksjalwjdjkaclskd', '');
            $key = (string) $this->_getParam('toiueniowineoimowekorurioieqppwodo', '');
            if (!ctype_digit((string) $gamecardid) || !preg_match('/^[0-8]$/', (string) $position)) {
                throw new InvalidArgumentException('Card or board position is invalid.');
            }
            if (!preg_match('/^[A-Za-z0-9_-]{32,128}$/', $key)) {
                throw new InvalidArgumentException('Turn token is invalid.');
            }
            $game = new PureTripleTriad_Game($this->user);
            $response = $game->me((int) $gamecardid, (int) $position, $this->user->userid, $key);
            $this->_jsonRespond($response);
        } catch (Zend_Controller_Action_Exception $e) {
            $this->_jsonError($e->getMessage(), $e->getCode());
        } catch (InvalidArgumentException $e) {
            $this->_jsonError($e->getMessage(), 400);
        } catch (Exception $e) {
            error_log('Move rejected: ' . $e->getMessage());
            $this->_jsonError('The move could not be applied.', 409);
        }
    }

    public function reviewDataAction()
    {
        try {
            $gameid = $this->_getParam('gameid', '');
            $this->_jsonRespond(PureTripleTriad_Game::reviewData($gameid, $this->user->userid));
        } catch (InvalidArgumentException $e) {
            $this->_jsonError($e->getMessage(), 400);
        } catch (Exception $e) {
            $this->_jsonError('Replay not found.', 404);
        }
    }

    public function gameAction()
    {
        try {
            $this->requireCsrf();
            $game = new PureTripleTriad_Game($this->user);
            $result = $game->getClientData();
            if ($game->firstturn) {
                $game->firstturn = false;
                $result['ppqoowoieoiqpoipieoicojqpojow'] = $game->them();
            }
            $this->_jsonRespond($result);
        } catch (Zend_Controller_Action_Exception $e) {
            $this->_jsonError($e->getMessage(), $e->getCode());
        } catch (Exception $e) {
            error_log('Game start failed: ' . $e->getMessage());
            $this->_jsonError('The game could not be started.', 409);
        }
    }

    public function deckManageAction()
    {
        if ($this->user->ingame) {
            $this->_jsonError('The deck cannot be managed during a game.', 409);
            return;
        }
        $this->_jsonRespond($this->user->deck);
    }

    public function setHandAction()
    {
        try {
            $this->requireCsrf();
            $cardids = (string) $this->_getParam('oiuqwoiuoioasiuodijoqoqiwpj', '');
            $this->_jsonRespond($this->user->setHand($cardids));
        } catch (Zend_Controller_Action_Exception $e) {
            $this->_jsonError($e->getMessage(), $e->getCode());
        } catch (InvalidArgumentException $e) {
            $this->_jsonError($e->getMessage(), 400);
        } catch (Exception $e) {
            error_log('Hand update failed: ' . $e->getMessage());
            $this->_jsonError('The active hand could not be updated.', 500);
        }
    }

    public function reviewAction()
    {
        try {
            $gameid = $this->_getParam('gameid', '');
            $this->_jsonRespond(PureTripleTriad_Game::review($gameid, $this->user->userid));
        } catch (InvalidArgumentException $e) {
            $this->_jsonError($e->getMessage(), 400);
        } catch (Exception $e) {
            $this->_jsonError('Replay not found.', 404);
        }
    }

    public function claimAction()
    {
        try {
            $this->requireCsrf();
            $gameid = $this->_getParam('kkjdoqijwoijofijoqiwoiueioqiw', '');
            $gamecardid = $this->_getParam('iqowijdoicqkwjklcnmknbfguttgo', '');
            if (!ctype_digit((string) $gameid) || !ctype_digit((string) $gamecardid)) {
                throw new InvalidArgumentException('Claim identifiers are invalid.');
            }
            $game = new PureTripleTriad_Game($this->user);
            $this->_jsonRespond($game->claim($this->user->userid, (int) $gameid, (int) $gamecardid));
        } catch (Zend_Controller_Action_Exception $e) {
            $this->_jsonError($e->getMessage(), $e->getCode());
        } catch (InvalidArgumentException $e) {
            $this->_jsonError($e->getMessage(), 400);
        } catch (Exception $e) {
            error_log('Claim rejected: ' . $e->getMessage());
            $this->_jsonError('The card claim could not be applied.', 409);
        }
    }

    public function getShopAction()
    {
        try {
            $this->_jsonRespond(PureTripleTriad_User::getShopStock($this->user, (int) $this->config->shopCardCount));
        } catch (Exception $e) {
            error_log('Shop generation failed: ' . $e->getMessage());
            $this->_jsonError('Shop stock is unavailable.', 500);
        }
    }

    public function bugAction()
    {
        $this->saveFeedback('bug');
    }

    public function feedbackAction()
    {
        $this->saveFeedback('feedback');
    }

    private function saveFeedback($type)
    {
        try {
            $this->requireCsrf();
            $message = trim((string) $this->_getParam('bug', ''));
            if ($message === '' || strlen($message) > 4000) {
                throw new InvalidArgumentException('Feedback must be between 1 and 4000 characters.');
            }
            $this->database->recordFeedback($this->user->userid, $this->user->ingame, $type, $message);
            $this->_jsonRespond(array('saved' => true));
        } catch (Zend_Controller_Action_Exception $e) {
            $this->_jsonError($e->getMessage(), $e->getCode());
        } catch (InvalidArgumentException $e) {
            $this->_jsonError($e->getMessage(), 400);
        } catch (Exception $e) {
            error_log('Feedback save failed: ' . $e->getMessage());
            $this->_jsonError('Feedback could not be saved.', 500);
        }
    }
}
