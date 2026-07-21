<?php

class HealthController extends Gamehouse_Controller_Action
{
    public function indexAction()
    {
        $checks = array(
            'application' => true,
            'database' => false,
            'redis' => false,
            'schema' => null,
            'history_writable' => false,
            'log_writable' => false
        );
        try {
            $database = new PureTripleTriad_Database();
            $checks['database'] = $database->ping();
            $checks['schema'] = $database->getSchemaVersion();
        } catch (Exception $e) {
            error_log('Health database check failed: ' . $e->getMessage());
        }
        try {
            $redis = new PureTripleTriad_Redis();
            $checks['redis'] = $redis->ping();
        } catch (Exception $e) {
            error_log('Health cache check failed: ' . $e->getMessage());
        }
        $checks['history_writable'] = defined('GAMEHISTORY_PATH') && is_dir(GAMEHISTORY_PATH) && is_writable(GAMEHISTORY_PATH);
        $checks['log_writable'] = defined('RUNTIME_PATH') && is_dir(RUNTIME_PATH . '/log') && is_writable(RUNTIME_PATH . '/log');
        $ok = !in_array(false, array(
            $checks['application'],
            $checks['database'],
            $checks['redis'],
            $checks['history_writable'],
            $checks['log_writable']
        ), true) && $checks['schema'] !== null;
        $this->_jsonRespond(array('status' => $ok ? 'ok' : 'error', 'checks' => $checks), $ok ? 200 : 503);
    }
}
