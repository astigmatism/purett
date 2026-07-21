<?php

require_once 'Predis/Autoloader.php';
Predis\Autoloader::register();

class PureTripleTriad_Redis
{
    const LEADERBOARD_KEY = 'leaderboard:three-day';

    private $redis;

    public function __construct()
    {
        $host = getenv('PURETT_REDIS_HOST');
        $port = getenv('PURETT_REDIS_PORT');
        $this->redis = new Predis\Client(array(
            'host' => ($host === false || $host === '') ? 'redis' : $host,
            'port' => ($port === false || $port === '') ? 6379 : (int) $port,
            'database' => 0
        ));
    }

    public function ping()
    {
        // Predis 0.7 normalizes the PONG status reply to boolean true.
        $reply = $this->redis->ping();
        return $reply === true || strtoupper((string) $reply) === 'PONG';
    }

    public function getLeaderboard()
    {
        $cached = $this->redis->get(self::LEADERBOARD_KEY);
        if ($cached !== null) {
            $decoded = json_decode($cached, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
        $database = new PureTripleTriad_Database();
        $leaderboard = $database->getLeaderboard(3);
        $this->setLeaderboard($leaderboard);
        return $leaderboard;
    }

    public function setLeaderboard($leaderboard)
    {
        $this->redis->setex(self::LEADERBOARD_KEY, 3600, json_encode(array_values($leaderboard)));
        return $leaderboard;
    }

    public function invalidateLeaderboard()
    {
        return (int) $this->redis->del(self::LEADERBOARD_KEY);
    }
}
