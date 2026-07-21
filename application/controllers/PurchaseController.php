<?php

class PurchaseController extends Standalone_Controller_Action
{
    public function indexAction()
    {
        try {
            $this->requireCsrf();
            $type = strtolower(trim((string) $this->_getParam('type', '')));
            $itemid = $this->_getParam('id', '');
            $orderid = (string) $this->_getParam('idempotency_key', '');
            if (!in_array($type, array('card', 'color'), true)) {
                throw new InvalidArgumentException('Catalog type is invalid.');
            }
            if (!ctype_digit((string) $itemid) || (int) $itemid < 1) {
                throw new InvalidArgumentException('Catalog item is invalid.');
            }
            if (!preg_match('/^[A-Za-z0-9:_-]{16,96}$/', $orderid)) {
                throw new InvalidArgumentException('Idempotency key is invalid.');
            }
            $result = $this->database->purchaseCatalogItem($this->user->userid, $type, (int) $itemid, $orderid);
            $this->_jsonRespond(array('result' => $result, 'id' => (int) $itemid));
        } catch (Zend_Controller_Action_Exception $e) {
            $this->_jsonError($e->getMessage(), $e->getCode());
        } catch (DomainException $e) {
            $this->_jsonError($e->getMessage(), 402);
        } catch (InvalidArgumentException $e) {
            $this->_jsonError($e->getMessage(), 400);
        } catch (Exception $e) {
            error_log('Purchase failed: ' . $e->getMessage());
            $this->_jsonError('Purchase could not be completed.', 409);
        }
    }
}
