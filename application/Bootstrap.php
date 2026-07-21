<?php
class Bootstrap extends Zend_Application_Bootstrap_Bootstrap
{
    
    protected function _initPaths()
    {
        define('CONFIGURATION_PATH', APPLICATION_PATH . '/configs');
        define('RUNTIME_PATH', APPLICATION_PATH . '/../var');
        define('GAMEHISTORY_PATH', RUNTIME_PATH . '/gamehistory');
        define('DIALOGS_PATH', APPLICATION_PATH.'/../data/dialogs');

        foreach (array(RUNTIME_PATH, GAMEHISTORY_PATH, RUNTIME_PATH . '/log', RUNTIME_PATH . '/sessions') as $path) {
            if (!is_dir($path)) {
                mkdir($path, 0770, true);
            }
        }
    }
    protected function _initLayout()
    {
        Zend_Layout::startMvc(array('layoutPath' => APPLICATION_PATH . '/views/layouts'));
    }
    
    protected function _initView()
    {
        $view = Zend_Layout::getMvcInstance()->getView();
        $view->setScriptPath(APPLICATION_PATH . '/views/scripts');
        $view->addScriptPath(APPLICATION_PATH . '/views/partials');
        $view->setHelperPath(APPLICATION_PATH . '/views/helpers');
    }
    
    protected function _initLocale()
    {
        Zend_Locale::setDefault('en_US');
    }
    
    protected function _initSessionHandler()
    {
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_secure', (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? '1' : '0');
        if (is_dir(RUNTIME_PATH . '/sessions')) {
            session_save_path(RUNTIME_PATH . '/sessions');
        }
        Zend_Session::start();
    }

    protected function _initResponseHeaders()
    {
        $response = new Zend_Controller_Response_Http();
        $response->setHeader('X-Content-Type-Options', 'nosniff', true);
        $response->setHeader('X-Frame-Options', 'DENY', true);
        $response->setHeader('Referrer-Policy', 'no-referrer', true);
        Zend_Controller_Front::getInstance()->setResponse($response);
    }
}
