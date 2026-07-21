<?php

class Gamehouse_Controller_Action extends Zend_Controller_Action
{
    protected function _setLayout($layoutName)
    {
        $moduleName = $this->_getParam('module');
        $controllerName = $this->_getParam('controller');
        $actionName = $this->_getParam('action');
        $publicPath = realpath(APPLICATION_PATH . '/../public');

        $this->_helper->layout->setLayout($layoutName);
        $view = $this->_helper->layout->getView();

        $cssFiles = array(
            array($publicPath . '/css/' . $moduleName . '.css', '/css/' . $moduleName . '.css'),
            array($publicPath . '/css/' . $moduleName . '/' . $controllerName . '.css', '/css/' . $moduleName . '/' . $controllerName . '.css'),
            array($publicPath . '/css/' . $moduleName . '/' . $controllerName . '/' . $actionName . '.css', '/css/' . $moduleName . '/' . $controllerName . '/' . $actionName . '.css')
        );
        foreach ($cssFiles as $file) {
            if (is_file($file[0])) {
                $view->headLink()->appendStylesheet($file[1]);
            }
        }

        $jsFiles = array(
            array($publicPath . '/js/' . $moduleName . '.js', '/js/' . $moduleName . '.js'),
            array($publicPath . '/js/' . $moduleName . '/' . $controllerName . '.js', '/js/' . $moduleName . '/' . $controllerName . '.js'),
            array($publicPath . '/js/' . $moduleName . '/' . $controllerName . '/' . $actionName . '.js', '/js/' . $moduleName . '/' . $controllerName . '/' . $actionName . '.js')
        );
        foreach ($jsFiles as $file) {
            if (is_file($file[0])) {
                $view->headScript()->appendFile($file[1]);
            }
        }

        $view->headLink()->appendStylesheet('/css/smoothness/jquery-ui-1.8.7.custom.css');
    }

    protected function _jsonRespond($payload, $code = 200)
    {
        $this->_helper->layout->disableLayout();
        $this->_helper->viewRenderer->setNoRender(true);
        $body = json_encode($payload);
        if ($body === false) {
            $code = 500;
            $body = '{"error":"Response encoding failed."}';
        }
        $this->getResponse()
            ->setHttpResponseCode((int) $code)
            ->setHeader('Content-Type', 'application/json; charset=utf-8', true)
            ->setBody($body);
    }

    protected function _jsonError($message, $code)
    {
        $this->_jsonRespond(array('error' => $message), $code);
    }

    protected function _requirePost()
    {
        if (!$this->getRequest()->isPost()) {
            throw new Zend_Controller_Action_Exception('POST required.', 405);
        }
    }
}
